/**
 * Gerenciador de Estado da Aplicação
 * Gerencia o estado global e transições entre views
 */
export class ApplicationState {
  /**
   * @param {Object} options - Opções de configuração
   * @param {HTMLElement} options.galleryContainer - Container da galeria
   * @param {HTMLElement} options.coloringContainer - Container da tela de colorir
   */
  constructor({ galleryContainer, coloringContainer }) {
    if (!galleryContainer || !coloringContainer) {
      throw new Error('Containers são obrigatórios');
    }

    this.galleryContainer = galleryContainer;
    this.coloringContainer = coloringContainer;

    // Estado atual
    this.state = {
      currentView: 'gallery', // 'gallery' | 'coloring'
      selectedDrawing: null,
      coloringState: {
        selectedColor: null,
        coloredAreas: new Map(),
        isModified: false
      },
      galleryState: {
        scrollPosition: 0,
        lastSelectedCategory: null
      }
    };

    // Listeners para mudanças de estado
    this.listeners = [];
  }

  /**
   * Retorna o estado atual
   * @returns {Object} Estado atual
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Retorna a view atual
   * @returns {string} View atual ('gallery' | 'coloring')
   */
  getCurrentView() {
    return this.state.currentView;
  }

  /**
   * Retorna o desenho selecionado
   * @returns {Object|null} Desenho selecionado
   */
  getSelectedDrawing() {
    return this.state.selectedDrawing;
  }

  /**
   * Transiciona para a galeria
   * @param {boolean} preserveState - Se deve preservar o estado da galeria
   */
  transitionToGallery(preserveState = true) {
    // Salvar posição de scroll atual se estamos na galeria
    if (this.state.currentView === 'gallery' && preserveState) {
      this.state.galleryState.scrollPosition = this.galleryContainer.scrollTop || 0;
    }

    // Ocultar tela de colorir
    this.coloringContainer.style.display = 'none';
    
    // Mostrar galeria
    this.galleryContainer.style.display = 'block';

    // Atualizar estado
    this.state.currentView = 'gallery';

    // Restaurar posição de scroll se preservando estado
    if (preserveState && this.state.galleryState.scrollPosition > 0) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        this.galleryContainer.scrollTop = this.state.galleryState.scrollPosition;
      }, 0);
    }

    // Notificar listeners
    this.notifyListeners('viewChanged', { view: 'gallery' });
  }

  /**
   * Transiciona para a tela de colorir
   * @param {Object} drawing - Desenho selecionado
   */
  transitionToColoring(drawing) {
    if (!drawing) {
      throw new Error('Desenho é obrigatório para transição');
    }

    // Salvar posição de scroll da galeria
    this.state.galleryState.scrollPosition = this.galleryContainer.scrollTop || 0;

    // Ocultar galeria
    this.galleryContainer.style.display = 'none';
    
    // Mostrar tela de colorir
    this.coloringContainer.style.display = 'block';

    // Atualizar estado
    this.state.currentView = 'coloring';
    this.state.selectedDrawing = drawing;

    // Resetar estado de colorir para novo desenho
    this.state.coloringState = {
      selectedColor: null,
      coloredAreas: new Map(),
      isModified: false
    };

    // Notificar listeners
    this.notifyListeners('viewChanged', { view: 'coloring', drawing });
  }

  /**
   * Atualiza a cor selecionada
   * @param {string} color - Cor em formato hexadecimal
   */
  setSelectedColor(color) {
    this.state.coloringState.selectedColor = color;
    this.notifyListeners('colorSelected', { color });
  }

  /**
   * Retorna a cor selecionada
   * @returns {string|null} Cor selecionada
   */
  getSelectedColor() {
    return this.state.coloringState.selectedColor;
  }

  /**
   * Registra que uma área foi colorida
   * @param {string} areaId - ID da área
   * @param {string} color - Cor aplicada
   */
  setAreaColor(areaId, color) {
    this.state.coloringState.coloredAreas.set(areaId, color);
    this.state.coloringState.isModified = true;
    this.notifyListeners('areaColored', { areaId, color });
  }

  /**
   * Retorna a cor de uma área
   * @param {string} areaId - ID da área
   * @returns {string|undefined} Cor da área
   */
  getAreaColor(areaId) {
    return this.state.coloringState.coloredAreas.get(areaId);
  }

  /**
   * Retorna todas as áreas coloridas
   * @returns {Map<string, string>} Mapa de áreas coloridas
   */
  getColoredAreas() {
    return new Map(this.state.coloringState.coloredAreas);
  }

  /**
   * Limpa todas as cores aplicadas
   */
  clearAllColors() {
    this.state.coloringState.coloredAreas.clear();
    this.state.coloringState.isModified = false;
    this.notifyListeners('colorsCleared');
  }

  /**
   * Verifica se o desenho foi modificado
   * @returns {boolean} True se foi modificado
   */
  isDrawingModified() {
    return this.state.coloringState.isModified;
  }

  /**
   * Salva a categoria selecionada na galeria
   * @param {string} categoryId - ID da categoria
   */
  setLastSelectedCategory(categoryId) {
    this.state.galleryState.lastSelectedCategory = categoryId;
  }

  /**
   * Retorna a última categoria selecionada
   * @returns {string|null} ID da categoria
   */
  getLastSelectedCategory() {
    return this.state.galleryState.lastSelectedCategory;
  }

  /**
   * Adiciona um listener para mudanças de estado
   * @param {Function} listener - Função callback (event, data) => void
   */
  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener deve ser uma função');
    }
    this.listeners.push(listener);
  }

  /**
   * Remove um listener
   * @param {Function} listener - Função callback a remover
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica todos os listeners sobre uma mudança
   * @param {string} event - Nome do evento
   * @param {Object} data - Dados do evento
   * @private
   */
  notifyListeners(event, data = {}) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Reseta o estado para o inicial
   */
  reset() {
    this.state = {
      currentView: 'gallery',
      selectedDrawing: null,
      coloringState: {
        selectedColor: null,
        coloredAreas: new Map(),
        isModified: false
      },
      galleryState: {
        scrollPosition: 0,
        lastSelectedCategory: null
      }
    };

    this.transitionToGallery(false);
    this.notifyListeners('stateReset');
  }
}

export default ApplicationState;
