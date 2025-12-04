/**
 * Testes unitários para métodos de logging do SVGCanvas
 * Valida Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { jest } from '@jest/globals';
import { SVGCanvas } from '../SVGCanvas.js';

describe('SVGCanvas - Logging Methods', () => {
  let container;
  let canvas;
  let mockSVGElement;

  beforeEach(() => {
    // Criar container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Criar mock do SVG
    mockSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockSVGElement.innerHTML = `
      <rect id="area-1" fill="none" />
      <rect id="area-2" fill="none" />
    `;

    // Criar instância do canvas
    canvas = new SVGCanvas(container, {
      selectedColor: '#FF0000'
    });
    
    // Configurar SVG e áreas manualmente
    canvas.svgElement = mockSVGElement;
    canvas.colorableAreas = [
      { id: 'area-1', element: mockSVGElement.querySelector('#area-1') },
      { id: 'area-2', element: mockSVGElement.querySelector('#area-2') }
    ];
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('logClickEvent()', () => {
    it('deve criar log com todos os campos obrigatórios', () => {
      // Arrange
      const logData = {
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      };

      // Act
      canvas.logClickEvent(logData);
      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });
      expect(logs[0].timestamp).toBeGreaterThan(0);
      expect(typeof logs[0].timestamp).toBe('number');
    });

    it('deve registrar múltiplos eventos em ordem', () => {
      // Arrange & Act
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      canvas.logClickEvent({
        expectedAreaId: 'area-2',
        targetId: 'area-2',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#00FF00'
      });

      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(2);
      expect(logs[0].expectedAreaId).toBe('area-1');
      expect(logs[1].expectedAreaId).toBe('area-2');
      expect(logs[0].timestamp).toBeLessThanOrEqual(logs[1].timestamp);
    });

    it('deve registrar evento com sucesso=false quando aplicação falha', () => {
      // Arrange
      const logData = {
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: false,
        appliedColor: null
      };

      // Act
      canvas.logClickEvent(logData);
      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(1);
      expect(logs[0].success).toBe(false);
      expect(logs[0].appliedColor).toBeNull();
    });
  });

  describe('logError()', () => {
    it('deve registrar erro com motivo e contexto', () => {
      // Arrange
      const reason = 'Elemento decorativo clicado';
      const context = {
        expectedAreaId: 'area-1',
        targetId: 'deco-1',
        targetElement: 'path',
        pointerEvents: 'none',
        fill: '#B5B5B5'
      };

      // Act
      canvas.logError(reason, context);
      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        expectedAreaId: 'area-1',
        targetId: 'deco-1',
        targetElement: 'path',
        pointerEvents: 'none',
        fill: '#B5B5B5',
        success: false,
        appliedColor: null
      });
      expect(logs[0].timestamp).toBeGreaterThan(0);
    });

    it('deve registrar erro com contexto mínimo', () => {
      // Arrange
      const reason = 'SVG não disponível';
      const context = {
        expectedAreaId: 'area-1'
      };

      // Act
      canvas.logError(reason, context);
      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        expectedAreaId: 'area-1',
        targetId: null,
        targetElement: null,
        pointerEvents: null,
        fill: null,
        success: false,
        appliedColor: null
      });
    });

    it('deve registrar múltiplos erros', () => {
      // Act
      canvas.logError('Erro 1', { expectedAreaId: 'area-1' });
      canvas.logError('Erro 2', { expectedAreaId: 'area-2' });
      canvas.logError('Erro 3', { expectedAreaId: 'area-1' });

      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(3);
      expect(logs.every(log => log.success === false)).toBe(true);
      expect(logs.every(log => log.appliedColor === null)).toBe(true);
    });
  });

  describe('getClickLogs()', () => {
    it('deve retornar array vazio quando não há logs', () => {
      // Act
      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toEqual([]);
      expect(Array.isArray(logs)).toBe(true);
    });

    it('deve retornar cópia dos logs, não referência', () => {
      // Arrange
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      // Act
      const logs1 = canvas.getClickLogs();
      const logs2 = canvas.getClickLogs();

      // Assert
      expect(logs1).not.toBe(logs2); // Diferentes referências
      expect(logs1).toEqual(logs2); // Mesmo conteúdo
    });

    it('deve retornar logs sem permitir modificação do array interno', () => {
      // Arrange
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      // Act
      const logs = canvas.getClickLogs();
      logs.push({ fake: 'log' }); // Tentar modificar cópia

      // Assert
      expect(canvas.getClickLogs()).toHaveLength(1); // Array interno não foi modificado
    });

    it('deve retornar todos os logs registrados', () => {
      // Arrange
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      canvas.logError('Erro teste', { expectedAreaId: 'area-2' });

      canvas.logClickEvent({
        expectedAreaId: 'area-2',
        targetId: 'area-2',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#00FF00'
      });

      // Act
      const logs = canvas.getClickLogs();

      // Assert
      expect(logs).toHaveLength(3);
      expect(logs[0].success).toBe(true);
      expect(logs[1].success).toBe(false);
      expect(logs[2].success).toBe(true);
    });
  });

  describe('clearClickLogs()', () => {
    it('deve limpar todos os logs', () => {
      // Arrange
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      canvas.logError('Erro teste', { expectedAreaId: 'area-2' });

      expect(canvas.getClickLogs()).toHaveLength(2);

      // Act
      canvas.clearClickLogs();

      // Assert
      expect(canvas.getClickLogs()).toHaveLength(0);
      expect(canvas.getClickLogs()).toEqual([]);
    });

    it('deve permitir novos logs após limpar', () => {
      // Arrange
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      canvas.clearClickLogs();

      // Act
      canvas.logClickEvent({
        expectedAreaId: 'area-2',
        targetId: 'area-2',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#00FF00'
      });

      // Assert
      const logs = canvas.getClickLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].expectedAreaId).toBe('area-2');
    });

    it('deve ser seguro chamar múltiplas vezes', () => {
      // Arrange
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      // Act
      canvas.clearClickLogs();
      canvas.clearClickLogs();
      canvas.clearClickLogs();

      // Assert
      expect(canvas.getClickLogs()).toEqual([]);
    });
  });

  describe('Integração entre métodos de logging', () => {
    it('deve manter logs de eventos e erros juntos', () => {
      // Act
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      canvas.logError('Elemento decorativo', {
        expectedAreaId: 'area-2',
        targetId: 'deco-1'
      });

      canvas.logClickEvent({
        expectedAreaId: 'area-2',
        targetId: 'area-2',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#00FF00'
      });

      // Assert
      const logs = canvas.getClickLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].success).toBe(true);
      expect(logs[0].appliedColor).toBe('#FF0000');
      expect(logs[1].success).toBe(false);
      expect(logs[1].appliedColor).toBeNull();
      expect(logs[2].success).toBe(true);
      expect(logs[2].appliedColor).toBe('#00FF00');
    });

    it('deve preservar ordem cronológica de todos os logs', () => {
      // Act
      const timestamp1 = Date.now();
      canvas.logClickEvent({
        expectedAreaId: 'area-1',
        targetId: 'area-1',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#FF0000'
      });

      canvas.logError('Erro', { expectedAreaId: 'area-2' });

      canvas.logClickEvent({
        expectedAreaId: 'area-2',
        targetId: 'area-2',
        targetElement: 'rect',
        pointerEvents: null,
        fill: 'none',
        success: true,
        appliedColor: '#00FF00'
      });

      // Assert
      const logs = canvas.getClickLogs();
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(timestamp1);
      expect(logs[1].timestamp).toBeGreaterThanOrEqual(logs[0].timestamp);
      expect(logs[2].timestamp).toBeGreaterThanOrEqual(logs[1].timestamp);
    });
  });
});
