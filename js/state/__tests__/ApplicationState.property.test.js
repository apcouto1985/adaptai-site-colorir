import fc from 'fast-check';
import { ApplicationState } from '../ApplicationState.js';
import { JSDOM } from 'jsdom';

// Configurar ambiente DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost'
});
const { window } = dom;

global.document = window.document;
global.window = window;
global.HTMLElement = window.HTMLElement;

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

const arbitraryColor = () => {
  return fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`);
};

describe('ApplicationState - Property-Based Tests', () => {

  // **Feature: site-colorir, Property 17: Preservação de estado ao voltar**
  test('Propriedade 17: Para qualquer estado da galeria, voltar da tela de colorir deve restaurar o estado', async () => {
    await fc.assert(
      fc.property(
        arbitraryDrawing(),
        fc.integer({ min: 0, max: 1000 }),
        fc.string({ minLength: 3, maxLength: 20 }),
        (drawing, scrollPosition, categoryId) => {
          // Criar containers
          const galleryContainer = document.createElement('div');
          const coloringContainer = document.createElement('div');
          document.body.appendChild(galleryContainer);
          document.body.appendChild(coloringContainer);

          // Criar ApplicationState
          const appState = new ApplicationState({
            galleryContainer,
            coloringContainer
          });

          // Simular estado inicial da galeria
          galleryContainer.scrollTop = scrollPosition;
          appState.setLastSelectedCategory(categoryId);

          // Capturar estado antes de navegar
          const initialScrollPosition = scrollPosition;
          const initialCategory = categoryId;

          // Transicionar para colorir
          appState.transitionToColoring(drawing);

          // Verificar que estamos na tela de colorir
          if (appState.getCurrentView() !== 'coloring') {
            document.body.removeChild(galleryContainer);
            document.body.removeChild(coloringContainer);
            return false;
          }

          // Voltar para galeria
          appState.transitionToGallery(true);

          // Verificar que voltamos para galeria
          if (appState.getCurrentView() !== 'gallery') {
            document.body.removeChild(galleryContainer);
            document.body.removeChild(coloringContainer);
            return false;
          }

          // Verificar que a categoria foi preservada
          const categoryPreserved = appState.getLastSelectedCategory() === initialCategory;

          // Limpar
          document.body.removeChild(galleryContainer);
          document.body.removeChild(coloringContainer);

          return categoryPreserved;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Transição para colorir deve resetar estado de colorir', async () => {
    await fc.assert(
      fc.property(
        arbitraryDrawing(),
        arbitraryDrawing(),
        (drawing1, drawing2) => {
          const galleryContainer = document.createElement('div');
          const coloringContainer = document.createElement('div');
          document.body.appendChild(galleryContainer);
          document.body.appendChild(coloringContainer);

          const appState = new ApplicationState({
            galleryContainer,
            coloringContainer
          });

          // Transicionar para primeiro desenho e colorir
          appState.transitionToColoring(drawing1);
          appState.setSelectedColor('#FF0000');
          appState.setAreaColor('area-1', '#FF0000');

          // Transicionar para segundo desenho
          appState.transitionToColoring(drawing2);

          // Verificar que estado foi resetado
          const coloredAreas = appState.getColoredAreas();
          const isModified = appState.isDrawingModified();

          document.body.removeChild(galleryContainer);
          document.body.removeChild(coloringContainer);

          return coloredAreas.size === 0 && !isModified;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Listeners devem ser notificados de mudanças de view', async () => {
    await fc.assert(
      fc.property(
        arbitraryDrawing(),
        (drawing) => {
          const galleryContainer = document.createElement('div');
          const coloringContainer = document.createElement('div');
          document.body.appendChild(galleryContainer);
          document.body.appendChild(coloringContainer);

          const appState = new ApplicationState({
            galleryContainer,
            coloringContainer
          });

          let notificationCount = 0;
          let lastEvent = null;

          const listener = (event, data) => {
            notificationCount++;
            lastEvent = event;
          };

          appState.addListener(listener);

          // Transicionar para colorir
          appState.transitionToColoring(drawing);

          // Verificar notificação
          const wasNotified = notificationCount === 1 && lastEvent === 'viewChanged';

          document.body.removeChild(galleryContainer);
          document.body.removeChild(coloringContainer);

          return wasNotified;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Áreas coloridas devem ser rastreadas corretamente', async () => {
    await fc.assert(
      fc.property(
        arbitraryDrawing(),
        fc.array(
          fc.tuple(
            fc.integer({ min: 1, max: 30 }).map(n => `area-${n}`),
            arbitraryColor()
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (drawing, coloredAreas) => {
          const galleryContainer = document.createElement('div');
          const coloringContainer = document.createElement('div');
          document.body.appendChild(galleryContainer);
          document.body.appendChild(coloringContainer);

          const appState = new ApplicationState({
            galleryContainer,
            coloringContainer
          });

          appState.transitionToColoring(drawing);

          // Colorir áreas
          coloredAreas.forEach(([areaId, color]) => {
            appState.setAreaColor(areaId, color);
          });

          // Criar mapa esperado (última cor para cada área)
          const expectedAreas = new Map();
          coloredAreas.forEach(([areaId, color]) => {
            expectedAreas.set(areaId, color);
          });

          // Verificar que todas as áreas foram registradas com a última cor
          const storedAreas = appState.getColoredAreas();
          const allAreasStored = Array.from(expectedAreas.entries()).every(([areaId, color]) => {
            return storedAreas.get(areaId) === color;
          });

          // Verificar que foi marcado como modificado
          const isModified = appState.isDrawingModified();

          document.body.removeChild(galleryContainer);
          document.body.removeChild(coloringContainer);

          return allAreasStored && isModified;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Limpar cores deve resetar estado de modificação', async () => {
    await fc.assert(
      fc.property(
        arbitraryDrawing(),
        fc.array(
          fc.tuple(
            fc.integer({ min: 1, max: 30 }).map(n => `area-${n}`),
            arbitraryColor()
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (drawing, coloredAreas) => {
          const galleryContainer = document.createElement('div');
          const coloringContainer = document.createElement('div');
          document.body.appendChild(galleryContainer);
          document.body.appendChild(coloringContainer);

          const appState = new ApplicationState({
            galleryContainer,
            coloringContainer
          });

          appState.transitionToColoring(drawing);

          // Colorir áreas
          coloredAreas.forEach(([areaId, color]) => {
            appState.setAreaColor(areaId, color);
          });

          // Limpar
          appState.clearAllColors();

          // Verificar que foi limpo
          const storedAreas = appState.getColoredAreas();
          const isModified = appState.isDrawingModified();

          document.body.removeChild(galleryContainer);
          document.body.removeChild(coloringContainer);

          return storedAreas.size === 0 && !isModified;
        }
      ),
      { numRuns: 100 }
    );
  });
});
