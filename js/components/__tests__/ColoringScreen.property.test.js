import { jest } from '@jest/globals';
import * as fc from 'fast-check';
import { ColoringScreen } from '../ColoringScreen.js';

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
    rect.setAttribute('stroke', 'black');
    rect.setAttribute('stroke-width', '2');
    svg.appendChild(rect);
  }
  
  return svg;
}

/**
 * **Feature: site-colorir, Property 5: Presença de desenho e paleta**
 * **Valida: Requisitos 2.1**
 * 
 * Para qualquer desenho selecionado, quando a tela de colorir é exibida,
 * a interface deve conter tanto o desenho SVG renderizado quanto a paleta de cores.
 */
describe('Propriedade 5: Presença de desenho e paleta', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer desenho, a tela deve conter desenho SVG e paleta de cores', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (drawingName, areaCount) => {
          const svg = createTestSVG(areaCount);
          
          const drawing = {
            id: 'test-drawing',
            name: drawingName,
            svgUrl: '/test.svg',
            category: 'test'
          };

          const screen = new ColoringScreen(container, {
            drawing: drawing,
            onBack: () => {}
          });

          // Mockar o SVG carregado
          screen.svgCanvas.svgElement = svg;
          screen.svgCanvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          screen.svgCanvas.render();

          // Verificar presença de desenho e paleta
          const hasDrawingAndPalette = screen.hasDrawingAndPalette();
          
          // Verificar elementos no DOM
          const hasSVGElement = container.querySelector('svg') !== null;
          const hasPaletteElement = container.querySelector('.color-palette') !== null;

          screen.destroy();

          return hasDrawingAndPalette && hasSVGElement && hasPaletteElement;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 11: Uso consistente da cor selecionada**
 * **Valida: Requisitos 3.3**
 * 
 * Para qualquer cor selecionada na paleta, todas as operações de pintura
 * subsequentes devem usar aquela cor até que uma nova cor seja selecionada.
 */
describe('Propriedade 11: Uso consistente da cor selecionada', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer cor selecionada, todas pinturas devem usar aquela cor', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 2, maxLength: 5 }),
        (selectedColor, areaIndices) => {
          const svg = createTestSVG(5);
          
          const drawing = {
            id: 'test-drawing',
            name: 'Test',
            svgUrl: '/test.svg',
            category: 'test'
          };

          const screen = new ColoringScreen(container, {
            drawing: drawing,
            onBack: () => {}
          });

          // Mockar o SVG carregado
          screen.svgCanvas.svgElement = svg;
          screen.svgCanvas.colorableAreas = Array.from({ length: 5 }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          screen.svgCanvas.render();
          screen.svgCanvas.attachEventListeners();

          // Selecionar cor na paleta e garantir propagação
          screen.handleColorSelect(selectedColor);

          // Pintar múltiplas áreas (usar Set para remover duplicatas)
          const uniqueIndices = [...new Set(areaIndices)];
          uniqueIndices.forEach(index => {
            const areaId = `area-${index}`;
            const element = svg.querySelector(`#${areaId}`);
            const mockEvent = { target: element };
            screen.svgCanvas.handleAreaClick(mockEvent, areaId);
          });

          // Verificar que todas as áreas foram pintadas com a mesma cor
          const allColorsMatch = uniqueIndices.every(index => {
            const areaId = `area-${index}`;
            const appliedColor = screen.svgCanvas.getAreaColor(areaId);
            return appliedColor === selectedColor;
          });

          // Verificar que a cor selecionada permanece consistente
          const currentColor = screen.getSelectedColor();

          screen.destroy();

          return allColorsMatch && currentColor === selectedColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 21: Limpeza completa do desenho**
 * **Valida: Requisitos 7.2**
 * 
 * Para qualquer desenho com uma ou mais áreas coloridas, quando o usuário
 * clica no botão limpar, todas as áreas devem retornar ao estado inicial sem cor.
 */
describe('Propriedade 21: Limpeza completa do desenho', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer desenho colorido, limpar deve remover todas as cores', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 8 }), { minLength: 1, maxLength: 8 }),
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }), { minLength: 1, maxLength: 8 })
          .map(arr => arr.map(hex => `#${hex}`)),
        (areaIndices, colors) => {
          const svg = createTestSVG(8);
          
          const drawing = {
            id: 'test-drawing',
            name: 'Test',
            svgUrl: '/test.svg',
            category: 'test'
          };

          const screen = new ColoringScreen(container, {
            drawing: drawing,
            onBack: () => {}
          });

          // Mockar o SVG carregado
          screen.svgCanvas.svgElement = svg;
          screen.svgCanvas.colorableAreas = Array.from({ length: 8 }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          screen.svgCanvas.render();
          screen.svgCanvas.attachEventListeners();

          // Colorir várias áreas com cores diferentes
          areaIndices.forEach((index, i) => {
            const areaId = `area-${index}`;
            const color = colors[i % colors.length];
            screen.colorPalette.selectColor(color);
            const element = svg.querySelector(`#${areaId}`);
            const mockEvent = { target: element };
            screen.svgCanvas.handleAreaClick(mockEvent, areaId);
          });

          // Limpar desenho
          screen.clearDrawing();

          // Verificar que todas as áreas estão sem cor
          const allAreasCleared = areaIndices.every(index => {
            const areaId = `area-${index}`;
            const appliedColor = screen.svgCanvas.getAreaColor(areaId);
            return appliedColor === null;
          });

          screen.destroy();

          return allAreasCleared;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 22: Preservação de cor selecionada ao limpar**
 * **Valida: Requisitos 7.4**
 * 
 * Para qualquer cor selecionada na paleta, quando o usuário clica no botão limpar,
 * a cor selecionada deve permanecer a mesma (não deve ser deselecionada).
 */
describe('Propriedade 22: Preservação de cor selecionada ao limpar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer cor selecionada, limpar não deve desselecionar a cor', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 5 }),
        (selectedColor, areaIndices) => {
          const svg = createTestSVG(5);
          
          const drawing = {
            id: 'test-drawing',
            name: 'Test',
            svgUrl: '/test.svg',
            category: 'test'
          };

          const screen = new ColoringScreen(container, {
            drawing: drawing,
            onBack: () => {}
          });

          // Mockar o SVG carregado
          screen.svgCanvas.svgElement = svg;
          screen.svgCanvas.colorableAreas = Array.from({ length: 5 }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          screen.svgCanvas.render();
          screen.svgCanvas.attachEventListeners();

          // Selecionar cor e garantir propagação
          screen.handleColorSelect(selectedColor);

          // Colorir algumas áreas (usar Set para remover duplicatas)
          const uniqueIndices = [...new Set(areaIndices)];
          uniqueIndices.forEach(index => {
            const areaId = `area-${index}`;
            const element = svg.querySelector(`#${areaId}`);
            const mockEvent = { target: element };
            screen.svgCanvas.handleAreaClick(mockEvent, areaId);
          });

          // Limpar desenho
          screen.clearDrawing();

          // Verificar que a cor selecionada no ColoringScreen permanece a mesma
          const colorAfterClear = screen.getSelectedColor();

          screen.destroy();

          return colorAfterClear === selectedColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});
