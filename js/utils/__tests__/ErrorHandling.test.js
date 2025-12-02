/**
 * Testes unitários para tratamento de erros
 */

import { JSDOM } from 'jsdom';
import { checkBrowserCompatibility, showIncompatibilityMessage } from '../browserCompatibility.js';
import { SVGManipulator } from '../../services/SVGManipulator.js';
import LoaderService from '../../services/LoaderService.js';

// Setup DOM
function setupDOM() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.DOMParser = dom.window.DOMParser;
  global.fetch = dom.window.fetch;
  
  // Mock CSS API para testes de compatibilidade
  global.CSS = {
    supports: (property, value) => true
  };
  
  // Mock navigator para testes de compatibilidade
  global.navigator = {
    maxTouchPoints: 0
  };
  
  // Mock localStorage
  global.localStorage = {
    setItem: () => {},
    getItem: () => null,
    removeItem: () => {}
  };
  
  return dom;
}

describe('Tratamento de Erros', () => {
  let dom;

  beforeEach(() => {
    dom = setupDOM();
  });

  describe('BrowserCompatibility', () => {
    test('deve detectar navegador compatível', () => {
      const result = checkBrowserCompatibility();
      
      expect(result).toHaveProperty('compatible');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('features');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('deve exibir mensagem de incompatibilidade', () => {
      const result = {
        compatible: false,
        issues: ['Erro 1', 'Erro 2'],
        warnings: [],
        features: {}
      };
      
      showIncompatibilityMessage(result, document.body);
      
      const message = document.body.querySelector('div');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('Navegador Incompatível');
      expect(message.textContent).toContain('Erro 1');
      expect(message.textContent).toContain('Erro 2');
    });
  });

  describe('SVGManipulator - Tratamento de SVG inválido', () => {
    let manipulator;

    beforeEach(() => {
      manipulator = new SVGManipulator();
    });

    test('deve retornar array vazio ao identificar áreas em SVG nulo', () => {
      const areas = manipulator.identifyColorableAreas(null);
      
      expect(Array.isArray(areas)).toBe(true);
      expect(areas.length).toBe(0);
    });

    test('deve ignorar tentativa de colorir área com SVG inválido', () => {
      const originalWarn = console.warn;
      let warnCalled = false;
      let warnMessage = '';
      
      console.warn = (msg) => {
        warnCalled = true;
        warnMessage = msg;
      };
      
      manipulator.applyColorToArea(null, 'area-1', '#FF0000');
      
      expect(warnCalled).toBe(true);
      expect(warnMessage).toContain('SVG inválido');
      console.warn = originalWarn;
    });

    test('deve ignorar tentativa de colorir área com ID inválido', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const originalWarn = console.warn;
      let warnCalled = false;
      
      console.warn = () => { warnCalled = true; };
      
      manipulator.applyColorToArea(svg, null, '#FF0000');
      
      expect(warnCalled).toBe(true);
      console.warn = originalWarn;
    });

    test('deve ignorar tentativa de colorir área não colorível', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('id', 'not-colorable');
      svg.appendChild(rect);
      
      const originalWarn = console.warn;
      let warnCalled = false;
      
      console.warn = () => { warnCalled = true; };
      
      manipulator.applyColorToArea(svg, 'not-colorable', '#FF0000');
      
      expect(warnCalled).toBe(true);
      console.warn = originalWarn;
    });

    test('deve ignorar tentativa de limpar cores em SVG inválido', () => {
      const originalWarn = console.warn;
      let warnCalled = false;
      
      console.warn = () => { warnCalled = true; };
      
      manipulator.clearAllColors(null);
      
      expect(warnCalled).toBe(true);
      console.warn = originalWarn;
    });

    test('deve ignorar tentativa de destacar área com SVG inválido', () => {
      const originalWarn = console.warn;
      let warnCalled = false;
      
      console.warn = () => { warnCalled = true; };
      
      manipulator.highlightArea(null, 'area-1', true);
      
      expect(warnCalled).toBe(true);
      console.warn = originalWarn;
    });
  });

  describe('LoaderService - Tratamento de falha de rede', () => {
    let originalFetch;

    beforeEach(() => {
      // Salvar fetch original
      originalFetch = global.fetch;
      
      // Limpar cache antes de cada teste
      LoaderService.clearCache();
    });

    afterEach(() => {
      // Restaurar fetch original
      global.fetch = originalFetch;
      
      // Limpar cache após cada teste
      LoaderService.clearCache();
    });

    test('deve lançar erro ao falhar carregamento do catálogo', async () => {
      // Mock fetch para retornar erro
      global.fetch = () => Promise.reject(new Error('Network error'));

      await expect(LoaderService.loadDrawings()).rejects.toThrow();
    });

    test('deve lançar erro ao carregar catálogo com resposta HTTP não-ok', async () => {
      // Mock fetch para retornar 404
      global.fetch = () => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(LoaderService.loadDrawings()).rejects.toThrow();
    });

    test('deve lançar erro ao carregar desenhos com categoria inválida', async () => {
      await expect(LoaderService.loadDrawingsByCategory(null)).rejects.toThrow('ID de categoria inválido');
      await expect(LoaderService.loadDrawingsByCategory('')).rejects.toThrow('ID de categoria inválido');
      await expect(LoaderService.loadDrawingsByCategory(123)).rejects.toThrow('ID de categoria inválido');
    });

    test('deve ignorar desenhos inválidos no catálogo', async () => {
      // Mock fetch para retornar catálogo com desenho inválido
      global.fetch = () => Promise.resolve({
        ok: true,
        json: async () => ({
          categories: [
            {
              id: 'carros',
              name: 'Carros',
              drawings: [
                { 
                  id: 'carro-1', 
                  name: 'Carro Válido', 
                  category: 'carros', 
                  thumbnailUrl: '/test.png', 
                  svgUrl: '/test.svg',
                  metadata: { width: 100, height: 100, areaCount: 5 }
                },
                { id: 'carro-2', name: 'Carro Inválido', category: 'carros' } // Desenho inválido (faltam campos obrigatórios)
              ]
            }
          ]
        })
      });

      const originalWarn = console.warn;
      let warnCalled = false;
      console.warn = () => { warnCalled = true; };
      
      const drawings = await LoaderService.loadDrawings();
      
      expect(drawings.length).toBe(1);
      expect(drawings[0].id).toBe('carro-1');
      expect(warnCalled).toBe(true);
      
      console.warn = originalWarn;
    });

    test('deve lidar com erro ao pré-carregar imagem', async () => {
      // Mock fetch para retornar catálogo válido
      global.fetch = () => Promise.resolve({
        ok: true,
        json: async () => ({
          categories: [
            {
              id: 'test',
              name: 'Test',
              drawings: [
                { id: 'test-1', name: 'Test', category: 'test', thumbnailUrl: '/invalid.png', svgUrl: '/invalid.svg' }
              ]
            }
          ]
        })
      });

      const originalError = console.error;
      let errorCalled = false;
      console.error = () => { errorCalled = true; };
      
      // Pré-carregamento não deve lançar erro, apenas logar
      await LoaderService.preloadDrawing('test-1');
      
      // Erro deve ser logado mas não propagado
      expect(errorCalled).toBe(true);
      
      console.error = originalError;
    });
  });
});
