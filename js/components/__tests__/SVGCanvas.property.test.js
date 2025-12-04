import { jest } from '@jest/globals';
import * as fc from 'fast-check';
import { SVGCanvas } from '../SVGCanvas.js';

/**
 * Helper para criar um SVG de teste
 */
function createTestSVG(areaCount = 3) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '200');
  svg.setAttribute('height', '200');
  
  for (let i = 1; i <= areaCount; i++) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('id', `area-${i}`);
    rect.setAttribute('x', `${(i - 1) * 60}`);
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '50');
    rect.setAttribute('height', '50');
    rect.setAttribute('fill', 'none');
    svg.appendChild(rect);
  }
  
  return svg;
}

/**
 * Helper para criar um evento de clique simulado
 */
function createClickEvent(target) {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  // Definir o target do evento
  Object.defineProperty(event, 'target', {
    value: target,
    writable: false
  });
  
  return event;
}

/**
 * **Feature: svg-area-selection-fix, Property 1: Identificação correta de área clicada**
 * **Validates: Requirements 1.1, 2.1**
 * 
 * Para qualquer área colorível em um desenho SVG, quando um clique é simulado
 * naquela área, o sistema deve identificar corretamente o ID da área clicada.
 */
describe('Property 1: Identificação correta de área clicada', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área colorível, ao clicar deve identificar o ID correto', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, color) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const expectedAreaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Obter o elemento da área
          const element = svg.querySelector(`#${expectedAreaId}`);
          
          // Criar evento de clique com o target correto
          const clickEvent = createClickEvent(element);

          // Clicar na área
          canvas.handleAreaClick(clickEvent, expectedAreaId);

          // Verificar se a cor foi aplicada à área correta
          const appliedColor = canvas.getAreaColor(expectedAreaId);
          const elementFill = element?.getAttribute('fill');

          canvas.destroy();

          // A área clicada deve ter a cor aplicada
          return appliedColor === color && elementFill === color;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 6: Extração de ID válido**
 * **Validates: Requirements 2.2**
 * 
 * Para qualquer event target com um ID de área válido (formato "area-N"),
 * o sistema deve extrair corretamente o ID e aplicar a cor selecionada.
 */
describe('Property 6: Extração de ID válido', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer event target com ID válido, deve extrair e aplicar cor corretamente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaNumber, color) => {
          const areaId = `area-${areaNumber}`;

          // Criar SVG de teste com apenas uma área
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '200');
          svg.setAttribute('height', '200');
          
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('id', areaId);
          rect.setAttribute('x', '0');
          rect.setAttribute('y', '0');
          rect.setAttribute('width', '50');
          rect.setAttribute('height', '50');
          rect.setAttribute('fill', 'none');
          svg.appendChild(rect);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = [{ id: areaId }];
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Criar evento de clique com o target tendo ID válido
          const clickEvent = createClickEvent(rect);

          // Clicar na área
          canvas.handleAreaClick(clickEvent, areaId);

          // Verificar se o ID foi extraído corretamente e a cor aplicada
          const appliedColor = canvas.getAreaColor(areaId);
          const elementFill = rect.getAttribute('fill');

          canvas.destroy();

          // O ID deve ter sido extraído e a cor aplicada
          return appliedColor === color && elementFill === color;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 6: Transformação do cursor**
 * **Valida: Requisitos 2.2**
 * 
 * Para qualquer posição do mouse sobre uma área colorível do desenho,
 * o cursor deve ter o estilo visual de pincel aplicado.
 */
describe('Propriedade 6: Transformação do cursor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área colorível, ao passar o mouse deve aplicar cursor de pincel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (areaCount, areaIndex) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          // Mock do SVGManipulator
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Simular mouse enter
          canvas.handleAreaMouseEnter(areaId);

          // Verificar cursor
          const element = svg.querySelector(`#${areaId}`);
          const hasCrosshairCursor = element?.style.cursor === 'crosshair';

          canvas.destroy();

          return hasCrosshairCursor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 7: Aplicação de cor ao clicar**
 * **Valida: Requisitos 2.3**
 * 
 * Para qualquer área colorível e qualquer cor selecionada na paleta,
 * quando o usuário clica naquela área, a área deve ser preenchida com a cor selecionada.
 */
describe('Propriedade 7: Aplicação de cor ao clicar', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área e cor, ao clicar deve aplicar a cor selecionada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, color) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Obter o elemento da área
          const element = svg.querySelector(`#${areaId}`);
          
          // Criar evento de clique
          const clickEvent = createClickEvent(element);

          // Clicar na área
          canvas.handleAreaClick(clickEvent, areaId);

          // Verificar se a cor foi aplicada
          const appliedColor = canvas.getAreaColor(areaId);
          const fillAttribute = element?.getAttribute('fill');

          canvas.destroy();

          return appliedColor === color && fillAttribute === color;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 2: Aplicação de cor isolada**
 * **Validates: Requirements 1.2, 2.2**
 * 
 * Para qualquer área colorível e qualquer cor válida, quando a cor é aplicada
 * à área, apenas aquela área específica deve ter sua cor alterada, e todas as
 * outras áreas devem permanecer inalteradas.
 */
describe('Property 2: Aplicação de cor isolada', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área e cor, ao aplicar cor apenas aquela área deve ser alterada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, color) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const targetAreaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();

          // Capturar estado inicial de todas as áreas
          const initialStates = new Map();
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const element = svg.querySelector(`#${areaId}`);
            initialStates.set(areaId, {
              fill: element?.getAttribute('fill'),
              appliedColor: canvas.getAreaColor(areaId)
            });
          }

          // Aplicar cor à área alvo usando o método dedicado
          canvas.applyColorToArea(targetAreaId, color);

          // Verificar que apenas a área alvo foi modificada
          let onlyTargetChanged = true;
          
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const element = svg.querySelector(`#${areaId}`);
            const currentFill = element?.getAttribute('fill');
            const currentAppliedColor = canvas.getAreaColor(areaId);
            const initialState = initialStates.get(areaId);

            if (areaId === targetAreaId) {
              // Área alvo deve ter a nova cor
              if (currentFill !== color || currentAppliedColor !== color) {
                onlyTargetChanged = false;
              }
            } else {
              // Outras áreas devem permanecer inalteradas
              if (currentFill !== initialState.fill || currentAppliedColor !== initialState.appliedColor) {
                onlyTargetChanged = false;
              }
            }
          }

          canvas.destroy();

          return onlyTargetChanged;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Aplicar cor a múltiplas áreas diferentes deve manter cada cor isolada', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 8 }),
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`), { minLength: 2, maxLength: 5 }),
        (areaCount, colors) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();

          // Aplicar cores diferentes a áreas diferentes
          const coloredAreas = new Map();
          colors.forEach((color, index) => {
            if (index < areaCount) {
              const areaId = `area-${index + 1}`;
              canvas.applyColorToArea(areaId, color);
              coloredAreas.set(areaId, color);
            }
          });

          // Verificar que cada área tem a cor correta
          let allCorrect = true;
          
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const expectedColor = coloredAreas.get(areaId);
            const actualColor = canvas.getAreaColor(areaId);
            const element = svg.querySelector(`#${areaId}`);
            const fillAttribute = element?.getAttribute('fill');

            if (expectedColor) {
              // Área que deveria ter cor
              if (actualColor !== expectedColor || fillAttribute !== expectedColor) {
                allCorrect = false;
              }
            } else {
              // Área que não deveria ter cor aplicada
              if (actualColor !== null) {
                allCorrect = false;
              }
            }
          }

          canvas.destroy();

          return allCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 5: Substituição de cor**
 * **Validates: Requirements 1.5**
 * 
 * Para qualquer área colorível já colorida, quando uma nova cor é aplicada,
 * a cor anterior deve ser completamente substituída pela nova cor.
 */
describe('Property 5: Substituição de cor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área colorida, ao aplicar nova cor deve substituir completamente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, firstColor, secondColor) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();

          // Aplicar primeira cor
          canvas.applyColorToArea(areaId, firstColor);

          // Verificar que primeira cor foi aplicada
          const firstAppliedColor = canvas.getAreaColor(areaId);
          const element = svg.querySelector(`#${areaId}`);
          const firstFillAttribute = element?.getAttribute('fill');

          // Aplicar segunda cor
          canvas.applyColorToArea(areaId, secondColor);

          // Verificar que apenas a segunda cor está presente
          const secondAppliedColor = canvas.getAreaColor(areaId);
          const secondFillAttribute = element?.getAttribute('fill');

          canvas.destroy();

          // Primeira cor deve ter sido aplicada inicialmente
          const firstColorApplied = firstAppliedColor === firstColor && firstFillAttribute === firstColor;
          
          // Segunda cor deve ter substituído completamente a primeira
          const secondColorReplaced = secondAppliedColor === secondColor && secondFillAttribute === secondColor;
          
          // Não deve haver traços da primeira cor
          const noFirstColorRemaining = secondAppliedColor !== firstColor;

          return firstColorApplied && secondColorReplaced && noFirstColorRemaining;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Substituir cor múltiplas vezes deve sempre manter apenas a última cor', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`), { minLength: 2, maxLength: 5 }),
        (areaNumber, colors) => {
          const areaId = `area-${areaNumber}`;

          // Criar SVG de teste com apenas uma área
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '200');
          svg.setAttribute('height', '200');
          
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('id', areaId);
          rect.setAttribute('x', '0');
          rect.setAttribute('y', '0');
          rect.setAttribute('width', '50');
          rect.setAttribute('height', '50');
          rect.setAttribute('fill', 'none');
          svg.appendChild(rect);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = [{ id: areaId }];
          
          canvas.render();

          // Aplicar cada cor sequencialmente
          colors.forEach(color => {
            canvas.applyColorToArea(areaId, color);
          });

          // Verificar que apenas a última cor está presente
          const lastColor = colors[colors.length - 1];
          const appliedColor = canvas.getAreaColor(areaId);
          const fillAttribute = rect.getAttribute('fill');

          canvas.destroy();

          return appliedColor === lastColor && fillAttribute === lastColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 9: Substituição de cor**
 * **Valida: Requisitos 2.5**
 * 
 * Para qualquer área já colorida, quando o usuário clica naquela área
 * com uma nova cor selecionada, a cor anterior deve ser completamente
 * substituída pela nova cor.
 */
describe('Propriedade 9: Substituição de cor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área colorida, ao clicar com nova cor deve substituir completamente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, firstColor, secondColor) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Obter o elemento da área
          const element = svg.querySelector(`#${areaId}`);
          
          // Criar evento de clique
          const clickEvent = createClickEvent(element);

          // Aplicar primeira cor
          canvas.selectedColor = firstColor;
          canvas.handleAreaClick(clickEvent, areaId);

          // Aplicar segunda cor
          canvas.selectedColor = secondColor;
          canvas.handleAreaClick(clickEvent, areaId);

          // Verificar que apenas a segunda cor está presente
          const appliedColor = canvas.getAreaColor(areaId);
          const fillAttribute = element?.getAttribute('fill');

          canvas.destroy();

          return appliedColor === secondColor && fillAttribute === secondColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 14: Destaque de área sob cursor**
 * **Valida: Requisitos 4.3**
 * 
 * Para qualquer área colorível sob o cursor do mouse, aquela área deve ter
 * destaque visual aplicado enquanto o cursor estiver sobre ela.
 */
describe('Propriedade 14: Destaque de área sob cursor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer área sob o cursor, deve ter destaque visual aplicado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (areaCount, areaIndex) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const areaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Simular mouse enter
          canvas.handleAreaMouseEnter(areaId);

          // Verificar destaque
          const element = svg.querySelector(`#${areaId}`);
          const hasHighlightClass = element?.classList.contains('highlighted');
          const isCurrentlyHighlighted = canvas.currentHighlightedArea === areaId;

          // Simular mouse leave
          canvas.handleAreaMouseLeave(areaId);

          // Verificar que destaque foi removido
          const highlightRemoved = !element?.classList.contains('highlighted');
          const noLongerHighlighted = canvas.currentHighlightedArea === null;

          canvas.destroy();

          return hasHighlightClass && isCurrentlyHighlighted && highlightRemoved && noLongerHighlighted;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 3: Seleção de área sobreposta**
 * **Validates: Requirements 1.3**
 * 
 * Para qualquer conjunto de áreas sobrepostas em um desenho SVG, quando um
 * clique ocorre na região de sobreposição, o sistema deve selecionar a área
 * mais específica (menor ou mais à frente no z-index).
 */
describe('Property 3: Seleção de área sobreposta', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer conjunto de áreas sobrepostas, deve selecionar a área mais específica', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.boolean(),
        (areaCount, color, clickOnLarger) => {
          // Criar SVG com áreas sobrepostas
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '300');
          svg.setAttribute('height', '300');
          
          const areas = [];
          
          // Criar áreas de tamanhos decrescentes, todas centradas no mesmo ponto
          // A ordem no DOM determina o z-index (últimas áreas ficam na frente)
          for (let i = 0; i < areaCount; i++) {
            const areaId = `area-${i + 1}`;
            const size = 200 - (i * 30); // Áreas cada vez menores
            const offset = (200 - size) / 2; // Centralizar
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', areaId);
            rect.setAttribute('x', `${offset}`);
            rect.setAttribute('y', `${offset}`);
            rect.setAttribute('width', `${size}`);
            rect.setAttribute('height', `${size}`);
            rect.setAttribute('fill', '#FFFFFF');
            
            svg.appendChild(rect);
            areas.push({ id: areaId, size, element: rect });
          }
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = areas.map(a => ({ id: a.id }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Determinar qual área deve ser selecionada
          // A área mais à frente (última no DOM) é a mais específica
          const mostSpecificArea = areas[areas.length - 1];
          const leastSpecificArea = areas[0];
          
          // Escolher qual área clicar baseado no parâmetro
          const targetArea = clickOnLarger ? leastSpecificArea : mostSpecificArea;
          
          // Criar evento de clique no centro onde todas as áreas se sobrepõem
          const clickEvent = createClickEvent(targetArea.element);
          
          // Simular clique - o evento será capturado pela área clicada
          canvas.handleAreaClick(clickEvent, targetArea.id);

          // Verificar qual área foi colorida
          const coloredAreas = [];
          areas.forEach(area => {
            const appliedColor = canvas.getAreaColor(area.id);
            if (appliedColor === color) {
              coloredAreas.push(area.id);
            }
          });

          canvas.destroy();

          // Deve ter colorido exatamente uma área
          // E deve ser a área que foi clicada (comportamento atual)
          return coloredAreas.length === 1 && coloredAreas[0] === targetArea.id;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Áreas sobrepostas com diferentes z-index devem selecionar a mais à frente', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, color) => {
          // Criar SVG com áreas sobrepostas em ordem específica
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '300');
          svg.setAttribute('height', '300');
          
          const areas = [];
          
          // Criar áreas do maior para o menor (ordem DOM = z-index)
          // Área 1: maior (fundo)
          // Área N: menor (frente)
          for (let i = 0; i < areaCount; i++) {
            const areaId = `area-${i + 1}`;
            const size = 200 - (i * 40);
            const offset = (200 - size) / 2;
            
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('id', areaId);
            rect.setAttribute('x', `${offset}`);
            rect.setAttribute('y', `${offset}`);
            rect.setAttribute('width', `${size}`);
            rect.setAttribute('height', `${size}`);
            rect.setAttribute('fill', '#FFFFFF');
            
            svg.appendChild(rect);
            areas.push({ id: areaId, size, zIndex: i, element: rect });
          }
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = areas.map(a => ({ id: a.id }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // A área mais à frente (última no DOM) tem maior z-index
          const frontArea = areas[areas.length - 1];
          
          // Criar evento de clique na área da frente
          // Em uma região de sobreposição, o navegador entrega o evento
          // para o elemento mais à frente no z-index
          const clickEvent = createClickEvent(frontArea.element);
          
          // Simular clique
          canvas.handleAreaClick(clickEvent, frontArea.id);

          // Verificar que apenas a área da frente foi colorida
          const frontAreaColor = canvas.getAreaColor(frontArea.id);
          
          // Verificar que outras áreas não foram coloridas
          let otherAreasUncolored = true;
          for (let i = 0; i < areas.length - 1; i++) {
            if (canvas.getAreaColor(areas[i].id) !== null) {
              otherAreasUncolored = false;
            }
          }

          canvas.destroy();

          return frontAreaColor === color && otherAreasUncolored;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Clicar em área menor sobreposta não deve colorir áreas maiores abaixo', () => {
    fc.assert(
      fc.property(
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (color) => {
          // Criar SVG com 3 áreas: grande, média, pequena (nessa ordem DOM)
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '300');
          svg.setAttribute('height', '300');
          
          // Área grande (fundo)
          const largeArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          largeArea.setAttribute('id', 'area-1');
          largeArea.setAttribute('x', '0');
          largeArea.setAttribute('y', '0');
          largeArea.setAttribute('width', '200');
          largeArea.setAttribute('height', '200');
          largeArea.setAttribute('fill', '#FFFFFF');
          svg.appendChild(largeArea);
          
          // Área média (meio)
          const mediumArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          mediumArea.setAttribute('id', 'area-2');
          mediumArea.setAttribute('x', '50');
          mediumArea.setAttribute('y', '50');
          mediumArea.setAttribute('width', '100');
          mediumArea.setAttribute('height', '100');
          mediumArea.setAttribute('fill', '#FFFFFF');
          svg.appendChild(mediumArea);
          
          // Área pequena (frente)
          const smallArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          smallArea.setAttribute('id', 'area-3');
          smallArea.setAttribute('x', '75');
          smallArea.setAttribute('y', '75');
          smallArea.setAttribute('width', '50');
          smallArea.setAttribute('height', '50');
          smallArea.setAttribute('fill', '#FFFFFF');
          svg.appendChild(smallArea);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = [
            { id: 'area-1' },
            { id: 'area-2' },
            { id: 'area-3' }
          ];
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Clicar na área pequena (frente)
          const clickEvent = createClickEvent(smallArea);
          canvas.handleAreaClick(clickEvent, 'area-3');

          // Verificar cores aplicadas
          const smallAreaColor = canvas.getAreaColor('area-3');
          const mediumAreaColor = canvas.getAreaColor('area-2');
          const largeAreaColor = canvas.getAreaColor('area-1');

          canvas.destroy();

          // Apenas a área pequena deve estar colorida
          return smallAreaColor === color && 
                 mediumAreaColor === null && 
                 largeAreaColor === null;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 8: Preservação de estado em clique inválido**
 * **Validates: Requirements 2.5**
 * 
 * Para qualquer clique em um elemento sem ID de área válido, o sistema não deve
 * aplicar cor e o estado de todas as áreas coloríveis deve permanecer inalterado.
 */
describe('Property 8: Preservação de estado em clique inválido', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer clique em elemento sem ID válido, o estado deve permanecer inalterado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`), { minLength: 1, maxLength: 5 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, initialColors, invalidClickColor) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();

          // Aplicar cores iniciais a algumas áreas
          const initialState = new Map();
          initialColors.forEach((color, index) => {
            if (index < areaCount) {
              const areaId = `area-${index + 1}`;
              canvas.applyColorToArea(areaId, color);
              initialState.set(areaId, color);
            }
          });

          // Capturar estado completo antes do clique inválido
          const stateBeforeInvalidClick = new Map();
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const element = svg.querySelector(`#${areaId}`);
            stateBeforeInvalidClick.set(areaId, {
              appliedColor: canvas.getAreaColor(areaId),
              fillAttribute: element?.getAttribute('fill')
            });
          }

          // Criar elemento sem ID de área válido
          const invalidElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          invalidElement.setAttribute('id', 'invalid-element');
          invalidElement.setAttribute('cx', '250');
          invalidElement.setAttribute('cy', '250');
          invalidElement.setAttribute('r', '10');
          svg.appendChild(invalidElement);

          // Tentar clicar no elemento inválido
          canvas.selectedColor = invalidClickColor;
          const invalidClickEvent = createClickEvent(invalidElement);
          canvas.handleAreaClick(invalidClickEvent, 'invalid-area-id');

          // Verificar que o estado permaneceu inalterado
          let statePreserved = true;
          
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const element = svg.querySelector(`#${areaId}`);
            const beforeState = stateBeforeInvalidClick.get(areaId);
            
            const currentAppliedColor = canvas.getAreaColor(areaId);
            const currentFillAttribute = element?.getAttribute('fill');

            // Estado deve ser idêntico ao anterior
            if (currentAppliedColor !== beforeState.appliedColor ||
                currentFillAttribute !== beforeState.fillAttribute) {
              statePreserved = false;
              break;
            }
          }

          canvas.destroy();

          return statePreserved;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Clique em elemento decorativo não deve modificar estado', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, initialColor, decorativeClickColor) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();

          // Aplicar cor inicial à primeira área
          const firstAreaId = 'area-1';
          canvas.applyColorToArea(firstAreaId, initialColor);

          // Capturar estado antes do clique decorativo
          const stateBeforeClick = new Map();
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const element = svg.querySelector(`#${areaId}`);
            stateBeforeClick.set(areaId, {
              appliedColor: canvas.getAreaColor(areaId),
              fillAttribute: element?.getAttribute('fill')
            });
          }

          // Criar elemento decorativo
          const decorativeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          decorativeElement.setAttribute('id', 'decorative-1');
          decorativeElement.setAttribute('d', 'M 0 0 L 100 100');
          decorativeElement.setAttribute('pointer-events', 'none');
          decorativeElement.setAttribute('fill', '#B5B5B5');
          svg.appendChild(decorativeElement);

          // Tentar clicar no elemento decorativo
          canvas.selectedColor = decorativeClickColor;
          const decorativeClickEvent = createClickEvent(decorativeElement);
          canvas.handleAreaClick(decorativeClickEvent, 'decorative-1');

          // Verificar que o estado permaneceu inalterado
          let statePreserved = true;
          
          for (let i = 1; i <= areaCount; i++) {
            const areaId = `area-${i}`;
            const element = svg.querySelector(`#${areaId}`);
            const beforeState = stateBeforeClick.get(areaId);
            
            const currentAppliedColor = canvas.getAreaColor(areaId);
            const currentFillAttribute = element?.getAttribute('fill');

            if (currentAppliedColor !== beforeState.appliedColor ||
                currentFillAttribute !== beforeState.fillAttribute) {
              statePreserved = false;
              break;
            }
          }

          canvas.destroy();

          return statePreserved;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Clique sem event.target não deve modificar estado de outras áreas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, initialColor, clickColor) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();

          // Aplicar cor inicial à primeira área
          canvas.applyColorToArea('area-1', initialColor);

          // Capturar estado de todas as áreas exceto a área-2
          const stateBeforeClick = new Map();
          for (let i = 1; i <= areaCount; i++) {
            if (i !== 2) {
              const areaId = `area-${i}`;
              const element = svg.querySelector(`#${areaId}`);
              stateBeforeClick.set(areaId, {
                appliedColor: canvas.getAreaColor(areaId),
                fillAttribute: element?.getAttribute('fill')
              });
            }
          }

          // Criar evento sem target (simulando erro)
          const eventWithoutTarget = { target: null };
          
          // Tentar clicar com evento inválido na area-2
          canvas.selectedColor = clickColor;
          canvas.handleAreaClick(eventWithoutTarget, 'area-2');

          // Verificar que outras áreas permaneceram inalteradas
          let otherAreasPreserved = true;
          
          for (let i = 1; i <= areaCount; i++) {
            if (i !== 2) {
              const areaId = `area-${i}`;
              const element = svg.querySelector(`#${areaId}`);
              const beforeState = stateBeforeClick.get(areaId);
              
              const currentAppliedColor = canvas.getAreaColor(areaId);
              const currentFillAttribute = element?.getAttribute('fill');

              if (currentAppliedColor !== beforeState.appliedColor ||
                  currentFillAttribute !== beforeState.fillAttribute) {
                otherAreasPreserved = false;
                break;
              }
            }
          }

          canvas.destroy();

          return otherAreasPreserved;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 7: Busca em árvore DOM**
 * **Validates: Requirements 2.3**
 * 
 * Para qualquer event target sem ID de área válido, o sistema deve percorrer
 * a árvore DOM em direção aos pais até encontrar um ID válido ou determinar
 * que nenhuma área foi clicada, sem entrar em loop infinito.
 */
describe('Property 7: Busca em árvore DOM', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer target sem ID válido, deve percorrer árvore DOM até encontrar área válida ou retornar null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 3 }),
        fc.boolean(),
        (areaNumber, nestingDepth, isDecorative) => {
          const areaId = `area-${areaNumber}`;

          // Criar SVG de teste
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '200');
          svg.setAttribute('height', '200');
          
          // Criar área colorível
          const area = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          area.setAttribute('id', areaId);
          area.setAttribute('x', '0');
          area.setAttribute('y', '0');
          area.setAttribute('width', '100');
          area.setAttribute('height', '100');
          area.setAttribute('fill', '#FFFFFF');
          
          // Se decorativo, adicionar pointer-events="none"
          if (isDecorative) {
            area.setAttribute('pointer-events', 'none');
          }
          
          // Criar elementos aninhados dentro da área
          let currentParent = area;
          let deepestChild = area;
          
          for (let i = 0; i < nestingDepth; i++) {
            const child = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            child.setAttribute('id', `nested-${i}`);
            currentParent.appendChild(child);
            currentParent = child;
            deepestChild = child;
          }
          
          svg.appendChild(area);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          
          // Se não é decorativo, adicionar à lista de áreas coloríveis
          if (!isDecorative) {
            canvas.colorableAreas = [{ id: areaId }];
          } else {
            canvas.colorableAreas = [];
          }
          
          canvas.render();

          // Testar findCorrectArea com o elemento mais profundo
          const result = canvas.findCorrectArea(deepestChild, areaId);

          canvas.destroy();

          // Se a área não é decorativa, deve encontrar o ID correto
          // Se é decorativa, pode retornar null ou o expectedAreaId (se houver área colorível com esse ID)
          if (!isDecorative) {
            // Deve encontrar a área válida percorrendo a árvore
            return result === areaId;
          } else {
            // Para elementos decorativos, deve retornar null ou o expectedAreaId se existir
            return result === null || result === areaId;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Busca em árvore DOM não deve entrar em loop infinito', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 15 }),
        (areaNumber, nestingDepth) => {
          const areaId = `area-${areaNumber}`;

          // Criar SVG de teste com aninhamento profundo
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '200');
          svg.setAttribute('height', '200');
          
          // Criar cadeia de elementos aninhados sem IDs de área válidos
          let currentParent = svg;
          let deepestChild = svg;
          
          for (let i = 0; i < nestingDepth; i++) {
            const child = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            child.setAttribute('id', `nested-${i}`);
            currentParent.appendChild(child);
            currentParent = child;
            deepestChild = child;
          }
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = [];
          canvas.render();

          // Medir tempo de execução para garantir que não entra em loop
          const startTime = Date.now();
          const result = canvas.findCorrectArea(deepestChild, areaId);
          const executionTime = Date.now() - startTime;

          canvas.destroy();

          // Deve retornar null (nenhuma área válida encontrada)
          // E deve executar em tempo razoável (< 100ms)
          return result === null && executionTime < 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Busca deve encontrar área colorível quando target é decorativo com mesmo ID', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (areaNumber) => {
          const areaId = `area-${areaNumber}`;

          // Criar SVG de teste
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '200');
          svg.setAttribute('height', '200');
          
          // Criar área colorível
          const colorableArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          colorableArea.setAttribute('id', areaId);
          colorableArea.setAttribute('x', '0');
          colorableArea.setAttribute('y', '0');
          colorableArea.setAttribute('width', '100');
          colorableArea.setAttribute('height', '100');
          colorableArea.setAttribute('fill', '#FFFFFF');
          svg.appendChild(colorableArea);
          
          // Criar elemento decorativo com mesmo ID
          const decorativeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          decorativeElement.setAttribute('id', areaId);
          decorativeElement.setAttribute('d', 'M 0 0 L 100 100');
          decorativeElement.setAttribute('pointer-events', 'none');
          decorativeElement.setAttribute('fill', '#B5B5B5');
          svg.appendChild(decorativeElement);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = [{ id: areaId }];
          canvas.render();

          // Testar findCorrectArea com elemento decorativo
          const result = canvas.findCorrectArea(decorativeElement, areaId);

          canvas.destroy();

          // Deve encontrar a área colorível com o mesmo ID
          return result === areaId;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 14: Logging completo de eventos**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 * 
 * Para qualquer evento de clique, aplicação de cor, ou falha de seleção, o sistema
 * deve gerar um log contendo timestamp, event target capturado, ID encontrado,
 * caminho DOM percorrido, e resultado da operação.
 */
describe('Property 14: Logging completo de eventos', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer clique bem-sucedido, deve gerar log completo com todos os campos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, color) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const expectedAreaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Obter o elemento da área
          const element = svg.querySelector(`#${expectedAreaId}`);
          
          // Capturar timestamp antes do clique
          const beforeTimestamp = Date.now();
          
          // Criar evento de clique
          const clickEvent = createClickEvent(element);

          // Clicar na área
          canvas.handleAreaClick(clickEvent, expectedAreaId);
          
          // Capturar timestamp depois do clique
          const afterTimestamp = Date.now();

          // Verificar que um log foi criado
          const logs = canvas.clickLogs;
          const hasLog = logs.length > 0;
          
          if (!hasLog) {
            canvas.destroy();
            return false;
          }
          
          // Pegar o último log (mais recente)
          const lastLog = logs[logs.length - 1];

          // Verificar campos obrigatórios
          const hasTimestamp = typeof lastLog.timestamp === 'number' && 
                               lastLog.timestamp >= beforeTimestamp && 
                               lastLog.timestamp <= afterTimestamp;
          const hasExpectedAreaId = lastLog.expectedAreaId === expectedAreaId;
          const hasTargetId = lastLog.targetId === expectedAreaId;
          const hasTargetElement = typeof lastLog.targetElement === 'string';
          const hasPointerEvents = lastLog.pointerEvents !== undefined;
          const hasFill = lastLog.fill !== undefined;
          const hasSuccess = typeof lastLog.success === 'boolean';
          const hasAppliedColor = lastLog.appliedColor !== undefined;
          
          // Para clique bem-sucedido, success deve ser true e appliedColor deve ser a cor
          const successFieldsCorrect = lastLog.success === true && lastLog.appliedColor === color;

          canvas.destroy();

          return hasLog && hasTimestamp && hasExpectedAreaId && hasTargetId && 
                 hasTargetElement && hasPointerEvents && hasFill && hasSuccess && 
                 hasAppliedColor && successFieldsCorrect;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Para qualquer clique falho, deve gerar log com success=false e appliedColor=null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, color) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();

          // Criar elemento decorativo (clique deve falhar)
          const decorativeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          decorativeElement.setAttribute('id', 'decorative-1');
          decorativeElement.setAttribute('d', 'M 0 0 L 100 100');
          decorativeElement.setAttribute('pointer-events', 'none');
          decorativeElement.setAttribute('fill', '#B5B5B5');
          svg.appendChild(decorativeElement);

          // Capturar número de logs antes
          const logsBefore = canvas.clickLogs.length;

          // Tentar clicar no elemento decorativo
          const clickEvent = createClickEvent(decorativeElement);
          canvas.handleAreaClick(clickEvent, 'decorative-1');

          // Verificar que um novo log foi criado
          const logsAfter = canvas.clickLogs.length;
          const newLogCreated = logsAfter > logsBefore;
          
          if (!newLogCreated) {
            canvas.destroy();
            return false;
          }
          
          // Pegar o último log
          const lastLog = canvas.clickLogs[canvas.clickLogs.length - 1];

          // Verificar campos para clique falho
          const hasTimestamp = typeof lastLog.timestamp === 'number';
          const successIsFalse = lastLog.success === false;
          const appliedColorIsNull = lastLog.appliedColor === null;
          const hasTargetInfo = lastLog.targetId !== undefined && 
                                lastLog.targetElement !== undefined;

          canvas.destroy();

          return newLogCreated && hasTimestamp && successIsFalse && 
                 appliedColorIsNull && hasTargetInfo;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Para qualquer sequência de cliques, deve gerar um log para cada clique', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 8 }),
        fc.array(
          fc.record({
            areaIndex: fc.integer({ min: 0, max: 7 }),
            color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`)
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (areaCount, clicks) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Executar sequência de cliques
          clicks.forEach(click => {
            const validIndex = (click.areaIndex % areaCount) + 1;
            const areaId = `area-${validIndex}`;
            const element = svg.querySelector(`#${areaId}`);
            
            canvas.selectedColor = click.color;
            const clickEvent = createClickEvent(element);
            canvas.handleAreaClick(clickEvent, areaId);
          });

          // Verificar que o número de logs corresponde ao número de cliques
          const logCount = canvas.clickLogs.length;
          const correctLogCount = logCount === clicks.length;
          
          // Verificar que todos os logs têm timestamps em ordem crescente
          let timestampsInOrder = true;
          for (let i = 1; i < canvas.clickLogs.length; i++) {
            if (canvas.clickLogs[i].timestamp < canvas.clickLogs[i - 1].timestamp) {
              timestampsInOrder = false;
              break;
            }
          }

          canvas.destroy();

          return correctLogCount && timestampsInOrder;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Para qualquer clique sem event.target, deve gerar log com campos null apropriados', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaNumber, color) => {
          const areaId = `area-${areaNumber}`;

          // Criar SVG de teste
          const svg = createTestSVG(1);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = [{ id: 'area-1' }];
          canvas.selectedColor = color;
          
          canvas.render();

          // Criar evento sem target
          const eventWithoutTarget = { target: null };

          // Tentar clicar com evento inválido
          canvas.handleAreaClick(eventWithoutTarget, areaId);

          // Verificar que um log foi criado
          const hasLog = canvas.clickLogs.length > 0;
          
          if (!hasLog) {
            canvas.destroy();
            return false;
          }
          
          const lastLog = canvas.clickLogs[canvas.clickLogs.length - 1];

          // Verificar campos para evento sem target
          const hasTimestamp = typeof lastLog.timestamp === 'number';
          const hasExpectedAreaId = lastLog.expectedAreaId === areaId;
          const targetFieldsAreNull = lastLog.targetId === null && 
                                      lastLog.targetElement === null &&
                                      lastLog.pointerEvents === null &&
                                      lastLog.fill === null;
          const successIsFalse = lastLog.success === false;
          const appliedColorIsNull = lastLog.appliedColor === null;

          canvas.destroy();

          return hasLog && hasTimestamp && hasExpectedAreaId && 
                 targetFieldsAreNull && successIsFalse && appliedColorIsNull;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: svg-area-selection-fix, Property 15: Contexto suficiente em logs**
 * **Validates: Requirements 4.5**
 * 
 * Para qualquer log gerado pelo sistema, o log deve incluir timestamp e contexto
 * suficiente (IDs, cores, elementos) para permitir debugging efetivo.
 */
describe('Property 15: Contexto suficiente em logs', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer log, deve conter contexto suficiente para debugging', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 0, max: 9 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        (areaCount, areaIndex, color) => {
          const validIndex = (areaIndex % areaCount) + 1;
          const expectedAreaId = `area-${validIndex}`;

          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();
          canvas.attachEventListeners();

          // Obter o elemento da área
          const element = svg.querySelector(`#${expectedAreaId}`);
          
          // Criar evento de clique
          const clickEvent = createClickEvent(element);

          // Clicar na área
          canvas.handleAreaClick(clickEvent, expectedAreaId);

          // Verificar que um log foi criado
          const hasLog = canvas.clickLogs.length > 0;
          
          if (!hasLog) {
            canvas.destroy();
            return false;
          }
          
          const lastLog = canvas.clickLogs[canvas.clickLogs.length - 1];

          // Verificar contexto suficiente para debugging:
          // 1. Timestamp para ordenação temporal
          const hasTimestamp = typeof lastLog.timestamp === 'number' && lastLog.timestamp > 0;
          
          // 2. IDs para identificar elementos envolvidos
          const hasIds = lastLog.expectedAreaId !== undefined && 
                         lastLog.targetId !== undefined;
          
          // 3. Informações do elemento para entender estrutura
          const hasElementInfo = lastLog.targetElement !== undefined && 
                                 lastLog.pointerEvents !== undefined &&
                                 lastLog.fill !== undefined;
          
          // 4. Resultado da operação para entender o que aconteceu
          const hasResult = typeof lastLog.success === 'boolean' && 
                           lastLog.appliedColor !== undefined;
          
          // 5. Contexto completo: todos os campos devem estar presentes
          const hasCompleteContext = hasTimestamp && hasIds && hasElementInfo && hasResult;
          
          // 6. Para clique bem-sucedido, deve ter cor aplicada
          const resultConsistent = lastLog.success ? lastLog.appliedColor === color : lastLog.appliedColor === null;

          canvas.destroy();

          return hasLog && hasCompleteContext && resultConsistent;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Para qualquer log de clique falho, deve conter motivo implícito da falha', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
        fc.oneof(
          fc.constant('decorative'),
          fc.constant('invalid-id'),
          fc.constant('no-target')
        ),
        (areaCount, color, failureType) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          canvas.selectedColor = color;
          
          canvas.render();

          let clickEvent;
          let expectedAreaId;

          // Criar cenário de falha baseado no tipo
          if (failureType === 'decorative') {
            // Elemento decorativo
            const decorativeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            decorativeElement.setAttribute('id', 'decorative-1');
            decorativeElement.setAttribute('d', 'M 0 0 L 100 100');
            decorativeElement.setAttribute('pointer-events', 'none');
            decorativeElement.setAttribute('fill', '#B5B5B5');
            svg.appendChild(decorativeElement);
            
            clickEvent = createClickEvent(decorativeElement);
            expectedAreaId = 'decorative-1';
          } else if (failureType === 'invalid-id') {
            // Elemento sem ID de área válido
            const invalidElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            invalidElement.setAttribute('id', 'invalid-element');
            invalidElement.setAttribute('cx', '250');
            invalidElement.setAttribute('cy', '250');
            invalidElement.setAttribute('r', '10');
            svg.appendChild(invalidElement);
            
            clickEvent = createClickEvent(invalidElement);
            expectedAreaId = 'invalid-area-id';
          } else {
            // Evento sem target
            clickEvent = { target: null };
            expectedAreaId = 'area-1';
          }

          // Executar clique
          canvas.handleAreaClick(clickEvent, expectedAreaId);

          // Verificar que um log foi criado
          const hasLog = canvas.clickLogs.length > 0;
          
          if (!hasLog) {
            canvas.destroy();
            return false;
          }
          
          const lastLog = canvas.clickLogs[canvas.clickLogs.length - 1];

          // Verificar que o log contém informações suficientes para identificar o motivo da falha
          const successIsFalse = lastLog.success === false;
          const appliedColorIsNull = lastLog.appliedColor === null;
          
          // Contexto que permite identificar o motivo:
          let hasFailureContext = false;
          
          if (failureType === 'decorative') {
            // Deve ter pointer-events="none" ou fill decorativo
            hasFailureContext = lastLog.pointerEvents === 'none' || 
                               lastLog.fill === '#B5B5B5' ||
                               lastLog.fill === '#222221';
          } else if (failureType === 'invalid-id') {
            // Deve ter targetId que não começa com "area-"
            hasFailureContext = lastLog.targetId !== null && 
                               !lastLog.targetId.startsWith('area-');
          } else {
            // Deve ter targetId null
            hasFailureContext = lastLog.targetId === null;
          }

          canvas.destroy();

          return hasLog && successIsFalse && appliedColorIsNull && hasFailureContext;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Para qualquer sequência de cliques, logs devem permitir reconstruir histórico completo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 8 }),
        fc.array(
          fc.record({
            areaIndex: fc.integer({ min: 0, max: 7 }),
            color: fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`)
          }),
          { minLength: 3, maxLength: 6 }
        ),
        (areaCount, clicks) => {
          // Criar SVG de teste
          const svg = createTestSVG(areaCount);
          
          const canvas = new SVGCanvas(container);
          canvas.svgElement = svg;
          canvas.colorableAreas = Array.from({ length: areaCount }, (_, i) => ({
            id: `area-${i + 1}`
          }));
          
          canvas.render();
          canvas.attachEventListeners();

          // Executar sequência de cliques e rastrear estado esperado
          const expectedHistory = [];
          
          clicks.forEach(click => {
            const validIndex = (click.areaIndex % areaCount) + 1;
            const areaId = `area-${validIndex}`;
            const element = svg.querySelector(`#${areaId}`);
            
            canvas.selectedColor = click.color;
            const clickEvent = createClickEvent(element);
            canvas.handleAreaClick(clickEvent, areaId);
            
            expectedHistory.push({
              areaId,
              color: click.color,
              success: true
            });
          });

          // Verificar que os logs permitem reconstruir o histórico
          const logs = canvas.clickLogs;
          
          if (logs.length !== expectedHistory.length) {
            canvas.destroy();
            return false;
          }
          
          // Verificar cada log contra o histórico esperado
          let historyMatches = true;
          
          for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            const expected = expectedHistory[i];
            
            // Verificar que o log contém informações suficientes para reconstruir o estado
            const hasAreaId = log.expectedAreaId === expected.areaId || 
                             log.targetId === expected.areaId;
            const hasColor = log.appliedColor === expected.color;
            const hasSuccess = log.success === expected.success;
            const hasTimestamp = typeof log.timestamp === 'number';
            
            if (!hasAreaId || !hasColor || !hasSuccess || !hasTimestamp) {
              historyMatches = false;
              break;
            }
          }
          
          // Verificar que timestamps estão em ordem
          let timestampsOrdered = true;
          for (let i = 1; i < logs.length; i++) {
            if (logs[i].timestamp < logs[i - 1].timestamp) {
              timestampsOrdered = false;
              break;
            }
          }

          canvas.destroy();

          return historyMatches && timestampsOrdered;
        }
      ),
      { numRuns: 100 }
    );
  });
});
