/**
 * Testes de propriedade para eventos touch
 * Feature: site-colorir, Propriedade 20: Equivalência touch e mouse
 * Valida: Requisitos 6.4
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';
import { SVGCanvas } from '../SVGCanvas.js';
import { ColorPalette } from '../ColorPalette.js';
import { ColoringScreen } from '../ColoringScreen.js';
import { Gallery } from '../Gallery.js';

describe('Touch Events - Property-Based Tests', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  /**
   * Propriedade 20: Equivalência touch e mouse
   * Para qualquer componente interativo, eventos touch devem produzir o mesmo resultado que eventos mouse
   * Valida: Requisitos 6.4
   */
  describe('Propriedade 20: Equivalência touch e mouse', () => {
    it('ColorPalette: touchstart deve selecionar cor igual a click', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 15 }), // Índice da cor (paleta tem 16 cores)
          (colorIndex) => {
            // Criar paleta
            const palette = new ColorPalette(container);
            const colors = palette.colors;
            const targetColor = colors[colorIndex];

            // Obter botão da cor
            const buttons = container.querySelectorAll('.color-button');
            const button = buttons[colorIndex];

            // Simular click
            button.click();
            const colorAfterClick = palette.getSelectedColor();

            // Resetar paleta
            palette.destroy();
            container.innerHTML = '';

            // Criar nova paleta
            const palette2 = new ColorPalette(container);
            const buttons2 = container.querySelectorAll('.color-button');
            const button2 = buttons2[colorIndex];

            // Simular touchstart
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: [{ clientX: 0, clientY: 0 }]
            });
            button2.dispatchEvent(touchEvent);
            const colorAfterTouch = palette2.getSelectedColor();

            // Limpar
            palette2.destroy();

            // Touch deve produzir mesmo resultado que click
            return colorAfterClick === targetColor && colorAfterTouch === targetColor;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('SVGCanvas: touchstart deve colorir área igual a click', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`), // Cor aleatória
          fc.integer({ min: 1, max: 5 }), // ID da área (area-1 a area-5)
          async (color, areaNum) => {
            const areaId = `area-${areaNum}`;

            // Criar SVG de teste
            const svgContent = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                ${Array.from({ length: 5 }, (_, i) => 
                  `<rect id="area-${i + 1}" x="${i * 20}" y="0" width="20" height="100" fill="none" stroke="black"/>`
                ).join('')}
              </svg>
            `;

            // Mock fetch para SVG
            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: true,
                text: () => Promise.resolve(svgContent)
              })
            );

            // Teste com click
            const canvas1 = new SVGCanvas(container, {
              svgUrl: 'test.svg',
              selectedColor: color
            });
            await canvas1.loadSVG('test.svg');

            const element1 = canvas1.svgElement.querySelector(`#${areaId}`);
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
            element1.dispatchEvent(clickEvent);
            const colorAfterClick = canvas1.getAreaColor(areaId);

            canvas1.destroy();
            container.innerHTML = '';

            // Teste com touchstart
            const canvas2 = new SVGCanvas(container, {
              svgUrl: 'test.svg',
              selectedColor: color
            });
            await canvas2.loadSVG('test.svg');

            const element2 = canvas2.svgElement.querySelector(`#${areaId}`);
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: [{ clientX: 0, clientY: 0 }]
            });
            element2.dispatchEvent(touchEvent);
            const colorAfterTouch = canvas2.getAreaColor(areaId);

            canvas2.destroy();

            // Touch deve produzir mesmo resultado que click
            return colorAfterClick === color && colorAfterTouch === color;
          }
        ),
        { numRuns: 30 }
      );
    });

    it('ColoringScreen: botão limpar com touchstart deve funcionar igual a click', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
          async (color) => {
            // Criar desenho de teste
            const drawing = {
              id: 'test-drawing',
              name: 'Test Drawing',
              svgUrl: 'test.svg',
              thumbnailUrl: 'test-thumb.png',
              category: 'test'
            };

            const svgContent = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect id="area-1" x="0" y="0" width="50" height="50" fill="none" stroke="black"/>
                <rect id="area-2" x="50" y="0" width="50" height="50" fill="none" stroke="black"/>
              </svg>
            `;

            global.fetch = jest.fn(() =>
              Promise.resolve({
                ok: true,
                text: () => Promise.resolve(svgContent)
              })
            );

            // Teste com click
            const screen1 = new ColoringScreen(container, {
              drawing,
              onBack: () => {}
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            // Colorir uma área
            screen1.svgCanvas.setSelectedColor(color);
            const area1 = screen1.svgCanvas.svgElement.querySelector('#area-1');
            const clickEvent1 = new MouseEvent('click', { bubbles: true, cancelable: true });
            area1.dispatchEvent(clickEvent1);

            // Clicar no botão limpar
            const clearButton1 = container.querySelector('.clear-button');
            clearButton1.click();
            const clearedWithClick = screen1.svgCanvas.getAreaColor('area-1') === null;

            screen1.destroy();
            container.innerHTML = '';

            // Teste com touchstart
            const screen2 = new ColoringScreen(container, {
              drawing,
              onBack: () => {}
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            // Colorir uma área
            screen2.svgCanvas.setSelectedColor(color);
            const area2 = screen2.svgCanvas.svgElement.querySelector('#area-1');
            const clickEvent2 = new MouseEvent('click', { bubbles: true, cancelable: true });
            area2.dispatchEvent(clickEvent2);

            // Touchstart no botão limpar
            const clearButton2 = container.querySelector('.clear-button');
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: [{ clientX: 0, clientY: 0 }]
            });
            clearButton2.dispatchEvent(touchEvent);
            const clearedWithTouch = screen2.svgCanvas.getAreaColor('area-1') === null;

            screen2.destroy();

            // Touch deve produzir mesmo resultado que click
            return clearedWithClick && clearedWithTouch;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('Gallery: touchstart em miniatura deve selecionar desenho igual a click', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 2 }), // Índice do desenho
          async (drawingIndex) => {
            // Mock do LoaderService
            const mockDrawings = [
              {
                id: 'drawing-1',
                name: 'Drawing 1',
                svgUrl: 'drawing1.svg',
                thumbnailUrl: 'thumb1.png',
                category: 'animals'
              },
              {
                id: 'drawing-2',
                name: 'Drawing 2',
                svgUrl: 'drawing2.svg',
                thumbnailUrl: 'thumb2.png',
                category: 'animals'
              },
              {
                id: 'drawing-3',
                name: 'Drawing 3',
                svgUrl: 'drawing3.svg',
                thumbnailUrl: 'thumb3.png',
                category: 'nature'
              }
            ];

            const mockCategories = [
              {
                id: 'animals',
                name: 'Animais',
                drawings: mockDrawings.filter(d => d.category === 'animals')
              },
              {
                id: 'nature',
                name: 'Natureza',
                drawings: mockDrawings.filter(d => d.category === 'nature')
              }
            ];

            // Teste com click
            let selectedWithClick = null;
            const gallery1 = new Gallery({
              container,
              onDrawingSelect: (drawing) => {
                selectedWithClick = drawing.id;
              }
            });

            gallery1.loaderService = {
              loadDrawingsGroupedByCategory: () => Promise.resolve(mockCategories),
              setupLazyLoading: () => ({ disconnect: () => {} })
            };

            await gallery1.init();

            const buttons1 = container.querySelectorAll('.gallery-item-button');
            buttons1[drawingIndex].click();

            gallery1.destroy();
            container.innerHTML = '';

            // Teste com touchstart
            let selectedWithTouch = null;
            const gallery2 = new Gallery({
              container,
              onDrawingSelect: (drawing) => {
                selectedWithTouch = drawing.id;
              }
            });

            gallery2.loaderService = {
              loadDrawingsGroupedByCategory: () => Promise.resolve(mockCategories),
              setupLazyLoading: () => ({ disconnect: () => {} })
            };

            await gallery2.init();

            const buttons2 = container.querySelectorAll('.gallery-item-button');
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              touches: [{ clientX: 0, clientY: 0 }]
            });
            buttons2[drawingIndex].dispatchEvent(touchEvent);

            gallery2.destroy();

            // Touch deve produzir mesmo resultado que click
            return selectedWithClick === mockDrawings[drawingIndex].id &&
                   selectedWithTouch === mockDrawings[drawingIndex].id;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
