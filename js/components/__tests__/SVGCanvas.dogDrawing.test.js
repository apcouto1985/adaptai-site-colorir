/**
 * @jest-environment jsdom
 */

import { SVGCanvas } from '../SVGCanvas.js';
import { ColorPalette } from '../ColorPalette.js';
import { ApplicationState } from '../../state/ApplicationState.js';
import fs from 'fs';

describe('SVGCanvas - Dog Drawing Integration Test (Task 20)', () => {
  let svgCanvas;
  let colorPalette;
  let appState;
  let container;
  let dogSvgContent;

  beforeEach(() => {
    // Carregar o SVG do cachorro
    const svgPath = 'assets/drawings/animais/cachorro-novo.svg';
    dogSvgContent = fs.readFileSync(svgPath, 'utf-8');

    // Setup DOM
    document.body.innerHTML = `
      <div id="svg-canvas-container"></div>
      <div id="color-palette-container"></div>
      <div id="gallery-container"></div>
      <div id="coloring-container"></div>
    `;

    container = document.getElementById('svg-canvas-container');
    const paletteContainer = document.getElementById('color-palette-container');
    const galleryContainer = document.getElementById('gallery-container');
    const coloringContainer = document.getElementById('coloring-container');

    // Inicializar componentes com estado simplificado
    appState = {
      selectedColor: '#FF0000',
      setSelectedColor: (color) => { appState.selectedColor = color; },
      getSelectedColor: () => appState.selectedColor
    };
    
    colorPalette = new ColorPalette(paletteContainer, appState);
    svgCanvas = new SVGCanvas(container);

    // Inserir o SVG no container e configurar o canvas
    container.innerHTML = dogSvgContent;
    const svgElement = container.querySelector('svg');
    svgCanvas.svgElement = svgElement;
    svgCanvas.selectedColor = '#FF0000';
    
    // Identificar áreas coloríveis (sem pointer-events="none")
    const allAreas = svgElement.querySelectorAll('[id^="area-"]');
    svgCanvas.colorableAreas = Array.from(allAreas)
      .filter(area => area.getAttribute('pointer-events') !== 'none')
      .map(area => ({ id: area.id, element: area }));
    
    svgCanvas.attachEventListeners();
  });

  afterEach(() => {
    svgCanvas.clearClickLogs();
  });

  describe('Requirement 1.1 - Identificação correta de área clicada', () => {
    test('Deve identificar corretamente area-2 (corpo branco) quando clicada', () => {
      const area2 = container.querySelector('#area-2');
      expect(area2).toBeTruthy();

      // Simular clique na area-2
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent, 'target', {
        value: area2,
        enumerable: true
      });

      svgCanvas.handleAreaClick(clickEvent, 'area-2');

      // Verificar logs
      const logs = svgCanvas.getClickLogs();
      expect(logs.length).toBeGreaterThan(0);

      const lastLog = logs[logs.length - 1];
      expect(lastLog.expectedAreaId).toBe('area-2');
      expect(lastLog.targetId).toBe('area-2');
      expect(lastLog.success).toBe(true);
    });

    test('Deve identificar corretamente area-10 (olho) quando clicada', () => {
      const area10 = container.querySelector('#area-10');
      expect(area10).toBeTruthy();

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent, 'target', {
        value: area10,
        enumerable: true
      });

      svgCanvas.handleAreaClick(clickEvent, 'area-10');

      const logs = svgCanvas.getClickLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.expectedAreaId).toBe('area-10');
      expect(lastLog.targetId).toBe('area-10');
      expect(lastLog.success).toBe(true);
    });
  });

  describe('Requirement 1.2 - Aplicação de cor isolada', () => {
    test('Deve colorir apenas area-2 sem afetar outras áreas', () => {
      const area2 = container.querySelector('#area-2');
      const area4 = container.querySelector('#area-4');
      const area6 = container.querySelector('#area-6');

      // Cor inicial
      const initialArea4Fill = area4.getAttribute('fill');
      const initialArea6Fill = area6.getAttribute('fill');

      // Clicar em area-2
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent, 'target', {
        value: area2,
        enumerable: true
      });

      svgCanvas.handleAreaClick(clickEvent, 'area-2');

      // Verificar que apenas area-2 mudou
      expect(area2.getAttribute('fill')).toBe('#FF0000');
      expect(area4.getAttribute('fill')).toBe(initialArea4Fill);
      expect(area6.getAttribute('fill')).toBe(initialArea6Fill);
    });

    test('Deve colorir area-14 (pata) sem afetar area-10 (olho)', () => {
      const area14 = container.querySelector('#area-14');
      const area10 = container.querySelector('#area-10');

      const initialArea10Fill = area10.getAttribute('fill');

      // Clicar em area-14
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent, 'target', {
        value: area14,
        enumerable: true
      });

      svgCanvas.handleAreaClick(clickEvent, 'area-14');

      // Verificar isolamento
      expect(area14.getAttribute('fill')).toBe('#FF0000');
      expect(area10.getAttribute('fill')).toBe(initialArea10Fill);
    });
  });

  describe('Requirement 1.4 - Ignorar elementos decorativos', () => {
    test('Não deve colorir area-1 (elemento decorativo com pointer-events="none")', () => {
      const area1 = container.querySelector('#area-1');
      expect(area1).toBeTruthy();
      expect(area1.getAttribute('pointer-events')).toBe('none');

      // Verificar que area-1 não está nas áreas coloríveis
      const isColorable = svgCanvas.colorableAreas.some(area => area.id === 'area-1');
      expect(isColorable).toBe(false);
    });

    test('Não deve colorir area-3 (contorno decorativo)', () => {
      const area3 = container.querySelector('#area-3');
      expect(area3).toBeTruthy();
      expect(area3.getAttribute('pointer-events')).toBe('none');

      // Verificar que area-3 não está nas áreas coloríveis
      const isColorable = svgCanvas.colorableAreas.some(area => area.id === 'area-3');
      expect(isColorable).toBe(false);
    });
  });

  describe('Requirement 1.5 - Substituição de cor', () => {
    test('Deve substituir cor anterior quando área já colorida é clicada novamente', () => {
      const area2 = container.querySelector('#area-2');

      // Primeira cor
      svgCanvas.selectedColor = '#FF0000';
      const clickEvent1 = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent1, 'target', {
        value: area2,
        enumerable: true
      });
      svgCanvas.handleAreaClick(clickEvent1, 'area-2');
      expect(area2.getAttribute('fill')).toBe('#FF0000');

      // Segunda cor
      svgCanvas.selectedColor = '#00FF00';
      const clickEvent2 = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent2, 'target', {
        value: area2,
        enumerable: true
      });
      svgCanvas.handleAreaClick(clickEvent2, 'area-2');
      expect(area2.getAttribute('fill')).toBe('#00FF00');

      // Terceira cor
      svgCanvas.selectedColor = '#0000FF';
      const clickEvent3 = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent3, 'target', {
        value: area2,
        enumerable: true
      });
      svgCanvas.handleAreaClick(clickEvent3, 'area-2');
      expect(area2.getAttribute('fill')).toBe('#0000FF');
    });
  });

  describe('Requirement 4.1, 4.2, 4.3 - Logging detalhado', () => {
    test('Deve registrar logs com informações completas para cada clique', () => {
      svgCanvas.clearClickLogs();

      const area2 = container.querySelector('#area-2');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent, 'target', {
        value: area2,
        enumerable: true
      });

      svgCanvas.handleAreaClick(clickEvent, 'area-2');

      const logs = svgCanvas.getClickLogs();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('expectedAreaId');
      expect(log).toHaveProperty('targetId');
      expect(log).toHaveProperty('targetElement');
      expect(log).toHaveProperty('pointerEvents');
      expect(log).toHaveProperty('fill');
      expect(log).toHaveProperty('success');
      expect(log).toHaveProperty('appliedColor');

      expect(log.expectedAreaId).toBe('area-2');
      expect(log.targetId).toBe('area-2');
      expect(log.success).toBe(true);
      expect(log.appliedColor).toBe('#FF0000');
    });

    test('Deve registrar múltiplos cliques em diferentes áreas', () => {
      svgCanvas.clearClickLogs();

      const areaIds = ['area-2', 'area-4', 'area-6', 'area-10'];

      areaIds.forEach(areaId => {
        const area = container.querySelector(`#${areaId}`);
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        Object.defineProperty(clickEvent, 'target', {
          value: area,
          enumerable: true
        });
        svgCanvas.handleAreaClick(clickEvent, areaId);
      });

      const logs = svgCanvas.getClickLogs();
      expect(logs.length).toBe(4);

      expect(logs[0].expectedAreaId).toBe('area-2');
      expect(logs[1].expectedAreaId).toBe('area-4');
      expect(logs[2].expectedAreaId).toBe('area-6');
      expect(logs[3].expectedAreaId).toBe('area-10');

      logs.forEach(log => {
        expect(log.success).toBe(true);
      });
    });
  });

  describe('Validação de estrutura SVG do cachorro', () => {
    test('Deve ter todas as áreas coloríveis esperadas', () => {
      const colorableAreas = [
        'area-2', 'area-4', 'area-6', 'area-8', 'area-10',
        'area-14'
      ];

      colorableAreas.forEach(areaId => {
        const area = container.querySelector(`#${areaId}`);
        expect(area).toBeTruthy();
        expect(area.getAttribute('fill')).toBeTruthy();
        expect(area.getAttribute('pointer-events')).not.toBe('none');
      });
    });

    test('Deve ter elementos decorativos com pointer-events="none"', () => {
      const decorativeAreas = [
        'area-1', 'area-3', 'area-5', 'area-7', 'area-9',
        'area-11', 'area-12', 'area-13', 'area-15', 'area-16',
        'area-17', 'area-18', 'area-19', 'area-20'
      ];

      decorativeAreas.forEach(areaId => {
        const area = container.querySelector(`#${areaId}`);
        expect(area).toBeTruthy();
        expect(area.getAttribute('pointer-events')).toBe('none');
      });
    });

    test('Deve ter IDs únicos para todas as áreas', () => {
      const allAreas = container.querySelectorAll('[id^="area-"]');
      const ids = Array.from(allAreas).map(area => area.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('Teste de cenário completo - Colorir o cachorro', () => {
    test('Deve permitir colorir múltiplas áreas do cachorro sequencialmente', () => {
      svgCanvas.clearClickLogs();

      // Cenário: Criança colore diferentes partes do cachorro
      const coloringSequence = [
        { areaId: 'area-2', color: '#FFD700', description: 'Corpo amarelo' },
        { areaId: 'area-4', color: '#8B4513', description: 'Orelha marrom' },
        { areaId: 'area-6', color: '#8B4513', description: 'Outra orelha marrom' },
        { areaId: 'area-10', color: '#000000', description: 'Olho preto' },
        { areaId: 'area-14', color: '#FFD700', description: 'Pata amarela' }
      ];

      coloringSequence.forEach(({ areaId, color }) => {
        const area = container.querySelector(`#${areaId}`);
        expect(area).toBeTruthy();

        svgCanvas.selectedColor = color;

        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        Object.defineProperty(clickEvent, 'target', {
          value: area,
          enumerable: true
        });

        svgCanvas.handleAreaClick(clickEvent, areaId);

        // Verificar que a cor foi aplicada
        expect(area.getAttribute('fill')).toBe(color);
      });

      // Verificar logs
      const logs = svgCanvas.getClickLogs();
      expect(logs.length).toBe(5);

      logs.forEach((log, index) => {
        expect(log.success).toBe(true);
        expect(log.expectedAreaId).toBe(coloringSequence[index].areaId);
        expect(log.appliedColor).toBe(coloringSequence[index].color);
      });
    });
  });

  describe('Confirmação do problema original resolvido', () => {
    test('Clicar em uma parte específica NÃO deve colorir o desenho inteiro', () => {
      // Este era o problema original: clicar em uma área coloria tudo

      const area2 = container.querySelector('#area-2');
      const area4 = container.querySelector('#area-4');
      const area6 = container.querySelector('#area-6');
      const area10 = container.querySelector('#area-10');

      // Cores iniciais
      const initialFills = {
        area2: area2.getAttribute('fill'),
        area4: area4.getAttribute('fill'),
        area6: area6.getAttribute('fill'),
        area10: area10.getAttribute('fill')
      };

      // Clicar em area-2
      svgCanvas.selectedColor = '#FF0000';
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      Object.defineProperty(clickEvent, 'target', {
        value: area2,
        enumerable: true
      });
      svgCanvas.handleAreaClick(clickEvent, 'area-2');

      // Verificar que APENAS area-2 mudou
      expect(area2.getAttribute('fill')).toBe('#FF0000');
      expect(area4.getAttribute('fill')).toBe(initialFills.area4);
      expect(area6.getAttribute('fill')).toBe(initialFills.area6);
      expect(area10.getAttribute('fill')).toBe(initialFills.area10);

      // Confirmar que o problema está resolvido
      const logs = svgCanvas.getClickLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.success).toBe(true);
      expect(lastLog.expectedAreaId).toBe('area-2');
      expect(lastLog.targetId).toBe('area-2');
    });
  });
});
