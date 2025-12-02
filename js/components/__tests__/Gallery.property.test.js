import fc from 'fast-check';
import { Gallery } from '../Gallery.js';
import { JSDOM } from 'jsdom';
import { jest } from '@jest/globals';

// Configurar ambiente DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
const { window } = dom;

global.document = window.document;
global.window = window;
global.HTMLElement = window.HTMLElement;
global.Image = window.Image;
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Geradores personalizados
const arbitraryDrawing = () => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    category: fc.constantFrom('carros', 'animais', 'princesas', 'dinossauros', 'esportes'),
    thumbnailUrl: fc.webUrl(),
    svgUrl: fc.webUrl(),
    metadata: fc.record({
      width: fc.integer({ min: 400, max: 1200 }),
      height: fc.integer({ min: 400, max: 1200 }),
      areaCount: fc.integer({ min: 5, max: 30 })
    })
  });
};

const arbitraryCategory = () => {
  return fc.record({
    id: fc.constantFrom('carros', 'animais', 'princesas', 'dinossauros', 'esportes'),
    name: fc.constantFrom('Carros', 'Animais', 'Princesas', 'Dinossauros', 'Esportes'),
    drawings: fc.array(arbitraryDrawing(), { minLength: 1, maxLength: 10 })
  });
};

describe('Gallery - Property-Based Tests', () => {

  // **Feature: site-colorir, Property 1: Completude da galeria**
  test('Propriedade 1: Para qualquer conjunto de desenhos, todos devem estar presentes na galeria renderizada', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryCategory(), { minLength: 1, maxLength: 5 }),
        (categories) => {
          // Criar container e mock dentro do teste
          const container = document.createElement('div');
          document.body.appendChild(container);
          const mockOnDrawingSelect = jest.fn();

          // Criar galeria
          const gallery = new Gallery({
            container,
            onDrawingSelect: mockOnDrawingSelect
          });

          // Mock do LoaderService
          gallery.loaderService = {
            loadDrawingsGroupedByCategory: async () => categories,
            setupLazyLoading: () => ({
              disconnect: () => {}
            })
          };

          // Renderizar galeria
          return gallery.init().then(() => {
            const renderedIds = gallery.getRenderedDrawingIds();
            
            // Coletar todos os IDs esperados
            const expectedIds = [];
            categories.forEach(category => {
              category.drawings.forEach(drawing => {
                expectedIds.push(drawing.id);
              });
            });

            // Verificar que todos os desenhos estão presentes
            const allPresent = expectedIds.every(id => renderedIds.includes(id));
            const correctCount = renderedIds.length === expectedIds.length;

            gallery.destroy();
            document.body.removeChild(container);
            
            return allPresent && correctCount;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: site-colorir, Property 2: Agrupamento por categoria**
  test('Propriedade 2: Para qualquer conjunto de desenhos, desenhos da mesma categoria devem aparecer agrupados', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryCategory(), { minLength: 2, maxLength: 5 }),
        (categories) => {
          const container = document.createElement('div');
          document.body.appendChild(container);
          const mockOnDrawingSelect = jest.fn();

          const gallery = new Gallery({
            container,
            onDrawingSelect: mockOnDrawingSelect
          });

          gallery.loaderService = {
            loadDrawingsGroupedByCategory: async () => categories,
            setupLazyLoading: () => ({
              disconnect: () => {}
            })
          };

          return gallery.init().then(() => {
            // Verificar que cada categoria tem seu próprio elemento
            const categoryElements = container.querySelectorAll('.gallery-category');
            
            // Deve haver uma seção para cada categoria
            if (categoryElements.length !== categories.length) {
              gallery.destroy();
              return false;
            }

            // Verificar que desenhos estão agrupados corretamente
            let allGroupedCorrectly = true;
            
            categories.forEach((category, index) => {
              const categoryElement = categoryElements[index];
              const drawingsInCategory = categoryElement.querySelectorAll('.gallery-item');
              
              // Verificar que o número de desenhos está correto
              if (drawingsInCategory.length !== category.drawings.length) {
                allGroupedCorrectly = false;
                return;
              }

              // Verificar que todos os desenhos pertencem à categoria
              category.drawings.forEach(drawing => {
                const drawingElement = categoryElement.querySelector(`[data-drawing-id="${drawing.id}"]`);
                if (!drawingElement) {
                  allGroupedCorrectly = false;
                }
              });
            });

            gallery.destroy();
            document.body.removeChild(container);
            return allGroupedCorrectly;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: site-colorir, Property 3: Exibição completa de categoria**
  test('Propriedade 3: Para qualquer categoria, deve exibir nome e todos os desenhos da categoria', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryCategory(),
        (category) => {
          const container = document.createElement('div');
          document.body.appendChild(container);
          const mockOnDrawingSelect = jest.fn();

          const gallery = new Gallery({
            container,
            onDrawingSelect: mockOnDrawingSelect
          });

          gallery.loaderService = {
            loadDrawingsGroupedByCategory: async () => [category],
            setupLazyLoading: () => ({
              disconnect: () => {}
            })
          };

          return gallery.init().then(() => {
            const categoryElement = container.querySelector('.gallery-category');
            
            if (!categoryElement) {
              gallery.destroy();
              return false;
            }

            // Verificar que o nome da categoria está presente
            const header = categoryElement.querySelector('.gallery-category-header');
            const hasName = header && header.textContent === category.name;

            // Verificar que todos os desenhos estão presentes
            const drawingElements = categoryElement.querySelectorAll('.gallery-item');
            const hasAllDrawings = drawingElements.length === category.drawings.length;

            // Verificar que cada desenho da categoria está presente
            const allDrawingsPresent = category.drawings.every(drawing => {
              return categoryElement.querySelector(`[data-drawing-id="${drawing.id}"]`) !== null;
            });

            gallery.destroy();
            document.body.removeChild(container);
            return hasName && hasAllDrawings && allDrawingsPresent;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: site-colorir, Property 4: Navegação para colorir**
  test('Propriedade 4: Para qualquer desenho, clicar na miniatura deve chamar callback com o desenho correto', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryDrawing(),
        (drawing) => {
          const container = document.createElement('div');
          document.body.appendChild(container);
          const mockOnDrawingSelect = jest.fn();

          const category = {
            id: drawing.category,
            name: drawing.category.charAt(0).toUpperCase() + drawing.category.slice(1),
            drawings: [drawing]
          };

          const gallery = new Gallery({
            container,
            onDrawingSelect: mockOnDrawingSelect
          });

          gallery.loaderService = {
            loadDrawingsGroupedByCategory: async () => [category],
            setupLazyLoading: () => ({
              disconnect: () => {}
            })
          };

          return gallery.init().then(() => {
            // Resetar mock
            mockOnDrawingSelect.mockClear();

            // Encontrar e clicar no botão do desenho
            const drawingButton = container.querySelector(`[data-drawing-id="${drawing.id}"] button`);
            
            if (!drawingButton) {
              gallery.destroy();
              return false;
            }

            drawingButton.click();

            // Verificar que o callback foi chamado com o desenho correto
            const wasCalledCorrectly = mockOnDrawingSelect.mock.calls.length === 1 &&
                                      mockOnDrawingSelect.mock.calls[0][0].id === drawing.id;

            gallery.destroy();
            document.body.removeChild(container);
            return wasCalledCorrectly;
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
