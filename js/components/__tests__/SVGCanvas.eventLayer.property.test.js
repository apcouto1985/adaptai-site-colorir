/**
 * Feature: svg-area-selection-fix, Property 12: Camada de resposta a eventos
 * Validates: Requirements 3.4
 * 
 * Para qualquer desenho SVG com múltiplas camadas, apenas os elementos da camada 
 * de áreas coloríveis devem responder a eventos de clique.
 */

import * as fc from 'fast-check';
import { SVGCanvas } from '../SVGCanvas.js';

describe('Property 12: Camada de resposta a eventos', () => {
  /**
   * Gerador de estrutura SVG com múltiplas camadas
   * Cria SVGs com áreas coloríveis e elementos decorativos
   */
  const svgStructureGenerator = fc.record({
    colorableAreas: fc.array(
      fc.record({
        id: fc.nat({ max: 50 }).map(n => `area-${n + 1}`),
        fill: fc.constant('#FFFFFF')
      }),
      { minLength: 1, maxLength: 10 }
    ),
    decorativeElements: fc.array(
      fc.record({
        id: fc.nat({ max: 50 }).map(n => `area-${n + 100}`),
        fill: fc.oneof(
          fc.constant('#B5B5B5'),
          fc.constant('#222221'),
          fc.constant('#000000')
        )
      }),
      { minLength: 0, maxLength: 5 }
    )
  });

  /**
   * Cria um SVG DOM a partir de uma estrutura
   */
  function createSVGFromStructure(structure) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 200 200');

    // Adicionar áreas coloríveis (sem pointer-events="none")
    structure.colorableAreas.forEach((area, index) => {
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('id', area.id);
      rect.setAttribute('x', String(index * 20));
      rect.setAttribute('y', '0');
      rect.setAttribute('width', '20');
      rect.setAttribute('height', '20');
      rect.setAttribute('fill', area.fill);
      // Áreas coloríveis NÃO têm pointer-events="none"
      svg.appendChild(rect);
    });

    // Adicionar elementos decorativos (com pointer-events="none")
    structure.decorativeElements.forEach((element, index) => {
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('id', element.id);
      rect.setAttribute('x', String(index * 20));
      rect.setAttribute('y', '50');
      rect.setAttribute('width', '20');
      rect.setAttribute('height', '20');
      rect.setAttribute('fill', element.fill);
      rect.setAttribute('pointer-events', 'none'); // Elementos decorativos têm pointer-events="none"
      svg.appendChild(rect);
    });

    return svg;
  }

  test('property: apenas áreas coloríveis devem ter event listeners anexados', () => {
    fc.assert(
      fc.property(
        svgStructureGenerator,
        (structure) => {
          // Criar container
          const container = document.createElement('div');
          document.body.appendChild(container);

          try {
            // Criar SVG
            const svg = createSVGFromStructure(structure);
            
            // Criar SVGCanvas diretamente com o SVG
            const canvas = new SVGCanvas(container);
            canvas.svgElement = svg;
            canvas.colorableAreas = structure.colorableAreas.map(a => ({ id: a.id }));
            
            canvas.render();
            canvas.attachEventListeners();

            // Verificar que apenas áreas coloríveis têm listeners
            const colorableAreaIds = structure.colorableAreas.map(a => a.id);
            const decorativeElementIds = structure.decorativeElements.map(e => e.id);

            // Verificar áreas coloríveis
            let allColorableAreasHaveListeners = true;
            colorableAreaIds.forEach(areaId => {
              const element = svg.querySelector(`#${areaId}`);
              if (!element) {
                allColorableAreasHaveListeners = false;
                return;
              }
              
              // Verificar que o elemento não tem pointer-events="none"
              if (element.getAttribute('pointer-events') === 'none') {
                allColorableAreasHaveListeners = false;
                return;
              }
              
              // Verificar que o elemento tem atributos de acessibilidade
              // (indicando que listeners foram anexados)
              if (element.getAttribute('tabindex') !== '0' || 
                  element.getAttribute('role') !== 'button') {
                allColorableAreasHaveListeners = false;
              }
            });

            // Verificar elementos decorativos
            let noDecorativeElementsHaveListeners = true;
            decorativeElementIds.forEach(elementId => {
              const element = svg.querySelector(`#${elementId}`);
              if (!element) {
                return;
              }
              
              // Verificar que o elemento tem pointer-events="none"
              if (element.getAttribute('pointer-events') !== 'none') {
                noDecorativeElementsHaveListeners = false;
                return;
              }
              
              // Verificar que o elemento NÃO tem atributos de acessibilidade
              // (indicando que listeners NÃO foram anexados)
              if (element.getAttribute('tabindex') !== null || 
                  element.getAttribute('role') !== null) {
                noDecorativeElementsHaveListeners = false;
              }
            });

            // Limpar
            canvas.destroy();
            
            return allColorableAreasHaveListeners && noDecorativeElementsHaveListeners;
          } finally {
            document.body.removeChild(container);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: elementos decorativos não devem responder a cliques', () => {
    fc.assert(
      fc.property(
        svgStructureGenerator,
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (structure, color) => {
          // Criar container
          const container = document.createElement('div');
          document.body.appendChild(container);

          try {
            // Criar SVG
            const svg = createSVGFromStructure(structure);
            
            // Criar SVGCanvas diretamente com o SVG
            const canvas = new SVGCanvas(container);
            canvas.svgElement = svg;
            canvas.colorableAreas = structure.colorableAreas.map(a => ({ id: a.id }));
            canvas.selectedColor = color;
            
            canvas.render();
            canvas.attachEventListeners();

            const decorativeElementIds = structure.decorativeElements.map(e => e.id);

            // Tentar clicar em elementos decorativos
            let noDecorativeElementsWereColored = true;
            decorativeElementIds.forEach(elementId => {
              const element = svg.querySelector(`#${elementId}`);
              if (element) {
                const originalFill = element.getAttribute('fill');
                
                // Simular clique
                const clickEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true
                });
                element.dispatchEvent(clickEvent);

                // Verificar que a cor NÃO foi aplicada ao elemento decorativo
                // (porque ele tem pointer-events="none" e não tem listener)
                const currentFill = element.getAttribute('fill');
                if (currentFill === color || currentFill !== originalFill) {
                  noDecorativeElementsWereColored = false;
                }
              }
            });

            // Limpar
            canvas.destroy();
            
            return noDecorativeElementsWereColored;
          } finally {
            document.body.removeChild(container);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
