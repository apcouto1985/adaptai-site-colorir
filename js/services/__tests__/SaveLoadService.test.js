/**
 * Testes para SaveLoadService
 */

import { SaveLoadService } from '../SaveLoadService.js';

describe('SaveLoadService', () => {
  let service;
  let mockDrawingData;

  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    
    service = new SaveLoadService();
    
    mockDrawingData = {
      drawingId: 'test-drawing-1',
      drawingName: 'Desenho de Teste',
      coloredAreas: {
        'area1': '#FF0000',
        'area2': '#00FF00',
        'area3': '#0000FF'
      },
      svgContent: '<svg><rect id="area1" /></svg>'
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveDrawing', () => {
    test('deve salvar um desenho com sucesso', () => {
      const result = service.saveDrawing(mockDrawingData, 'Meu Desenho');

      expect(result.success).toBe(true);
      expect(result.saveId).toBeDefined();
      expect(result.message).toContain('salvo');
    });

    test('deve usar nome padrão se customName não for fornecido', () => {
      const result = service.saveDrawing(mockDrawingData);

      expect(result.success).toBe(true);
      
      const savedDrawings = service.getSavedDrawingsList();
      expect(savedDrawings[0].customName).toContain(mockDrawingData.drawingName);
    });

    test('deve atualizar salvamento existente com mesmo nome', () => {
      const customName = 'Desenho Único';
      
      // Primeiro salvamento
      const result1 = service.saveDrawing(mockDrawingData, customName);
      expect(result1.success).toBe(true);
      
      // Segundo salvamento com mesmo nome
      const updatedData = { ...mockDrawingData, coloredAreas: { 'area1': '#FFFFFF' } };
      const result2 = service.saveDrawing(updatedData, customName);
      
      expect(result2.success).toBe(true);
      expect(result2.message).toContain('atualizado');
      
      // Deve ter apenas um salvamento
      const savedDrawings = service.getSavedDrawingsList();
      expect(savedDrawings.length).toBe(1);
    });

    test('deve respeitar limite máximo de salvamentos', () => {
      // Salvar mais desenhos que o limite
      for (let i = 0; i < service.maxSavedDrawings + 5; i++) {
        service.saveDrawing(mockDrawingData, `Desenho ${i}`);
      }

      const savedDrawings = service.getSavedDrawingsList();
      expect(savedDrawings.length).toBe(service.maxSavedDrawings);
    });

    test('deve incluir timestamp e versão no salvamento', () => {
      service.saveDrawing(mockDrawingData, 'Teste');
      
      const savedDrawings = service.getSavedDrawingsList();
      const saved = savedDrawings[0];
      
      expect(saved.savedAt).toBeDefined();
      expect(new Date(saved.savedAt)).toBeInstanceOf(Date);
    });
  });

  describe('loadDrawing', () => {
    test('deve carregar um desenho salvo', () => {
      const saveResult = service.saveDrawing(mockDrawingData, 'Teste');
      const loadResult = service.loadDrawing(saveResult.saveId);

      expect(loadResult.success).toBe(true);
      expect(loadResult.data.drawingId).toBe(mockDrawingData.drawingId);
      expect(loadResult.data.coloredAreas).toEqual(mockDrawingData.coloredAreas);
    });

    test('deve retornar null para ID inexistente', () => {
      const result = service.loadDrawing('id-inexistente');

      expect(result.success).toBe(false);
    });
  });

  describe('getSavedDrawingsList', () => {
    test('deve retornar lista vazia quando não há salvamentos', () => {
      const list = service.getSavedDrawingsList();
      expect(list).toEqual([]);
    });

    test('deve retornar lista de desenhos salvos', () => {
      service.saveDrawing(mockDrawingData, 'Desenho 1');
      service.saveDrawing(mockDrawingData, 'Desenho 2');

      const list = service.getSavedDrawingsList();
      
      expect(list.length).toBe(2);
      expect(list[0].customName).toBe('Desenho 2'); // Mais recente primeiro
      expect(list[1].customName).toBe('Desenho 1');
    });

    test('deve filtrar por drawingId quando fornecido', () => {
      service.saveDrawing(mockDrawingData, 'Desenho A');
      
      const otherDrawing = { ...mockDrawingData, drawingId: 'other-drawing' };
      service.saveDrawing(otherDrawing, 'Desenho B');

      const filtered = service.getSavedDrawingsList('test-drawing-1');
      
      expect(filtered.length).toBe(1);
      expect(filtered[0].drawingId).toBe('test-drawing-1');
    });

    test('deve incluir preview com informações do desenho', () => {
      service.saveDrawing(mockDrawingData, 'Teste');
      
      const list = service.getSavedDrawingsList();
      const preview = list[0].preview;
      
      expect(preview.coloredAreas).toBe(3);
      expect(preview.uniqueColors).toBe(3);
      expect(preview.primaryColors).toHaveLength(3);
    });
  });

  describe('deleteDrawing', () => {
    test('deve remover um desenho salvo', () => {
      const saveResult = service.saveDrawing(mockDrawingData, 'Teste');
      const deleteResult = service.deleteDrawing(saveResult.saveId);

      expect(deleteResult.success).toBe(true);
      
      const list = service.getSavedDrawingsList();
      expect(list.length).toBe(0);
    });

    test('deve retornar erro para ID inexistente', () => {
      const result = service.deleteDrawing('id-inexistente');

      expect(result.success).toBe(false);
      expect(result.message).toContain('não encontrado');
    });
  });

  describe('exportDrawing', () => {
    test('deve retornar erro quando URL.createObjectURL não está disponível', () => {
      const saveResult = service.saveDrawing(mockDrawingData, 'Teste');
      const exportResult = service.exportDrawing(saveResult.saveId);

      // Em ambiente de teste sem URL.createObjectURL, deve retornar erro
      expect(exportResult.success).toBe(false);
      expect(exportResult.message).toContain('Erro');
    });
  });

  describe('importDrawing', () => {
    test('deve rejeitar arquivo não-JSON', async () => {
      const file = { type: 'text/plain' };
      const result = await service.importDrawing(file);

      expect(result.success).toBe(false);
      expect(result.message).toContain('JSON');
    });

    test('deve validar estrutura do arquivo importado', async () => {
      // Simular arquivo com dados inválidos
      const invalidData = JSON.stringify({ invalid: 'data' });
      const file = {
        type: 'application/json',
        text: async () => invalidData
      };
      
      const result = await service.importDrawing(file);

      expect(result.success).toBe(false);
      expect(result.message).toContain('desenho válido');
    });
  });

  describe('clearAllSavedDrawings', () => {
    test('deve remover todos os desenhos salvos', () => {
      service.saveDrawing(mockDrawingData, 'Desenho 1');
      service.saveDrawing(mockDrawingData, 'Desenho 2');
      service.saveDrawing(mockDrawingData, 'Desenho 3');

      const result = service.clearAllSavedDrawings();

      expect(result.success).toBe(true);
      
      const list = service.getSavedDrawingsList();
      expect(list.length).toBe(0);
    });
  });

  describe('getStorageStats', () => {
    test('deve retornar estatísticas corretas', () => {
      service.saveDrawing(mockDrawingData, 'Desenho 1');
      service.saveDrawing(mockDrawingData, 'Desenho 2');

      const stats = service.getStorageStats();

      expect(stats.totalDrawings).toBe(2);
      expect(stats.maxDrawings).toBe(service.maxSavedDrawings);
      expect(stats.storageUsed).toBeGreaterThan(0);
      expect(stats.oldestSave).toBeDefined();
      expect(stats.newestSave).toBeDefined();
    });

    test('deve retornar estatísticas vazias quando não há salvamentos', () => {
      const stats = service.getStorageStats();

      expect(stats.totalDrawings).toBe(0);
      expect(stats.oldestSave).toBeNull();
      expect(stats.newestSave).toBeNull();
    });
  });

  describe('Persistência', () => {
    test('deve persistir dados entre instâncias', () => {
      const service1 = new SaveLoadService();
      service1.saveDrawing(mockDrawingData, 'Teste Persistência');

      const service2 = new SaveLoadService();
      const list = service2.getSavedDrawingsList();

      expect(list.length).toBe(1);
      expect(list[0].customName).toBe('Teste Persistência');
    });
  });

  describe('Tratamento de erros', () => {
    test('deve lidar com dados corrompidos no localStorage', () => {
      // Inserir dados inválidos
      localStorage.setItem(service.storageKey, 'dados-invalidos');

      const list = service.getSavedDrawingsList();
      
      // Deve retornar lista vazia em vez de quebrar
      expect(list).toEqual([]);
    });
  });
});
