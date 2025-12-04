import { TransformEngine } from '../TransformEngine.js';
import { JSDOM } from 'jsdom';

describe('TransformEngine', () => {
  let engine;
  let dom;
  let document;

  beforeEach(() => {
    engine = new TransformEngine();
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
  });

  describe('transform()', () => {
    test('deve transformar áreas coloríveis e elementos decorativos', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const colorableElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      colorableElement.setAttribute('fill', '#FF0000');
      colorableElement.setAttribute('stroke', '#000000');
      colorableElement.setAttribute('stroke-width', '1');
      
      const decorativeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      decorativeElement.setAttribute('fill', '#B5B5B5');
      
      svg.appendChild(colorableElement);
      svg.appendChild(decorativeElement);

      const classification = {
        colorable: [{ element: colorableElement }],
        decorative: [{ element: decorativeElement }]
      };

      const result = engine.transform(svg, classification);

      expect(result.svg).toBe(svg);
      expect(result.colorableCount).toBe(1);
      expect(result.decorativeCount).toBe(1);
      expect(result.stats.idsAssigned).toBe(1);
      expect(result.stats.fillsCleared).toBe(1);
      expect(result.stats.strokesAdjusted).toBe(1);
      expect(result.stats.pointerEventsAdded).toBe(1);
    });

    test('deve processar múltiplas áreas coloríveis com IDs sequenciais', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const elements = [];
      
      for (let i = 0; i < 5; i++) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', '#000000');
        svg.appendChild(el);
        elements.push({ element: el });
      }

      const classification = {
        colorable: elements,
        decorative: []
      };

      const result = engine.transform(svg, classification);

      expect(result.stats.idsAssigned).toBe(5);
      expect(elements[0].element.getAttribute('id')).toBe('area-1');
      expect(elements[1].element.getAttribute('id')).toBe('area-2');
      expect(elements[2].element.getAttribute('id')).toBe('area-3');
      expect(elements[3].element.getAttribute('id')).toBe('area-4');
      expect(elements[4].element.getAttribute('id')).toBe('area-5');
    });
  });

  describe('transformColorableArea()', () => {
    test('deve atribuir ID único no formato area-N', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 3, stats);

      expect(element.getAttribute('id')).toBe('area-3');
      expect(stats.idsAssigned).toBe(1);
    });

    test('deve substituir ID existente', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element.setAttribute('id', 'old-id');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.getAttribute('id')).toBe('area-1');
      expect(stats.idsAssigned).toBe(1);
    });

    test('deve definir fill="none" quando fill tem cor', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element.setAttribute('fill', '#FF0000');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.getAttribute('fill')).toBe('none');
      expect(stats.fillsCleared).toBe(1);
    });

    test('deve preservar fill="none" existente', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element.setAttribute('fill', 'none');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.getAttribute('fill')).toBe('none');
      expect(stats.fillsCleared).toBe(0);
    });

    test('deve ajustar stroke-width para mínimo 2px quando menor', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element.setAttribute('stroke-width', '1');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.getAttribute('stroke-width')).toBe('2');
      expect(stats.strokesAdjusted).toBe(1);
    });

    test('deve ajustar stroke-width para 2px quando não definido', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.getAttribute('stroke-width')).toBe('2');
      expect(stats.strokesAdjusted).toBe(1);
    });

    test('deve preservar stroke-width >= 2px', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element.setAttribute('stroke-width', '5');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.getAttribute('stroke-width')).toBe('5');
      expect(stats.strokesAdjusted).toBe(0);
    });

    test('deve remover pointer-events se existir', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element.setAttribute('pointer-events', 'none');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformColorableArea(element, 1, stats);

      expect(element.hasAttribute('pointer-events')).toBe(false);
    });
  });

  describe('transformDecorativeElement()', () => {
    test('deve adicionar pointer-events="none"', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformDecorativeElement(element, stats);

      expect(element.getAttribute('pointer-events')).toBe('none');
      expect(stats.pointerEventsAdded).toBe(1);
    });

    test('deve preservar fill original', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      element.setAttribute('fill', '#B5B5B5');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformDecorativeElement(element, stats);

      expect(element.getAttribute('fill')).toBe('#B5B5B5');
    });

    test('deve preservar stroke original', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      element.setAttribute('stroke', '#000000');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformDecorativeElement(element, stats);

      expect(element.getAttribute('stroke')).toBe('#000000');
    });

    test('não deve atribuir ID no formato area-N', () => {
      const element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const stats = { idsAssigned: 0, strokesAdjusted: 0, fillsCleared: 0, pointerEventsAdded: 0 };

      engine.transformDecorativeElement(element, stats);

      expect(element.hasAttribute('id')).toBe(false);
      expect(stats.idsAssigned).toBe(0);
    });
  });
});
