import { jest } from '@jest/globals';
import * as fc from 'fast-check';
import { ColorPalette } from '../ColorPalette.js';

/**
 * **Feature: site-colorir, Property 10: Marcação visual de cor selecionada**
 * **Valida: Requisitos 3.2**
 * 
 * Para qualquer cor na paleta, quando o usuário clica naquela cor,
 * ela deve receber marcação visual indicando que está selecionada.
 */
describe('Propriedade 10: Marcação visual de cor selecionada', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer cor na paleta, ao clicar nela deve receber marcação visual', () => {
    fc.assert(
      fc.property(
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }), { minLength: 12, maxLength: 20 })
          .map(arr => arr.map(hex => `#${hex}`)),
        fc.integer({ min: 0, max: 19 }),
        (colors, colorIndex) => {
          // Garantir que temos cores únicas
          const uniqueColors = [...new Set(colors)];
          if (uniqueColors.length < 12) return true;

          const validIndex = colorIndex % uniqueColors.length;
          const colorToSelect = uniqueColors[validIndex];

          // Criar paleta
          const palette = new ColorPalette(container, { colors: uniqueColors });

          // Selecionar a cor
          palette.selectColor(colorToSelect);

          // Verificar marcação visual
          const selectedButton = container.querySelector(`.color-button[data-color="${colorToSelect}"]`);
          
          // Deve ter a classe 'selected'
          const hasSelectedClass = selectedButton?.classList.contains('selected');
          
          // Deve ter aria-checked="true"
          const hasAriaChecked = selectedButton?.getAttribute('aria-checked') === 'true';
          
          // Deve ter tabindex="0"
          const hasTabindex = selectedButton?.getAttribute('tabindex') === '0';

          palette.destroy();

          return hasSelectedClass && hasAriaChecked && hasTabindex;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: site-colorir, Property 12: Exclusividade de seleção de cor**
 * **Valida: Requisitos 3.4**
 * 
 * Para qualquer sequência de seleções de cor, apenas uma cor deve estar
 * marcada como selecionada em qualquer momento dado.
 */
describe('Propriedade 12: Exclusividade de seleção de cor', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('Para qualquer sequência de seleções, apenas uma cor deve estar selecionada', () => {
    fc.assert(
      fc.property(
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }), { minLength: 12, maxLength: 20 })
          .map(arr => arr.map(hex => `#${hex}`)),
        fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 1, maxLength: 10 }),
        (colors, selectionIndices) => {
          // Garantir que temos cores únicas
          const uniqueColors = [...new Set(colors)];
          if (uniqueColors.length < 12) return true;

          // Criar paleta
          const palette = new ColorPalette(container, { colors: uniqueColors });

          // Realizar sequência de seleções
          selectionIndices.forEach(index => {
            const validIndex = index % uniqueColors.length;
            const colorToSelect = uniqueColors[validIndex];
            palette.selectColor(colorToSelect);
          });

          // Verificar que apenas uma cor está selecionada
          const selectedButtons = container.querySelectorAll('.color-button.selected');
          const hasOnlyOneSelected = selectedButtons.length === 1;

          // Verificar que apenas um botão tem aria-checked="true"
          const ariaCheckedButtons = container.querySelectorAll('.color-button[aria-checked="true"]');
          const hasOnlyOneAriaChecked = ariaCheckedButtons.length === 1;

          // Verificar que apenas um botão tem tabindex="0"
          const focusableButtons = container.querySelectorAll('.color-button[tabindex="0"]');
          const hasOnlyOneFocusable = focusableButtons.length === 1;

          palette.destroy();

          return hasOnlyOneSelected && hasOnlyOneAriaChecked && hasOnlyOneFocusable;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Após múltiplas seleções, a última cor selecionada deve ser a única marcada', () => {
    fc.assert(
      fc.property(
        fc.array(fc.hexaString({ minLength: 6, maxLength: 6 }), { minLength: 12, maxLength: 20 })
          .map(arr => arr.map(hex => `#${hex}`)),
        fc.array(fc.integer({ min: 0, max: 19 }), { minLength: 2, maxLength: 10 }),
        (colors, selectionIndices) => {
          // Garantir que temos cores únicas
          const uniqueColors = [...new Set(colors)];
          if (uniqueColors.length < 12) return true;

          // Criar paleta
          const palette = new ColorPalette(container, { colors: uniqueColors });

          // Realizar sequência de seleções
          let lastSelectedColor;
          selectionIndices.forEach(index => {
            const validIndex = index % uniqueColors.length;
            lastSelectedColor = uniqueColors[validIndex];
            palette.selectColor(lastSelectedColor);
          });

          // Verificar que a última cor selecionada é a que está marcada
          const selectedButton = container.querySelector('.color-button.selected');
          const selectedColor = selectedButton?.getAttribute('data-color');

          // Verificar que getSelectedColor retorna a última cor
          const returnedColor = palette.getSelectedColor();

          palette.destroy();

          return selectedColor === lastSelectedColor && returnedColor === lastSelectedColor;
        }
      ),
      { numRuns: 100 }
    );
  });
});
