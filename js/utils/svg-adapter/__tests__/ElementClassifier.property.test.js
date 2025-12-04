import { ElementClassifier } from '../ElementClassifier.js';
import fc from 'fast-check';

describe('ElementClassifier - Property-Based Tests', () => {
  let classifier;

  beforeEach(() => {
    classifier = new ElementClassifier();
  });

  /**
   * Feature: svg-auto-adapter, Property 3: Classificação baseada em heurísticas
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  it('property: classificação segue heurísticas definidas', () => {
    const elementInfoGenerator = fc.record({
      tagName: fc.constantFrom('path', 'rect', 'circle', 'polygon', 'ellipse'),
      fill: fc.oneof(
        fc.constant('none'),
        fc.constant(null),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`),
        fc.constantFrom('#000000', '#222221', '#B5B5B5', '#FFFFFF', 'black', 'white', 'gray')
      ),
      stroke: fc.oneof(
        fc.constant(null),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => `#${h}`)
      ),
      bounds: fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
        width: fc.integer({ min: 1, max: 500 }),
        height: fc.integer({ min: 1, max: 500 })
      }).map(b => ({ ...b, area: b.width * b.height }))
    });

    fc.assert(
      fc.property(elementInfoGenerator, (elementInfo) => {
        const result = classifier.classifyElement(elementInfo);
        
        // Verificar que resultado é válido
        expect(['colorable', 'decorative']).toContain(result);
        
        // Verificar heurísticas na ordem de precedência (como implementado)
        
        // Heurística 1 (maior precedência): fill="none" + stroke → colorível
        if (elementInfo.fill === 'none' && elementInfo.stroke) {
          expect(result).toBe('colorable');
          return; // Heurística 1 tem precedência, não verificar outras
        }
        
        // Heurística 2: área < 100px² → decorativo
        if (elementInfo.bounds.area < 100) {
          expect(result).toBe('decorative');
          return; // Heurística 2 aplicada, não verificar outras
        }
        
        // Heurística 3: cores decorativas → decorativo
        const decorativeColors = ['#000000', '#222221', '#B5B5B5', '#FFFFFF', 'black', 'white', 'gray', 'grey'];
        if (elementInfo.fill && decorativeColors.some(c => c.toUpperCase() === elementInfo.fill.toUpperCase())) {
          expect(result).toBe('decorative');
          return; // Heurística 3 aplicada, não verificar outras
        }
        
        // Heurística 4: fill com cor + stroke → decorativo
        if (elementInfo.fill && elementInfo.fill !== 'none' && elementInfo.stroke) {
          expect(result).toBe('decorative');
          return; // Heurística 4 aplicada
        }
        
        // Padrão: colorível
        expect(result).toBe('colorable');
      }),
      { numRuns: 100 }
    );
  });

  it('property: classify retorna estrutura correta para qualquer array de elementos', () => {
    const elementsGenerator = fc.array(
      fc.record({
        tagName: fc.constantFrom('path', 'rect', 'circle'),
        fill: fc.oneof(fc.constant('none'), fc.constant('#FF0000'), fc.constant('#000000')),
        stroke: fc.oneof(fc.constant(null), fc.constant('#000000')),
        bounds: fc.record({
          x: fc.integer({ min: 0, max: 100 }),
          y: fc.integer({ min: 0, max: 100 }),
          width: fc.integer({ min: 1, max: 200 }),
          height: fc.integer({ min: 1, max: 200 })
        }).map(b => ({ ...b, area: b.width * b.height }))
      }),
      { minLength: 0, maxLength: 20 }
    );

    fc.assert(
      fc.property(elementsGenerator, (elements) => {
        const result = classifier.classify(elements);
        
        // Verificar estrutura do resultado
        expect(result).toHaveProperty('colorable');
        expect(result).toHaveProperty('decorative');
        expect(Array.isArray(result.colorable)).toBe(true);
        expect(Array.isArray(result.decorative)).toBe(true);
        
        // Verificar que todos os elementos foram classificados
        const totalClassified = result.colorable.length + result.decorative.length;
        expect(totalClassified).toBe(elements.length);
      }),
      { numRuns: 100 }
    );
  });
});
