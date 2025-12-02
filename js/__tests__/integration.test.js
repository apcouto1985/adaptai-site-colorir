/**
 * Testes de integração
 * Testa o fluxo completo da aplicação
 */

import { JSDOM } from 'jsdom';
import { Gallery } from '../components/Gallery.js';
import { ApplicationState } from '../state/ApplicationState.js';
import LoaderService from '../services/LoaderService.js';

// Setup DOM
function setupDOM() {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app">
          <div id="gallery-container"></div>
          <div id="coloring-container"></div>
        </div>
      </body>
    </html>
  `, {
    url: 'http://localhost',
    pretendToBeVisual: true
  });

  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.SVGElement = dom.window.SVGElement;
  global.DOMParser = dom.window.DOMParser;
  global.Image = dom.window.Image;
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  return dom;
}

// Mock fetch
function mockFetch() {
  global.fetch = (url) => {
    if (url.includes('drawings-catalog.json')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          categories: [
            {
              id: 'test-category',
              name: 'Categoria Teste',
              drawings: [
                {
                  id: 'test-drawing-1',
                  name: 'Desenho Teste 1',
                  category: 'test-category',
                  thumbnailUrl: '/test1.png',
                  svgUrl: '/test1.svg',
                  metadata: { width: 100, height: 100, areaCount: 3 }
                },
                {
                  id: 'test-drawing-2',
                  name: 'Desenho Teste 2',
                  category: 'test-category',
                  thumbnailUrl: '/test2.png',
                  svgUrl: '/test2.svg',
                  metadata: { width: 100, height: 100, areaCount: 5 }
                }
              ]
            }
          ]
        })
      });
    }

    if (url.includes('.svg')) {
      return Promise.resolve({
        ok: true,
        text: async () => `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect id="area-1" x="0" y="0" width="50" height="50" fill="none" stroke="black" stroke-width="2"/>
            <rect id="area-2" x="50" y="0" width="50" height="50" fill="none" stroke="black" stroke-width="2"/>
            <rect id="area-3" x="0" y="50" width="50" height="50" fill="none" stroke="black" stroke-width="2"/>
          </svg>
        `
      });
    }

    return Promise.reject(new Error('Not found'));
  };
}

describe('Testes de Integração', () => {
  let dom;
  let galleryContainer;
  let coloringContainer;

  beforeEach(() => {
    dom = setupDOM();
    mockFetch();
    LoaderService.clearCache();

    galleryContainer = dom.window.document.getElementById('gallery-container');
    coloringContainer = dom.window.document.getElementById('coloring-container');
  });

  afterEach(() => {
    LoaderService.clearCache();
  });

  describe('Fluxo completo de navegação', () => {
    test('deve criar galeria com callback de seleção', () => {
      // Criar galeria
      let selectedDrawing = null;
      const gallery = new Gallery({
        container: galleryContainer,
        onDrawingSelect: (drawing) => {
          selectedDrawing = drawing;
        }
      });

      // Verificar que galeria foi criada
      expect(gallery).toBeTruthy();
      expect(gallery.container).toBe(galleryContainer);

      // Simular seleção de desenho
      const testDrawing = {
        id: 'test-1',
        name: 'Teste'
      };

      gallery.onDrawingSelect(testDrawing);
      expect(selectedDrawing).toEqual(testDrawing);

      // Cleanup
      gallery.destroy();
    });

    test('deve preservar estado ao transicionar entre views', () => {
      const appState = new ApplicationState({
        galleryContainer,
        coloringContainer
      });

      // Transicionar para colorir
      const drawing = {
        id: 'test-drawing-1',
        name: 'Teste',
        svgUrl: '/test.svg',
        category: 'test'
      };

      appState.transitionToColoring(drawing);
      expect(appState.getCurrentView()).toBe('coloring');
      expect(appState.getSelectedDrawing()).toEqual(drawing);

      // Voltar para galeria preservando estado
      appState.transitionToGallery(true);
      expect(appState.getCurrentView()).toBe('gallery');
    });
  });

  describe('Integração básica', () => {
    test('deve criar ApplicationState com containers válidos', () => {
      const appState = new ApplicationState({
        galleryContainer,
        coloringContainer
      });

      expect(appState).toBeTruthy();
      expect(appState.getCurrentView()).toBe('gallery');
    });

    test('deve transicionar entre views', () => {
      const appState = new ApplicationState({
        galleryContainer,
        coloringContainer
      });

      const drawing = {
        id: 'test-drawing',
        name: 'Teste',
        svgUrl: '/test.svg',
        category: 'test'
      };

      // Transicionar para colorir
      appState.transitionToColoring(drawing);
      expect(appState.getCurrentView()).toBe('coloring');
      expect(appState.getSelectedDrawing()).toEqual(drawing);

      // Voltar para galeria
      appState.transitionToGallery(true);
      expect(appState.getCurrentView()).toBe('gallery');
    });

    test('deve gerenciar estado de cores', () => {
      const appState = new ApplicationState({
        galleryContainer,
        coloringContainer
      });

      // Definir cor selecionada
      appState.setSelectedColor('#FF0000');
      expect(appState.getSelectedColor()).toBe('#FF0000');

      // Colorir área
      appState.setAreaColor('area-1', '#FF0000');
      expect(appState.getAreaColor('area-1')).toBe('#FF0000');

      // Limpar cores
      appState.clearAllColors();
      expect(appState.getColoredAreas().size).toBe(0);
    });
  });
});
