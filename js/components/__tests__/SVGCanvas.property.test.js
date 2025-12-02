import { jest } from '@jest/globals';
import * as fc from 'fast-check';
import { SVGCanvas } from '../SVGCanvas.js';

/**
 * Helper para criar um SVG de teste
 */
function createTestSVG(areaCount = 3) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '200');
  svg.setAttribute('height', '200');
  
  for (let i = 1; i <= areaCount; i++) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', `area-${i}`);
    rect.setAttribute('x', `${(i - 1) * 60}`);
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '50');
    rect.setAttribute('height', '50');
    rect.setAttribute('fill', 'none');
    svg.appendChild(rect);
  }
  
  return svg;
}

/**
 * **Feature: site-colorir, Property 6: Transformação do cursor**
 * **Valida: Requisitos 2.2**
 * 
 * Para qualquer posição do mouse sobre uma área colorível do desenho,
 * o cursor deve ter o estilo visual de pincel aplicado.
 */
describe('Propriedade 6: Transformação do cursor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área colorível, ao passar o mouse deve aplicar cursor de pincel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (areaCount, areaIndex) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          // Mock do SVGManipulator
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Simular mouse enter
          canvas.handleAreaMouseEnter(areaId);

          // Verificar cursor
          const element = svg.querySelector(`#${areaId}`);
          const hasCrosshairCursor = element?.style.cursor === 'crosshair';

          canvas.destroy();

          return hasCrosshairCursor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 7: Aplicação de cor ao clicar**
 * **Valida: Requisitos 2.3**
 * 
 * Para qualquer área colorível e qualquer cor selecionada na paleta,
 * quando o usuário clica naquela área, a área deve ser preenchida com a cor selecionada.
 */
describe('Propriedade 7: Aplicação de cor ao clicar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área e cor, ao clicar deve aplicar a cor selecionada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, color) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Clicar na área
          canvas.handleAreaClick(areaId);

          // Verificar se a cor foi aplicada
          const appliedColor = canvas.getAreaColor(areaId);
          const element = svg.querySelector(`#${areaId}`);
          const fillAttribute = element?.getAttribute('fill');

          canvas.destroy();

          return appliedColor === color && fillAttribute === color;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 9: Substituição de cor**
 * **Valida: Requisitos 2.5**
 * 
 * Para qualquer área já colorida, quando o usuário clica naquela área
 * com uma nova cor selecionada, a cor anterior deve ser completamente
 * substituída pela nova cor.
 */
describe('Propriedade 9: Substituição de cor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área colorida, ao clicar com nova cor deve substituir completamente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, firstColor, secondColor) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Aplicar primeira cor
          canvas.selectedColor = firstColor;
          canvas.handleAreaClick(areaId);

          // Aplicar segunda cor
          canvas.selectedColor = secondColor;
          canvas.handleAreaClick(areaId);

          // Verificar que apenas a segunda cor está presente
          const appliedColor = canvas.getAreaColor(areaId);
          const element = svg.querySelector(`#${areaId}`);
          const fillAttribute = element?.getAttribute('fill');

          canvas.destroy();

          return appliedColor === secondColor && fillAttribute === secondColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 14: Destaque de área sob cursor**
 * **Valida: Requisitos 4.3**
 * 
 * Para qualquer área colorível sob o cursor do mouse, aquela área deve ter
 * destaque visual aplicado enquanto o cursor estiver sobre ela.
 */
describe('Propriedade 14: Destaque de área sob cursor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área sob o cursor, deve ter destaque visual aplicado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (areaCount, areaIndex) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Simular mouse enter
          canvas.handleAreaMouseEnter(areaId);

          // Verificar destaque
          const element = svg.querySelector(`#${areaId}`);
          const hasHighlightClass = element?.classList.contains('highlighted');
          const isCurrentlyHighlighted = canvas.currentHighlightedArea === areaId;

          // Simular mouse leave
          canvas.handleAreaMouseLeave(areaId);

          // Verificar que destaque foi removido
          const highlightRemoved = !element?.classList.contains('highlighted');
          const noLongerHighlighted = canvas.currentHighlightedArea === null;

          canvas.destroy();

          return hasHighlightClass && isCurrentlyHighlighted && highlightRemoved && noLongerHighlighted;
        }
      ),
      { numRuns: 100 }
    );
  });
});
