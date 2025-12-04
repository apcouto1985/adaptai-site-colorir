import { TransformEngine } from '../TransformEngine.js';
import { JSDOM } from 'jsdom';
import fc from 'fast-check';

describe('TransformEngine - Property-Based Tests', () => {
  let engine;
  let dom;
  let document;

  beforeEach(() => {
    engine = new TransformEngine();
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
  });

  // Gerador de elementos SVG
  const svgElementGenerator = fc.record({
    tagName: fc.constantFrom('path', 'rect', 'circle', 'polygon', 'ellipse'),
    fill: fc.oneof(
      fc.constant('none'),
      fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
      fc.constantFrom('#000000', '#222221', '#B5B5B5', '#FFFFFF')
    ),
    stroke: fc.oneof(
      fc.constant(null),
      fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`)
    ),
    strokeWidth: fc.oneof(
      fc.constant(null),
      fc.integer({ min: 0, max: 10 }).map(n => n.toString())
    ),
    id: fc.oneof(
      fc.constant(null),
      fc.string({ minLength: 1, maxLength: 20 })
    )
  });

  /**
   * Feature: svg-auto-adapter, Property 4: Atribuição sequencial de IDs únicos
   * Validates: Requirements 3.1, 3.2, 3.4
   */
  test('property: IDs são únicos e sequenciais começando em 1', () => {
    fc.assert(
      fc.property(
        fc.array(svgElementGenerator, { minLength: 1, maxLength: 20 }),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const colorableElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            if (spec.fill) el.setAttribute('fill', spec.fill);
            if (spec.stroke) el.setAttribute('stroke', spec.stroke);
            if (spec.strokeWidth) el.setAttribute('stroke-width', spec.strokeWidth);
            if (spec.id) el.setAttribute('id', spec.id);
            svg.appendChild(el);
            return { element: el };
          });

          const classification = {
            colorable: colorableElements,
            decorative: []
          };

          const result = engine.transform(svg, classification);

          // Verificar que todos os IDs são únicos
          const ids = colorableElements.map(el => el.element.getAttribute('id'));
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);

          // Verificar que IDs são sequenciais começando em 1
          colorableElements.forEach((el, index) => {
            expect(el.element.getAttribute('id')).toBe(`area-${index + 1}`);
          });

          // Verificar estatísticas
          expect(result.stats.idsAssigned).toBe(colorableElements.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 5: Substituição de IDs existentes
   * Validates: Requirements 3.3
   */
  test('property: IDs existentes são substituídos corretamente', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...svgElementGenerator.value,
            id: fc.string({ minLength: 1, maxLength: 20 })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const colorableElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            el.setAttribute('id', spec.id);
            if (spec.fill) el.setAttribute('fill', spec.fill);
            if (spec.stroke) el.setAttribute('stroke', spec.stroke);
            svg.appendChild(el);
            return { element: el, oldId: spec.id };
          });

          const classification = {
            colorable: colorableElements,
            decorative: []
          };

          engine.transform(svg, classification);

          // Verificar que todos os IDs antigos foram substituídos
          colorableElements.forEach((el, index) => {
            const newId = el.element.getAttribute('id');
            expect(newId).toBe(`area-${index + 1}`);
            expect(newId).not.toBe(el.oldId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 6: Preservação da ordem DOM
   * Validates: Requirements 3.5
   */
  test('property: ordem dos elementos não muda após transformação', () => {
    fc.assert(
      fc.property(
        fc.array(svgElementGenerator, { minLength: 2, maxLength: 20 }),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const colorableElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            if (spec.fill) el.setAttribute('fill', spec.fill);
            if (spec.stroke) el.setAttribute('stroke', spec.stroke);
            svg.appendChild(el);
            return { element: el };
          });

          // Capturar ordem antes da transformação
          const orderBefore = Array.from(svg.children);

          const classification = {
            colorable: colorableElements,
            decorative: []
          };

          engine.transform(svg, classification);

          // Verificar que ordem permanece a mesma
          const orderAfter = Array.from(svg.children);
          expect(orderAfter.length).toBe(orderBefore.length);
          orderAfter.forEach((el, index) => {
            expect(el).toBe(orderBefore[index]);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 7: Marcação de elementos decorativos
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4
   */
  test('property: elementos decorativos recebem pointer-events="none" e preservam outros atributos', () => {
    fc.assert(
      fc.property(
        fc.array(svgElementGenerator, { minLength: 1, maxLength: 20 }),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const decorativeElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            if (spec.fill) el.setAttribute('fill', spec.fill);
            if (spec.stroke) el.setAttribute('stroke', spec.stroke);
            if (spec.strokeWidth) el.setAttribute('stroke-width', spec.strokeWidth);
            svg.appendChild(el);
            return { 
              element: el,
              originalFill: spec.fill,
              originalStroke: spec.stroke,
              originalStrokeWidth: spec.strokeWidth
            };
          });

          const classification = {
            colorable: [],
            decorative: decorativeElements
          };

          const result = engine.transform(svg, classification);

          // Verificar que pointer-events="none" foi adicionado
          decorativeElements.forEach(el => {
            expect(el.element.getAttribute('pointer-events')).toBe('none');
          });

          // Verificar que outros atributos foram preservados
          decorativeElements.forEach(el => {
            if (el.originalFill) {
              expect(el.element.getAttribute('fill')).toBe(el.originalFill);
            }
            if (el.originalStroke) {
              expect(el.element.getAttribute('stroke')).toBe(el.originalStroke);
            }
            if (el.originalStrokeWidth) {
              expect(el.element.getAttribute('stroke-width')).toBe(el.originalStrokeWidth);
            }
          });

          // Verificar estatísticas
          expect(result.stats.pointerEventsAdded).toBe(decorativeElements.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 8: Ajuste de stroke-width
   * Validates: Requirements 5.2, 5.3, 5.4, 5.5
   */
  test('property: stroke-width é ajustado para mínimo 2px', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...svgElementGenerator.value,
            strokeWidth: fc.oneof(
              fc.constant(null),
              fc.integer({ min: 0, max: 10 }).map(n => n.toString())
            )
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const colorableElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            if (spec.strokeWidth) el.setAttribute('stroke-width', spec.strokeWidth);
            svg.appendChild(el);
            return { 
              element: el,
              originalStrokeWidth: spec.strokeWidth ? parseFloat(spec.strokeWidth) : 0
            };
          });

          const classification = {
            colorable: colorableElements,
            decorative: []
          };

          engine.transform(svg, classification);

          // Verificar que stroke-width é >= 2
          colorableElements.forEach(el => {
            const strokeWidth = parseFloat(el.element.getAttribute('stroke-width'));
            expect(strokeWidth).toBeGreaterThanOrEqual(2);

            // Se original era >= 2, deve ser preservado
            if (el.originalStrokeWidth >= 2) {
              expect(strokeWidth).toBe(el.originalStrokeWidth);
            } else {
              // Se original era < 2, deve ser ajustado para 2
              expect(strokeWidth).toBe(2);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 9: Limpeza de fill em áreas coloríveis
   * Validates: Requirements 6.1, 6.2, 6.3, 6.5
   */
  test('property: fill é definido como "none" em áreas coloríveis', () => {
    fc.assert(
      fc.property(
        fc.array(svgElementGenerator, { minLength: 1, maxLength: 20 }),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const colorableElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            if (spec.fill) el.setAttribute('fill', spec.fill);
            svg.appendChild(el);
            return { 
              element: el,
              originalFill: spec.fill
            };
          });

          const classification = {
            colorable: colorableElements,
            decorative: []
          };

          engine.transform(svg, classification);

          // Verificar que todos têm fill="none"
          colorableElements.forEach(el => {
            expect(el.element.getAttribute('fill')).toBe('none');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 10: Preservação de fill em decorativos
   * Validates: Requirements 6.4
   */
  test('property: fill é preservado em elementos decorativos', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            ...svgElementGenerator.value,
            fill: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`)
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (elementSpecs) => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const decorativeElements = elementSpecs.map(spec => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', spec.tagName);
            el.setAttribute('fill', spec.fill);
            svg.appendChild(el);
            return { 
              element: el,
              originalFill: spec.fill
            };
          });

          const classification = {
            colorable: [],
            decorative: decorativeElements
          };

          engine.transform(svg, classification);

          // Verificar que fill foi preservado
          decorativeElements.forEach(el => {
            expect(el.element.getAttribute('fill')).toBe(el.originalFill);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
