import { SVGManipulator } from '../services/SVGManipulator.js';
import { createErrorPlaceholder, createLoadingPlaceholder, errorLogger } from '../utils/errorHandling.js';
import { debounce, throttle, svgCache } from '../utils/performanceUtils.js';

/**
 * Componente Canvas SVG para renderizar e interagir com desenhos
 */
export class SVGCanvas {
  /**
   * @param {HTMLElement} container - Container onde o canvas será renderizado
   * @param {Object} options - Opções de configuração
   * @param {string} options.svgUrl - URL do arquivo SVG
   * @param {string} options.selectedColor - Cor atualmente selecionada
   * @param {Function} options.onAreaClick - Callback quando uma área é clicada
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container é obrigatório');
    }

    this.container = container;
    this.svgUrl = options.svgUrl;
    this.selectedColor = options.selectedColor || '#000000';
    this.onAreaClick = options.onAreaClick || (() => {});
    
    this.svgManipulator = new SVGManipulator();
    this.svgElement = null;
    this.colorableAreas = [];
    this.currentHighlightedArea = null;
    this.appliedColors = new Map(); // Armazena cores aplicadas por área

    // Criar versões otimizadas dos handlers
    this.debouncedMouseEnter = debounce(this.handleAreaMouseEnter.bind(this), 50);
    this.debouncedMouseLeave = debounce(this.handleAreaMouseLeave.bind(this), 50);

    if (this.svgUrl) {
      this.loadSVG(this.svgUrl);
    }
  }

  /**
   * Carrega um arquivo SVG
   * @param {string} url - URL do arquivo SVG
   * @returns {Promise<void>}
   */
  async loadSVG(url) {
    try {
      // Validar URL
      if (!url || typeof url !== 'string') {
        throw new Error('URL do SVG inválida');
      }

      // Verificar cache primeiro
      const cachedSVG = svgCache.get(url);
      if (cachedSVG) {
        console.log('SVG carregado do cache:', url);
        this.svgElement = cachedSVG.cloneNode(true);
        this.colorableAreas = this.svgManipulator.identifyColorableAreas(this.svgElement);
        this.render();
        this.attachEventListeners();
        return;
      }

      // Exibir loading
      this.renderLoading();

      this.svgElement = await this.svgManipulator.loadSVG(url);
      
      // Validar que o SVG foi carregado corretamente
      if (!this.svgElement) {
        throw new Error('SVG não pôde ser carregado');
      }

      // Adicionar ao cache
      svgCache.set(url, this.svgElement.cloneNode(true));

      this.colorableAreas = this.svgManipulator.identifyColorableAreas(this.svgElement);
      
      // Verificar se há áreas coloríveis
      if (this.colorableAreas.length === 0) {
        console.warn('Nenhuma área colorível encontrada no SVG');
      }
      
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Erro ao carregar SVG:', error);
      this.renderError(error);
      throw error;
    }
  }

  /**
   * Renderiza o estado de loading
   * @private
   */
  renderLoading() {
    this.container.innerHTML = '';
    const loadingElement = createLoadingPlaceholder('Carregando desenho...');
    this.container.appendChild(loadingElement);
  }

  /**
   * Renderiza mensagem de erro
   * @param {Error} error - Erro ocorrido
   * @private
   */
  renderError(error) {
    this.container.innerHTML = '';
    
    // Registrar erro
    errorLogger.log(error, { 
      component: 'SVGCanvas', 
      svgUrl: this.svgUrl 
    });
    
    // Criar placeholder de erro
    const errorElement = createErrorPlaceholder(
      error.message || 'Erro ao carregar desenho',
      {
        showRetry: false,
        className: 'svg-canvas-error'
      }
    );
    
    this.container.appendChild(errorElement);
  }

  /**
   * Renderiza o SVG no container
   */
  render() {
    if (!this.svgElement) {
      return;
    }

    // Limpar container
    this.container.innerHTML = '';

    // Criar wrapper para o canvas
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'svg-canvas';
    canvasWrapper.setAttribute('role', 'img');
    canvasWrapper.setAttribute('aria-label', 'Desenho para colorir');

    // Adicionar SVG ao wrapper
    canvasWrapper.appendChild(this.svgElement);

    this.container.appendChild(canvasWrapper);
  }

  /**
   * Anexa event listeners às áreas coloríveis
   */
  attachEventListeners() {
    if (!this.svgElement) {
      return;
    }

    this.colorableAreas.forEach(area => {
      const element = this.svgElement.querySelector(`#${area.id}`);
      
      if (element) {
        // Click event - aplicar cor
        element.addEventListener('click', () => this.handleAreaClick(area.id));

        // Mouse enter - destacar área e mudar cursor (com debounce)
        element.addEventListener('mouseenter', () => this.debouncedMouseEnter(area.id));

        // Mouse leave - remover destaque (com debounce)
        element.addEventListener('mouseleave', () => this.debouncedMouseLeave(area.id));

        // Touch events para dispositivos móveis
        // touchstart - equivalente a mouseenter + click
        element.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleAreaMouseEnter(area.id);
          this.handleAreaClick(area.id);
        });

        // touchend - equivalente a mouseleave
        element.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleAreaMouseLeave(area.id);
        });

        // touchcancel - limpar estado se o toque for cancelado
        element.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          this.handleAreaMouseLeave(area.id);
        });

        // Tornar área focável por teclado
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        element.setAttribute('aria-label', `Área colorível ${area.id}`);

        // Keyboard event
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleAreaClick(area.id);
          }
        });
      }
    });
  }

  /**
   * Manipula clique em uma área
   * @param {string} areaId - ID da área clicada
   */
  handleAreaClick(areaId) {
    if (!this.svgElement || !this.selectedColor) {
      return;
    }

    // Aplicar cor à área
    this.svgManipulator.applyColorToArea(this.svgElement, areaId, this.selectedColor);
    
    // Armazenar cor aplicada
    this.appliedColors.set(areaId, this.selectedColor);

    // Chamar callback
    this.onAreaClick(areaId, this.selectedColor);
  }

  /**
   * Manipula mouse enter em uma área
   * @param {string} areaId - ID da área
   */
  handleAreaMouseEnter(areaId) {
    if (!this.svgElement) {
      return;
    }

    // Destacar área
    this.svgManipulator.highlightArea(this.svgElement, areaId, true);
    this.currentHighlightedArea = areaId;

    // Mudar cursor para pincel
    const element = this.svgElement.querySelector(`#${areaId}`);
    if (element) {
      element.style.cursor = 'crosshair';
    }
  }

  /**
   * Manipula mouse leave de uma área
   * @param {string} areaId - ID da área
   */
  handleAreaMouseLeave(areaId) {
    if (!this.svgElement) {
      return;
    }

    // Remover destaque
    this.svgManipulator.highlightArea(this.svgElement, areaId, false);
    this.currentHighlightedArea = null;

    // Restaurar cursor
    const element = this.svgElement.querySelector(`#${areaId}`);
    if (element) {
      element.style.cursor = '';
    }
  }

  /**
   * Define a cor selecionada
   * @param {string} color - Cor hexadecimal
   */
  setSelectedColor(color) {
    this.selectedColor = color;
  }

  /**
   * Retorna a cor selecionada
   * @returns {string} Cor hexadecimal
   */
  getSelectedColor() {
    return this.selectedColor;
  }

  /**
   * Limpa todas as cores aplicadas
   */
  clearAllColors() {
    if (!this.svgElement) {
      return;
    }

    this.svgManipulator.clearAllColors(this.svgElement);
    this.appliedColors.clear();
  }

  /**
   * Retorna a cor aplicada em uma área específica
   * @param {string} areaId - ID da área
   * @returns {string|null} Cor hexadecimal ou null se não colorida
   */
  getAreaColor(areaId) {
    return this.appliedColors.get(areaId) || null;
  }

  /**
   * Retorna todas as cores aplicadas
   * @returns {Map<string, string>} Mapa de areaId -> cor
   */
  getAllAppliedColors() {
    return new Map(this.appliedColors);
  }

  /**
   * Retorna as áreas coloríveis identificadas
   * @returns {Array} Array de áreas coloríveis
   */
  getColorableAreas() {
    return [...this.colorableAreas];
  }

  /**
   * Obtém o conteúdo SVG atual com as cores aplicadas
   * @returns {string|null} Conteúdo SVG ou null se não disponível
   */
  getSVGContent() {
    if (!this.svgElement) {
      return null;
    }

    try {
      // Clonar o SVG para não modificar o original
      const svgClone = this.svgElement.cloneNode(true);
      
      // Serializar o SVG
      const serializer = new XMLSerializer();
      return serializer.serializeToString(svgClone);
    } catch (error) {
      console.error('Erro ao obter conteúdo SVG:', error);
      return null;
    }
  }

  /**
   * Destrói o componente e remove event listeners
   */
  destroy() {
    this.container.innerHTML = '';
    this.svgElement = null;
    this.colorableAreas = [];
    this.appliedColors.clear();
    this.currentHighlightedArea = null;
  }
}

export default SVGCanvas;
