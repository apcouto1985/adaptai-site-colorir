import { jest } from '@jest/globals';
import { LoaderService } from '../LoaderService.js';

describe('LoaderService', () => {
  let loaderService;

  beforeEach(() => {
    loaderService = new LoaderService();
    global.fetch = jest.fn();
    loaderService.clearCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadDrawings', () => {
    test('deve carregar catálogo com sucesso', async () => {
      const mockCatalog = {
        categories: [
          {
            id: 'carros',
            name: 'Carros',
            drawings: [
              {
                id: 'carro-1',
                name: 'Carro Esportivo',
                category: 'carros',
                thumbnailUrl: '/assets/thumbnails/carros/carro-1.png',
                svgUrl: '/assets/drawings/carros/carro-1.svg',
                metadata: {
                  width: 800,
                  height: 600,
                  areaCount: 10
                }
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      });

      const drawings = await loaderService.loadDrawings();

      expect(drawings).toHaveLength(1);
      expect(drawings[0].id).toBe('carro-1');
      expect(global.fetch).toHaveBeenCalledWith('/data/drawings-catalog.json');
    });

    test('deve usar cache em chamadas subsequentes', async () => {
      const mockCatalog = {
        categories: [
          {
            id: 'carros',
            name: 'Carros',
            drawings: [
              {
                id: 'carro-1',
                name: 'Carro Esportivo',
                category: 'carros',
                thumbnailUrl: '/assets/thumbnails/carros/carro-1.png',
                svgUrl: '/assets/drawings/carros/carro-1.svg',
                metadata: {
                  width: 800,
                  height: 600,
                  areaCount: 10
                }
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      });

      // Primeira chamada
      await loaderService.loadDrawings();
      
      // Segunda chamada (deve usar cache)
      await loaderService.loadDrawings();

      // Fetch deve ter sido chamado apenas uma vez
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('deve lançar erro em caso de falha de rede', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loaderService.loadDrawings()).rejects.toThrow('HTTP 404');
    });

    test('deve ignorar desenhos inválidos', async () => {
      const mockCatalog = {
        categories: [
          {
            id: 'carros',
            name: 'Carros',
            drawings: [
              {
                id: 'carro-1',
                name: 'Carro Esportivo',
                category: 'carros',
                thumbnailUrl: '/assets/thumbnails/carros/carro-1.png',
                svgUrl: '/assets/drawings/carros/carro-1.svg',
                metadata: {
                  width: 800,
                  height: 600,
                  areaCount: 10
                }
              },
              {
                // Desenho inválido (sem metadata)
                id: 'carro-2',
                name: 'Carro Inválido',
                category: 'carros'
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      });

      const drawings = await loaderService.loadDrawings();

      // Deve retornar apenas o desenho válido
      expect(drawings).toHaveLength(1);
      expect(drawings[0].id).toBe('carro-1');
    });
  });

  describe('loadDrawingsByCategory', () => {
    test('deve filtrar desenhos por categoria', async () => {
      const mockCatalog = {
        categories: [
          {
            id: 'carros',
            name: 'Carros',
            drawings: [
              {
                id: 'carro-1',
                name: 'Carro Esportivo',
                category: 'carros',
                thumbnailUrl: '/assets/thumbnails/carros/carro-1.png',
                svgUrl: '/assets/drawings/carros/carro-1.svg',
                metadata: { width: 800, height: 600, areaCount: 10 }
              }
            ]
          },
          {
            id: 'animais',
            name: 'Animais',
            drawings: [
              {
                id: 'gato-1',
                name: 'Gato',
                category: 'animais',
                thumbnailUrl: '/assets/thumbnails/animais/gato-1.png',
                svgUrl: '/assets/drawings/animais/gato-1.svg',
                metadata: { width: 800, height: 600, areaCount: 8 }
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      });

      const drawings = await loaderService.loadDrawingsByCategory('carros');

      expect(drawings).toHaveLength(1);
      expect(drawings[0].category).toBe('carros');
    });

    test('deve retornar array vazio para categoria sem desenhos', async () => {
      const mockCatalog = {
        categories: [
          {
            id: 'carros',
            name: 'Carros',
            drawings: [
              {
                id: 'carro-1',
                name: 'Carro Esportivo',
                category: 'carros',
                thumbnailUrl: '/assets/thumbnails/carros/carro-1.png',
                svgUrl: '/assets/drawings/carros/carro-1.svg',
                metadata: { width: 800, height: 600, areaCount: 10 }
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCatalog
      });

      const drawings = await loaderService.loadDrawingsByCategory('dinossauros');

      expect(drawings).toHaveLength(0);
    });

    test('deve lançar erro para categoria inválida', async () => {
      await expect(loaderService.loadDrawingsByCategory(null)).rejects.toThrow('ID de categoria inválido');
      await expect(loaderService.loadDrawingsByCategory('')).rejects.toThrow('ID de categoria inválido');
    });
  });

  describe('clearCache', () => {
    test('deve limpar cache e forçar novo carregamento', async () => {
      const mockCatalog = {
        categories: [
          {
            id: 'carros',
            name: 'Carros',
            drawings: [
              {
                id: 'carro-1',
                name: 'Carro Esportivo',
                category: 'carros',
                thumbnailUrl: '/assets/thumbnails/carros/carro-1.png',
                svgUrl: '/assets/drawings/carros/carro-1.svg',
                metadata: { width: 800, height: 600, areaCount: 10 }
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockCatalog
      });

      // Primeira chamada
      await loaderService.loadDrawings();
      
      // Limpar cache
      loaderService.clearCache();
      
      // Segunda chamada (deve fazer novo fetch)
      await loaderService.loadDrawings();

      // Fetch deve ter sido chamado duas vezes
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
