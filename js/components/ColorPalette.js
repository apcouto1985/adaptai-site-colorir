/**
 * Componente de paleta de cores para seleção de cores
 */
export class ColorPalette {
  /**
   * @param {HTMLElement} container - Container onde a paleta será renderizada
   * @param {Object} options - Opções de configuração
   * @param {Array<string>} options.colors - Array de cores hexadecimais (mínimo 12)
   * @param {string} options.defaultColor - Cor selecionada por padrão
   * @param {Function} options.onColorSelect - Callback quando uma cor é selecionada
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container é obrigatório');
    }

    this.container = container;
    this.colors = options.colors || this.getDefaultColors();
    this.selectedColor = options.defaultColor || this.colors[0];
    this.onColorSelect = options.onColorSelect || (() => {});

    // Validar que temos pelo menos 12 cores
    if (this.colors.length < 12) {
      throw new Error('A paleta deve ter no mínimo 12 cores');
    }

    this.render();
  }

  /**
   * Retorna o conjunto padrão de cores
   * @returns {Array<string>} Array de cores hexadecimais
   */
  getDefaultColors() {
    return [
      '#FF0000', // Vermelho
      '#FF7F00', // Laranja
      '#FFFF00', // Amarelo
      '#00FF00', // Verde
      '#0000FF', // Azul
      '#4B0082', // Índigo
      '#9400D3', // Violeta
      '#FF1493', // Rosa
      '#8B4513', // Marrom
      '#000000', // Preto
      '#808080', // Cinza
      '#FFFFFF', // Branco
      '#FFB6C1', // Rosa claro
      '#87CEEB', // Azul céu
      '#90EE90', // Verde claro
      '#FFD700', // Dourado
    ];
  }

  /**
   * Renderiza a paleta de cores
   */
  render() {
    // Limpar container
    this.container.innerHTML = '';

    // Criar elemento da paleta
    const paletteElement = document.createElement('div');
    paletteElement.className = 'color-palette';
    paletteElement.setAttribute('role', 'radiogroup');
    paletteElement.setAttribute('aria-label', 'Paleta de cores');

    // Criar grid de cores
    this.colors.forEach((color, index) => {
      const colorButton = this.createColorButton(color, index);
      paletteElement.appendChild(colorButton);
    });

    this.container.appendChild(paletteElement);
  }

  /**
   * Cria um botão de cor
   * @param {string} color - Cor hexadecimal
   * @param {number} index - Índice da cor
   * @returns {HTMLElement} Elemento do botão
   */
  createColorButton(color, index) {
    const button = document.createElement('button');
    button.className = 'color-button';
    button.style.backgroundColor = color;
    button.setAttribute('type', 'button');
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-label', `Cor ${color}`);
    button.setAttribute('data-color', color);
    button.setAttribute('tabindex', color === this.selectedColor ? '0' : '-1');

    // Garantir tamanho mínimo de 44x44px (requisito de acessibilidade)
    button.style.minWidth = '44px';
    button.style.minHeight = '44px';

    // Marcar como selecionado se for a cor atual
    if (color === this.selectedColor) {
      button.classList.add('selected');
      button.setAttribute('aria-checked', 'true');
    } else {
      button.setAttribute('aria-checked', 'false');
    }

    // Event listener para clique
    button.addEventListener('click', () => {
      this.selectColor(color);
    });

    // Event listeners para touch (equivalente a click)
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.selectColor(color);
    });

    // Event listener para teclado
    button.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e, index);
    });

    return button;
  }

  /**
   * Seleciona uma cor
   * @param {string} color - Cor hexadecimal a ser selecionada
   */
  selectColor(color) {
    if (!this.colors.includes(color)) {
      console.warn('Cor não encontrada na paleta:', color);
      return;
    }

    // Atualizar cor selecionada
    const previousColor = this.selectedColor;
    this.selectedColor = color;

    // Atualizar marcação visual
    this.updateSelectedButton(previousColor, color);

    // Chamar callback
    this.onColorSelect(color);
  }

  /**
   * Atualiza a marcação visual do botão selecionado
   * @param {string} previousColor - Cor anteriormente selecionada
   * @param {string} newColor - Nova cor selecionada
   */
  updateSelectedButton(previousColor, newColor) {
    const buttons = this.container.querySelectorAll('.color-button');

    buttons.forEach(button => {
      const buttonColor = button.getAttribute('data-color');

      if (buttonColor === previousColor) {
        button.classList.remove('selected');
        button.setAttribute('aria-checked', 'false');
        button.setAttribute('tabindex', '-1');
      }

      if (buttonColor === newColor) {
        button.classList.add('selected');
        button.setAttribute('aria-checked', 'true');
        button.setAttribute('tabindex', '0');
        button.focus();
      }
    });
  }

  /**
   * Manipula navegação por teclado
   * @param {KeyboardEvent} event - Evento de teclado
   * @param {number} currentIndex - Índice atual
   */
  handleKeyboardNavigation(event, currentIndex) {
    const { key } = event;
    let newIndex = currentIndex;

    // Calcular número de colunas (assumindo grid responsivo)
    const buttons = this.container.querySelectorAll('.color-button');
    const containerWidth = this.container.offsetWidth;
    const buttonWidth = buttons[0]?.offsetWidth || 44;
    const columns = Math.floor(containerWidth / buttonWidth) || 4;

    switch (key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % this.colors.length;
        event.preventDefault();
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + this.colors.length) % this.colors.length;
        event.preventDefault();
        break;
      case 'ArrowDown':
        newIndex = (currentIndex + columns) % this.colors.length;
        event.preventDefault();
        break;
      case 'ArrowUp':
        newIndex = (currentIndex - columns + this.colors.length) % this.colors.length;
        event.preventDefault();
        break;
      case 'Enter':
      case ' ':
        this.selectColor(this.colors[currentIndex]);
        event.preventDefault();
        break;
      default:
        return;
    }

    // Focar no novo botão
    if (newIndex !== currentIndex) {
      buttons[newIndex]?.focus();
    }
  }

  /**
   * Retorna a cor atualmente selecionada
   * @returns {string} Cor hexadecimal selecionada
   */
  getSelectedColor() {
    return this.selectedColor;
  }

  /**
   * Define a cor selecionada programaticamente
   * @param {string} color - Cor hexadecimal
   */
  setSelectedColor(color) {
    this.selectColor(color);
  }

  /**
   * Destrói o componente e remove event listeners
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

export default ColorPalette;
