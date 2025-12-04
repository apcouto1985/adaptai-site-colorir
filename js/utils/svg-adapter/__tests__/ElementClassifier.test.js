import { ElementClassifier } from '../ElementClassifier.js';

describe('ElementClassifier', () => {
  let classifier;

  beforeEach(() => {
    classifier = new ElementClassifier();
  });

  describe('classifyElement - Heurística 1', () => {
    it('deve classificar elemento com fill="none" e stroke como colorível', () => {
      const elementInfo = {
        tagName: 'path',
        fill: 'none',
        stroke: '#000000',
        bounds: { x: 0, y: 0, width: 100, height: 100, area: 10000 }
      };

      expect(classifier.classifyElement(elementInfo)).toBe('colorable');
    });
  });

  describe('classifyElement - Heurística 2', () => {
    it('deve classificar elemento com área < 100px² como decorativo', () => {
      const elementInfo = {
        tagName: 'circle',
        fill: '#FF0000',
        stroke: null,
        bounds: { x: 0, y: 0, width: 5, height: 5, area: 25 }
      };

      expect(classifier.classifyElement(elementInfo)).toBe('decorative');
    });
  });

  describe('classifyElement - Heurística 3', () => {
    it('deve classificar elemento com fill="#000000" como decorativo', () => {
      const elementInfo = {
        tagName: 'rect',
        fill: '#000000',
        stroke: null,
        bounds: { x: 0, y: 0, width: 100, height: 100, area: 10000 }
      };

      expect(classifier.classifyElement(elementInfo)).toBe('decorative');
    });

    it('deve classificar elemento com fill="black" como decorativo', () => {
      const elementInfo = {
        tagName: 'rect',
        fill: 'black',
        stroke: null,
        bounds: { x: 0, y: 0, width: 100, height: 100, area: 10000 }
      };

      expect(classifier.classifyElement(elementInfo)).toBe('decorative');
    });
  });

  describe('classifyElement - Heurística 4', () => {
    it('deve classificar elemento com fill colorido e stroke como decorativo', () => {
      const elementInfo = {
        tagName: 'path',
        fill: '#FF0000',
        stroke: '#000000',
        bounds: { x: 0, y: 0, width: 100, height: 100, area: 10000 }
      };

      expect(classifier.classifyElement(elementInfo)).toBe('decorative');
    });
  });

  describe('classify', () => {
    it('deve classificar array de elementos corretamente', () => {
      const elements = [
        {
          tagName: 'path',
          fill: 'none',
          stroke: '#000000',
          bounds: { x: 0, y: 0, width: 100, height: 100, area: 10000 }
        },
        {
          tagName: 'circle',
          fill: '#000000',
          stroke: null,
          bounds: { x: 0, y: 0, width: 100, height: 100, area: 10000 }
        }
      ];

      const result = classifier.classify(elements);

      expect(result.colorable).toHaveLength(1);
      expect(result.decorative).toHaveLength(1);
    });
  });
});
