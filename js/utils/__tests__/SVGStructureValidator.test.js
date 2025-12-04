import { SVGStructureValidator } from '../SVGStructureValidator.js';

describe('SVGStructureValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new SVGStructureValidator();
  });

  describe('fixDuplicateIds', () => {
    test('deve corrigir IDs duplicados renomeando elementos decorativos', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Criar área colorível com area-1
      const colorableElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      colorableElement.setAttribute('id', 'area-1');
      colorableElement.setAttribute('fill', '#FFFFFF');
      svg.appendChild(colorableElement);
      
      // Criar elemento decorativo duplicado com area-1
      const decorativeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      decorativeElement.setAttribute('id', 'area-1');
      decorativeElement.setAttribute('fill', '#B5B5B5');
      decorativeElement.setAttribute('pointer-events', 'none');
      svg.appendChild(decorativeElement);

      const result = validator.fixDuplicateIds(svg);

      expect(result.fixed).toBe(true);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toContain('Renomeado area-1 para decorative-1');
      expect(decorativeElement.getAttribute('id')).toBe('decorative-1');
      expect(colorableElement.getAttribute('id')).toBe('area-1');
    });

    test('não deve fazer mudanças quando não há IDs duplicados', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      const element1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element1.setAttribute('id', 'area-1');
      svg.appendChild(element1);
      
      const element2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      element2.setAttribute('id', 'area-2');
      svg.appendChild(element2);

      const result = validator.fixDuplicateIds(svg);

      expect(result.fixed).toBe(false);
      expect(result.changes).toHaveLength(0);
    });

    test('deve retornar resultado vazio para SVG inválido', () => {
      const result = validator.fixDuplicateIds(null);

      expect(result.fixed).toBe(false);
      expect(result.changes).toHaveLength(0);
    });

    test('deve renomear múltiplos elementos decorativos duplicados', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      
      // Criar área colorível
      const colorableElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      colorableElement.setAttribute('id', 'area-1');
      colorableElement.setAttribute('fill', '#FFFFFF');
      svg.appendChild(colorableElement);
      
      // Criar primeiro elemento decorativo duplicado
      const decorative1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      decorative1.setAttribute('id', 'area-1');
      decorative1.setAttribute('pointer-events', 'none');
      svg.appendChild(decorative1);
      
      // Criar segundo elemento decorativo duplicado
      const decorative2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      decorative2.setAttribute('id', 'area-1');
      decorative2.setAttribute('pointer-events', 'none');
      svg.appendChild(decorative2);

      const result = validator.fixDuplicateIds(svg);

      expect(result.fixed).toBe(true);
      expect(result.changes).toHaveLength(2);
      expect(decorative1.getAttribute('id')).toBe('decorative-1');
      expect(decorative2.getAttribute('id')).toBe('decorative-2');
      expect(colorableElement.getAttribute('id')).toBe('area-1');
    });
  });
});
