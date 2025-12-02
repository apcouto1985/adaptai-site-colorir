import fc from 'fast-check';
import { SVGManipulator } from '../SVGManipulator.js';

// Geradores personalizados
const arbitraryColor = () => 
  fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex.toUpperCase()}`);

const arbitraryAreaId = () => 
  fc.integer({ min: 1, max: 50 }).map(n => `area-${n}`);

// Helper para criar SVG de teste
function createTestSVG(areaIds = ['area-1', 'area-2', 'area-3']) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 600');
  
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('id', 'colorable-areas');
  
  areaIds.forEach(id => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', id);
    path.setAttribute('fill', 'white');
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M 10 10 L 100 10 L 100 100 L 10 100 Z');
    group.appendChild(path);
  });
  
  svg.appendChild(group);
  return svg;
}

describe('SVGManipulator Property Tests', () => {
  let manipulator;

  beforeEach(() => {
    manipulator = new SVGManipulator();
  });

  // **Feature: site-colorir, Property 8: Contenção de cor nos limites**
  test('Propriedade 8: Cor aplicada deve modificar apenas o elemento alvo', () => {
    fc.assert(
      fc.property(
        arbitraryAreaId(),
        arbitraryColor(),
        (areaId, color) => {
          const svg = createTestSVG([areaId, 'area-999']);
          
          manipulator.applyColorToArea(svg, areaId, color);
          
          // Verificar que apenas o elemento alvo foi modificado
          const targetElement = svg.querySelector(`#${areaId}`);
          const otherElement = svg.querySelector('#area-999');
          
          return targetElement.getAttribute('fill') === color &&
                 otherElement.getAttribute('fill') === 'white';
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: site-colorir, Property 25: Modificação do atributo fill**
  test('Propriedade 25: Sistema deve modificar atributo fill para cor hexadecimal', () => {
    fc.assert(
      fc.property(
        arbitraryAreaId(),
        arbitraryColor(),
        (areaId, color) => {
          const svg = createTestSVG([areaId]);
          
          manipulator.applyColorToArea(svg, areaId, color);
          
          const element = svg.querySelector(`#${areaId}`);
          const fill = element.getAttribute('fill');
          
          // Verificar que o fill foi modificado para a cor hexadecimal
          return fill === color;
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: site-colorir, Property 15: Estado inicial sem cor**
  test('Propriedade 15: Áreas recém-carregadas devem estar sem cor', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryAreaId(), { minLength: 1, maxLength: 10 }),
        (areaIds) => {
          const svg = createTestSVG(areaIds);
          const areas = manipulator.identifyColorableAreas(svg);
          
          // Todas as áreas devem ter fill="white" ou sem cor
          return areas.every(area => {
            const fill = area.element.getAttribute('fill');
            return fill === 'white' || fill === 'transparent' || !fill;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Identificar áreas coloríveis retorna todas as áreas com id area-*', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryAreaId(), { minLength: 1, maxLength: 20 }),
        (areaIds) => {
          const uniqueIds = [...new Set(areaIds)];
          const svg = createTestSVG(uniqueIds);
          
          const areas = manipulator.identifyColorableAreas(svg);
          
          return areas.length === uniqueIds.length &&
                 areas.every(area => uniqueIds.includes(area.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Limpar cores deve retornar todas as áreas para branco', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(arbitraryAreaId(), arbitraryColor()), { minLength: 1, maxLength: 10 }),
        (coloredAreas) => {
          const areaIds = coloredAreas.map(([id]) => id);
          const uniqueIds = [...new Set(areaIds)];
          const svg = createTestSVG(uniqueIds);
          
          // Aplicar cores
          coloredAreas.forEach(([areaId, color]) => {
            manipulator.applyColorToArea(svg, areaId, color);
          });
          
          // Limpar
          manipulator.clearAllColors(svg);
          
          // Verificar que todas voltaram para branco
          return uniqueIds.every(areaId => {
            const element = svg.querySelector(`#${areaId}`);
            return element.getAttribute('fill') === 'white';
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Aplicar cor múltiplas vezes deve manter última cor', () => {
    fc.assert(
      fc.property(
        arbitraryAreaId(),
        fc.array(arbitraryColor(), { minLength: 2, maxLength: 5 }),
        (areaId, colors) => {
          const svg = createTestSVG([areaId]);
          
          // Aplicar todas as cores em sequência
          colors.forEach(color => {
            manipulator.applyColorToArea(svg, areaId, color);
          });
          
          const element = svg.querySelector(`#${areaId}`);
          const finalColor = element.getAttribute('fill');
          
          // Deve ter a última cor aplicada
          return finalColor === colors[colors.length - 1];
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Destaque deve adicionar classe highlighted', () => {
    fc.assert(
      fc.property(
        arbitraryAreaId(),
        (areaId) => {
          const svg = createTestSVG([areaId]);
          
          manipulator.highlightArea(svg, areaId, true);
          
          const element = svg.querySelector(`#${areaId}`);
          return element.classList.contains('highlighted');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Remover destaque deve remover classe highlighted', () => {
    fc.assert(
      fc.property(
        arbitraryAreaId(),
        (areaId) => {
          const svg = createTestSVG([areaId]);
          
          // Adicionar destaque
          manipulator.highlightArea(svg, areaId, true);
          // Remover destaque
          manipulator.highlightArea(svg, areaId, false);
          
          const element = svg.querySelector(`#${areaId}`);
          return !element.classList.contains('highlighted');
        }
      ),
      { numRuns: 100 }
    );
  });
});
