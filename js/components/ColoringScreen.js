import { ColorPalette } from './ColorPalette.js';
import { SVGCanvas } from './SVGCanvas.js';

/**
 * Componente Tela de Colorir que integra Canvas SVG e Paleta de Cores
 */
export class ColoringScreen {
  /**
   * @param {HTMLElement} container - Container onde a tela será renderizada
   * @param {Object} options - Opções de configuração
   * @param {Object} options.drawing - Objeto Drawing com informações do desenho
   * @param {Function} options.onBack - Callback quando o botão voltar é clicado
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container é obrigatório');
    }

    if (!options.drawing) {
      throw new Error('Drawing é obrigatório');
    }

    this.container = container;
    this.drawing = options.drawing;
    this.onBack = options.onBack || (() => {});

    // Estado
    this.selectedColor = null;
    this.colorPalette = null;
    this.svgCanvas = null;

    this.render();
  }

  /**
   * Renderiza a tela de colorir
   */
  render() {
    // Limpar container
    this.container.innerHTML = '';

    // Criar estrutura da tela
    const screen = document.createElement('div');
    screen.className = 'coloring-screen';
    screen.setAttribute('role', 'main');
    screen.setAttribute('aria-label', 'Tela de colorir');

    // Header com título e botão voltar
    const header = this.createHeader();
    screen.appendChild(header);

    // Container principal com canvas e paleta
    const mainContent = document.createElement('div');
    mainContent.className = 'coloring-main';

    // Canvas SVG
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    mainContent.appendChild(canvasContainer);

    // Paleta de cores
    const paletteContainer = document.createElement('div');
    paletteContainer.className = 'palette-container';
    mainContent.appendChild(paletteContainer);

    screen.appendChild(mainContent);

    // Footer com botão limpar
    const footer = this.createFooter();
    screen.appendChild(footer);

    this.container.appendChild(screen);

    // Adicionar listener global para Escape
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.onBack();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Inicializar componentes
    this.initializeComponents(canvasContainer, paletteContainer);
  }

  /**
   * Cria o header com título e botão voltar
   * @returns {HTMLElement}
   */
  createHeader() {
    const header = document.createElement('header');
    header.className = 'coloring-header';
    header.setAttribute('role', 'banner');

    // Botão voltar
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '← Voltar';
    backButton.setAttribute('type', 'button');
    backButton.setAttribute('aria-label', 'Voltar para galeria');
    
    // Garantir tamanho mínimo de 44x44px
    backButton.style.minWidth = '44px';
    backButton.style.minHeight = '44px';

    backButton.addEventListener('click', () => {
      this.onBack();
    });

    // Touch event para dispositivos móveis
    backButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onBack();
    });

    // Keyboard event - Escape também volta
    backButton.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.onBack();
      }
    });

    // Título do desenho
    const title = document.createElement('h1');
    title.className = 'drawing-title';
    title.textContent = this.drawing.name || 'Desenho para Colorir';

    header.appendChild(backButton);
    header.appendChild(title);

    return header;
  }

  /**
   * Cria o footer com botão limpar
   * @returns {HTMLElement}
   */
  createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'coloring-footer';

    // Botão limpar
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-button';
    clearButton.textContent = '🗑️ Limpar';
    clearButton.setAttribute('type', 'button');
    clearButton.setAttribute('aria-label', 'Limpar todas as cores');
    
    // Garantir tamanho mínimo de 44x44px
    clearButton.style.minWidth = '44px';
    clearButton.style.minHeight = '44px';

    clearButton.addEventListener('click', () => {
      this.clearDrawing();
    });

    // Touch event para dispositivos móveis
    clearButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.clearDrawing();
    });

    footer.appendChild(clearButton);

    return footer;
  }

  /**
   * Inicializa os componentes (paleta e canvas)
   * @param {HTMLElement} canvasContainer - Container do canvas
   * @param {HTMLElement} paletteContainer - Container da paleta
   */
  async initializeComponents(canvasContainer, paletteContainer) {
    // Criar paleta de cores
    this.colorPalette = new ColorPalette(paletteContainer, {
      onColorSelect: (color) => {
        this.handleColorSelect(color);
      }
    });

    // Definir cor inicial
    this.selectedColor = this.colorPalette.getSelectedColor();

    // Criar canvas SVG
    this.svgCanvas = new SVGCanvas(canvasContainer, {
      svgUrl: this.drawing.svgUrl,
      selectedColor: this.selectedColor,
      onAreaClick: (areaId, color) => {
        this.handleAreaClick(areaId, color);
      }
    });

    // Carregar SVG
    try {
      await this.svgCanvas.loadSVG(this.drawing.svgUrl);
    } catch (error) {
      console.error('Erro ao carregar desenho:', error);
      this.showError('Não foi possível carregar o desenho.');
    }
  }

  /**
   * Manipula seleção de cor na paleta
   * @param {string} color - Cor selecionada
   */
  handleColorSelect(color) {
    console.log('[ColoringScreen] Cor selecionada:', color, 'tipo:', typeof color);
    this.selectedColor = color;
    
    // Atualizar cor no canvas
    if (this.svgCanvas) {
      this.svgCanvas.setSelectedColor(color);
    }
  }

  /**
   * Manipula clique em área do desenho
   * @param {string} areaId - ID da área clicada
   * @param {string} color - Cor aplicada
   */
  handleAreaClick(areaId, color) {
    // Callback para extensões futuras
    console.log(`Área ${areaId} colorida com ${color}`);
  }

  /**
   * Limpa todas as cores do desenho
   */
  clearDrawing() {
    if (this.svgCanvas) {
      this.svgCanvas.clearAllColors();
    }
    
    // A cor selecionada deve permanecer a mesma (Propriedade 22)
    // Não fazemos nada com this.selectedColor ou this.colorPalette
  }

  /**
   * Manipula salvamento do desenho
   * @private
   */
  handleSave() {
    try {
      // Verificar se há áreas coloridas
      if (this.coloredAreas.size === 0) {
        this.showNotification('Colora algumas áreas antes de salvar!', 'warning');
        return;
      }

      // Obter SVG atual
      const svgContent = this.svgCanvas ? this.svgCanvas.getSVGContent() : null;
      if (!svgContent) {
        this.showNotification('Erro ao obter conteúdo do desenho', 'error');
        return;
      }

      // Preparar dados para salvamento
      const drawingData = {
        drawingId: this.drawing.id,
        drawingName: this.drawing.name,
        coloredAreas: Object.fromEntries(this.coloredAreas),
        svgContent: svgContent
      };

      // Abrir modal de salvamento
      this.saveLoadModal.openSaveMode(drawingData, (result) => {
        if (result.success) {
          this.showNotification(result.message, 'success');
        }
      });
    } catch (error) {
      console.error('Erro ao salvar desenho:', error);
      errorLogger.log(error, { context: 'coloring-screen-save' });
      this.showNotification('Erro inesperado ao salvar', 'error');
    }
  }

  /**
   * Manipula carregamento de desenho salvo
   * @private
   */
  handleLoad() {
    try {
      // Abrir modal de carregamento
      this.saveLoadModal.openLoadMode(this.drawing.id, (savedData) => {
        this.loadSavedDrawing(savedData);
      });
    } catch (error) {
      console.error('Erro ao carregar desenho:', error);
      errorLogger.log(error, { context: 'coloring-screen-load' });
      this.showNotification('Erro inesperado ao carregar', 'error');
    }
  }

  /**
   * Carrega um desenho salvo
   * @param {Object} savedData - Dados do desenho salvo
   * @private
   */
  loadSavedDrawing(savedData) {
    try {
      // Limpar desenho atual
      if (this.svgCanvas) {
        this.svgCanvas.clearAllColors();
      }

      // Aplicar cores salvas
      if (savedData.coloredAreas) {
        Object.entries(savedData.coloredAreas).forEach(([areaId, color]) => {
          if (this.svgCanvas) {
            this.svgCanvas.colorArea(areaId, color);
          }
          this.coloredAreas.set(areaId, color);
        });
      }

      this.showNotification('Desenho carregado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao aplicar desenho salvo:', error);
      errorLogger.log(error, { context: 'coloring-screen-load-apply' });
      this.showNotification('Erro ao aplicar desenho salvo', 'error');
    }
  }

  /**
   * Exibe notificação
   * @param {string} message - Mensagem
   * @param {string} type - Tipo (success, error, warning)
   * @private
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    this.container.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Exibe mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    
    this.container.appendChild(errorDiv);
  }

  /**
   * Retorna a cor atualmente selecionada
   * @returns {string} Cor hexadecimal
   */
  getSelectedColor() {
    return this.selectedColor;
  }

  /**
   * Retorna o desenho atual
   * @returns {Object} Objeto Drawing
   */
  getDrawing() {
    return this.drawing;
  }

  /**
   * Verifica se a tela contém desenho e paleta renderizados
   * @returns {boolean}
   */
  hasDrawingAndPalette() {
    const hasCanvas = this.svgCanvas !== null && this.svgCanvas.svgElement !== null;
    const hasPalette = this.colorPalette !== null;
    return hasCanvas && hasPalette;
  }

  /**
   * Destrói o componente e limpa recursos
   */
  destroy() {
    // Remover listener de Escape
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    if (this.colorPalette) {
      this.colorPalette.destroy();
    }
    
    if (this.svgCanvas) {
      this.svgCanvas.destroy();
    }

    if (this.saveLoadModal) {
      this.saveLoadModal.destroy();
    }
    
    this.container.innerHTML = '';
  }
}

export default ColoringScreen;
