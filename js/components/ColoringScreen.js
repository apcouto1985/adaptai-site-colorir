import { ColorPalette } from './ColorPalette.js';
import { SVGCanvas } from './SVGCanvas.js';
import saveLoadService from '../services/SaveLoadService.js';
import { errorLogger } from '../utils/errorHandling.js';

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
    this.appState = options.applicationState || null;

    // Estado
    this.selectedColor = null;
    this.colorPalette = null;
    this.svgCanvas = null;
    this.coloredAreas = new Map();
    this.loadListContainer = null;

    this.render();
  }

  /**
   * Renderiza a tela de colorir
   */
  render() {
    this.container.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'coloring-screen';
    screen.setAttribute('role', 'main');
    screen.setAttribute('aria-label', 'Tela de colorir');

    const header = this.createHeader();
    screen.appendChild(header);

    const mainContent = document.createElement('div');
    mainContent.className = 'coloring-main';

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    mainContent.appendChild(canvasContainer);

    const paletteContainer = document.createElement('div');
    paletteContainer.className = 'palette-container';
    mainContent.appendChild(paletteContainer);

    screen.appendChild(mainContent);

    const footer = this.createFooter();
    screen.appendChild(footer);

    this.container.appendChild(screen);

    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        if (this.loadListContainer) {
          this.closeLoadList();
        } else {
          this.onBack();
        }
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

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

    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '← Voltar';
    backButton.setAttribute('type', 'button');
    backButton.setAttribute('aria-label', 'Voltar para galeria');
    backButton.style.minWidth = '44px';
    backButton.style.minHeight = '44px';

    backButton.addEventListener('click', () => this.onBack());
    backButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.onBack();
    });

    const title = document.createElement('h1');
    title.className = 'drawing-title';
    title.textContent = this.drawing.name || 'Desenho para Colorir';

    header.appendChild(backButton);
    header.appendChild(title);

    return header;
  }

  /**
   * Cria o footer com botões de ação
   * @returns {HTMLElement}
   */
  createFooter() {
    const footer = document.createElement('footer');
    footer.className = 'coloring-footer';

    // Botão salvar
    const saveButton = document.createElement('button');
    saveButton.className = 'save-button';
    saveButton.innerHTML = '<span class="save-icon">💾</span> <span class="save-text">Salvar</span>';
    saveButton.setAttribute('type', 'button');
    saveButton.setAttribute('aria-label', 'Salvar desenho colorido');
    saveButton.style.minWidth = '44px';
    saveButton.style.minHeight = '44px';
    saveButton.addEventListener('click', () => this.handleSave());
    saveButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleSave();
    });

    // Botão carregar
    const loadButton = document.createElement('button');
    loadButton.className = 'load-button';
    loadButton.innerHTML = '<span class="load-icon">📂</span> <span class="load-text">Carregar</span>';
    loadButton.setAttribute('type', 'button');
    loadButton.setAttribute('aria-label', 'Carregar desenho salvo');
    loadButton.style.minWidth = '44px';
    loadButton.style.minHeight = '44px';
    loadButton.addEventListener('click', () => this.handleLoad());
    loadButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleLoad();
    });

    // Botão limpar
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-button';
    clearButton.innerHTML = '<span class="clear-icon">🗑️</span> <span class="clear-text">Limpar</span>';
    clearButton.setAttribute('type', 'button');
    clearButton.setAttribute('aria-label', 'Limpar todas as cores');
    clearButton.style.minWidth = '44px';
    clearButton.style.minHeight = '44px';
    clearButton.addEventListener('click', () => this.clearDrawing());
    clearButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.clearDrawing();
    });

    footer.appendChild(saveButton);
    footer.appendChild(loadButton);
    footer.appendChild(clearButton);

    return footer;
  }

  /**
   * Inicializa os componentes (paleta e canvas)
   * @param {HTMLElement} canvasContainer - Container do canvas
   * @param {HTMLElement} paletteContainer - Container da paleta
   */
  async initializeComponents(canvasContainer, paletteContainer) {
    this.colorPalette = new ColorPalette(paletteContainer, {
      onColorSelect: (color) => this.handleColorSelect(color)
    });

    this.selectedColor = this.colorPalette.getSelectedColor();

    this.svgCanvas = new SVGCanvas(canvasContainer, {
      svgUrl: this.drawing.svgUrl,
      selectedColor: this.selectedColor,
      onAreaClick: (areaId, color) => this.handleAreaClick(areaId, color)
    });

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
    this.selectedColor = color;
    if (this.svgCanvas) {
      this.svgCanvas.setSelectedColor(color);
    }
    if (this.appState) {
      this.appState.setSelectedColor(color);
    }
  }

  /**
   * Manipula clique em área do desenho
   * @param {string} areaId - ID da área clicada
   * @param {string} color - Cor aplicada
   */
  handleAreaClick(areaId, color) {
    this.coloredAreas.set(areaId, color);
    if (this.appState) {
      this.appState.setAreaColor(areaId, color);
    }
  }

  /**
   * Limpa todas as cores do desenho
   */
  clearDrawing() {
    if (this.svgCanvas) {
      this.svgCanvas.clearAllColors();
    }
    this.coloredAreas.clear();
    if (this.appState) {
      this.appState.clearAllColors();
    }
    // A cor selecionada deve permanecer a mesma (Propriedade 22)
  }

  /**
   * Salva o desenho colorido no localStorage
   * @private
   */
  handleSave() {
    try {
      if (this.coloredAreas.size === 0) {
        this.showNotification('Colora algumas áreas antes de salvar!', 'warning');
        return;
      }

      const svgContent = this.svgCanvas ? this.svgCanvas.getSVGContent() : null;
      if (!svgContent) {
        this.showNotification('Erro ao obter conteúdo do desenho', 'error');
        return;
      }

      const drawingData = {
        drawingId: this.drawing.id,
        drawingName: this.drawing.name,
        coloredAreas: Object.fromEntries(this.coloredAreas),
        svgContent: svgContent
      };

      const result = saveLoadService.saveDrawing(drawingData);
      this.showNotification(result.message, result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Erro ao salvar desenho:', error);
      errorLogger.log(error, { context: 'coloring-screen-save' });
      this.showNotification('Erro inesperado ao salvar', 'error');
    }
  }

  /**
   * Mostra lista de desenhos salvos para carregar
   * @private
   */
  handleLoad() {
    try {
      // Fechar se já está aberta
      if (this.loadListContainer) {
        this.closeLoadList();
        return;
      }

      const savedList = saveLoadService.getSavedDrawingsList(this.drawing.id);

      if (savedList.length === 0) {
        this.showNotification('Nenhum desenho salvo para este modelo.', 'info');
        return;
      }

      this.showLoadList(savedList);
    } catch (error) {
      console.error('Erro ao carregar desenho:', error);
      errorLogger.log(error, { context: 'coloring-screen-load' });
      this.showNotification('Erro inesperado ao carregar', 'error');
    }
  }

  /**
   * Exibe a lista de desenhos salvos como overlay
   * @param {Array} savedList - Lista de salvamentos
   * @private
   */
  showLoadList(savedList) {
    this.loadListContainer = document.createElement('div');
    this.loadListContainer.className = 'save-load-modal show';
    this.loadListContainer.setAttribute('role', 'dialog');
    this.loadListContainer.setAttribute('aria-label', 'Carregar desenho salvo');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', () => this.closeLoadList());
    this.loadListContainer.appendChild(backdrop);

    // Conteúdo
    const content = document.createElement('div');
    content.className = 'modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = 'Carregar Desenho Salvo';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.addEventListener('click', () => this.closeLoadList());
    header.appendChild(title);
    header.appendChild(closeBtn);
    content.appendChild(header);

    // Body com lista
    const body = document.createElement('div');
    body.className = 'modal-body';

    savedList.forEach(saved => {
      const item = document.createElement('div');
      item.className = 'saved-drawing-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Carregar ${saved.customName}`);
      item.style.cssText = 'padding:12px;margin-bottom:8px;border:2px solid #ddd;border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;min-height:44px;';

      const info = document.createElement('div');
      info.innerHTML = `<strong>${saved.customName}</strong><br><small style="color:#666">${new Date(saved.savedAt).toLocaleString('pt-BR')} · ${saved.preview.coloredAreas} áreas · ${saved.preview.uniqueColors} cores</small>`;

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '🗑️';
      deleteBtn.setAttribute('aria-label', `Remover ${saved.customName}`);
      deleteBtn.style.cssText = 'min-width:44px;min-height:44px;background:#E74C3C;color:white;border:none;border-radius:8px;cursor:pointer;font-size:16px;';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const result = saveLoadService.deleteDrawing(saved.id);
        if (result.success) {
          item.remove();
          this.showNotification(result.message, 'success');
          // Fechar se não sobrou nenhum
          if (body.children.length === 0) {
            this.closeLoadList();
          }
        }
      });

      item.appendChild(info);
      item.appendChild(deleteBtn);

      const loadHandler = () => {
        this.loadSavedDrawing(saved.id);
        this.closeLoadList();
      };
      item.addEventListener('click', loadHandler);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadHandler();
        }
      });

      // Hover
      item.addEventListener('mouseenter', () => { item.style.borderColor = '#4A90E2'; item.style.backgroundColor = '#f0f7ff'; });
      item.addEventListener('mouseleave', () => { item.style.borderColor = '#ddd'; item.style.backgroundColor = ''; });

      body.appendChild(item);
    });

    content.appendChild(body);
    this.loadListContainer.appendChild(content);
    this.container.appendChild(this.loadListContainer);

    // Focar no primeiro item
    const firstItem = body.querySelector('[role="button"]');
    if (firstItem) firstItem.focus();
  }

  /**
   * Fecha a lista de carregamento
   * @private
   */
  closeLoadList() {
    if (this.loadListContainer) {
      this.loadListContainer.remove();
      this.loadListContainer = null;
    }
  }

  /**
   * Carrega um desenho salvo pelo ID
   * @param {string} saveId - ID do salvamento
   * @private
   */
  loadSavedDrawing(saveId) {
    try {
      const result = saveLoadService.loadDrawing(saveId);
      if (!result.success) {
        this.showNotification('Desenho não encontrado.', 'error');
        return;
      }

      const savedData = result.data;

      // Limpar desenho atual
      if (this.svgCanvas) {
        this.svgCanvas.clearAllColors();
      }
      this.coloredAreas.clear();

      // Aplicar cores salvas
      if (savedData.coloredAreas) {
        Object.entries(savedData.coloredAreas).forEach(([areaId, color]) => {
          if (this.svgCanvas) {
            this.svgCanvas.applyColorToArea(areaId, color);
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
   * Exibe notificação temporária
   * @param {string} message - Mensagem
   * @param {string} type - Tipo (success, error, warning, info)
   * @private
   */
  showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existing = this.container.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');

    this.container.appendChild(notification);

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
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    this.closeLoadList();

    if (this.colorPalette) {
      this.colorPalette.destroy();
    }

    if (this.svgCanvas) {
      this.svgCanvas.destroy();
    }

    this.container.innerHTML = '';
  }
}

export default ColoringScreen;
