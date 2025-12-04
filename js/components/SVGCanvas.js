import { SVGManipulator } from '../services/SVGManipulator.js';
import { createErrorPlaceholder, createLoadingPlaceholder, errorLogger } from '../utils/errorHandling.js';
import { debounce, throttle, svgCache } from '../utils/performanceUtils.js';

/**
 * Interface para log de eventos de clique
 * @typedef {Object} ClickEventLog
 * @property {number} timestamp - Timestamp do evento (Date.now())
 * @property {string} expectedAreaId - ID esperado da área clicada
 * @property {string|null} targetId - ID do elemento que recebeu o evento
 * @property {string|null} targetElement - Tag do elemento que recebeu o evento
 * @property {string|null} pointerEvents - Valor do atributo pointer-events do target
 * @property {string|null} fill - Valor do atributo fill do target
 * @property {boolean} success - Se a cor foi aplicada com sucesso
 * @property {string|null} appliedColor - Cor que foi aplicada (se success=true)
 */

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
    this.clickLogs = []; // Armazena logs de eventos de clique

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
   * Apenas anexa listeners a áreas coloríveis válidas (sem pointer-events="none")
   */
  attachEventListeners() {
    if (!this.svgElement) {
      return;
    }

    this.colorableAreas.forEach(area => {
      const element = this.svgElement.querySelector(`#${area.id}`);
      
      if (!element) {
        console.warn(`[SVGCanvas] Área colorível não encontrada: ${area.id}`);
        return;
      }
      
      // Validar que o elemento não é decorativo
      const pointerEvents = element.getAttribute('pointer-events');
      if (pointerEvents === 'none') {
        console.warn(`[SVGCanvas] Área ${area.id} tem pointer-events="none", pulando anexação de listeners`);
        return;
      }
      
      // Click event - aplicar cor
      element.addEventListener('click', (e) => this.handleAreaClick(e, area.id));

      // Mouse enter - destacar área e mudar cursor (com debounce)
      element.addEventListener('mouseenter', () => this.debouncedMouseEnter(area.id));

      // Mouse leave - remover destaque (com debounce)
      element.addEventListener('mouseleave', () => this.debouncedMouseLeave(area.id));

      // Touch events para dispositivos móveis
      // touchstart - equivalente a mouseenter + click
      element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleAreaMouseEnter(area.id);
        this.handleAreaClick(e, area.id);
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
          this.handleAreaClick(e, area.id);
        }
      });
    });
  }

  /**
   * Manipula clique em uma área
   * @param {Event} event - Evento de clique
   * @param {string} expectedAreaId - ID esperado da área clicada
   */
  handleAreaClick(event, expectedAreaId) {
    // Early return: validar pré-condições básicas
    if (!this.svgElement || !this.selectedColor) {
      this.logError('Pré-condições não atendidas (SVG ou cor não disponível)', {
        expectedAreaId
      });
      return;
    }

    // Early return: validar event e event target
    if (!event || !event.target) {
      console.warn('[SVGCanvas] Evento ou event.target inválido - clique ignorado para preservar estado');
      this.logError('Evento ou event.target inválido', {
        expectedAreaId
      });
      return;
    }

    // Validar event target
    const target = event.target;
    const targetId = target.getAttribute('id');
    const targetElement = target.tagName;
    const pointerEvents = target.getAttribute('pointer-events');
    const fill = target.getAttribute('fill');
    
    // Logging detalhado do event target
    console.log('[SVGCanvas] Clique detectado:', {
      expectedAreaId,
      targetId,
      targetElement,
      pointerEvents,
      fill
    });
    
    // Early return: verificar se target é um elemento decorativo
    if (this.svgManipulator.isDecorativeElement(target)) {
      console.warn('[SVGCanvas] Clique em elemento decorativo - ignorado para preservar estado');
      this.logError('Clique em elemento decorativo', {
        expectedAreaId,
        targetId,
        targetElement,
        pointerEvents,
        fill
      });
      return;
    }
    
    // Early return: verificar se target tem ID de área válido
    if (!targetId || !targetId.startsWith('area-')) {
      console.warn('[SVGCanvas] Target sem ID de área válido - tentando encontrar área válida');
      
      // Tentar encontrar área válida na árvore DOM
      const correctAreaId = this.findCorrectArea(target, expectedAreaId);
      if (!correctAreaId) {
        console.warn('[SVGCanvas] Nenhuma área válida encontrada - clique ignorado para preservar estado');
        this.logError('ID de área inválido e nenhuma área válida encontrada na árvore DOM', {
          expectedAreaId,
          targetId,
          targetElement,
          pointerEvents,
          fill
        });
        return;
      }
      
      // Área válida encontrada, usar esse ID
      console.log(`[SVGCanvas] Área válida encontrada: ${correctAreaId}`);
      expectedAreaId = correctAreaId;
    } else {
      // Target tem ID válido, mas pode não ser o esperado
      if (targetId !== expectedAreaId) {
        console.warn(`[SVGCanvas] Target inesperado: esperado ${expectedAreaId}, recebido ${targetId}`);
        
        // Tentar encontrar a área correta
        const correctAreaId = this.findCorrectArea(target, expectedAreaId);
        if (correctAreaId) {
          console.log(`[SVGCanvas] Área correta encontrada: ${correctAreaId}`);
          expectedAreaId = correctAreaId;
        } else {
          // Usar o targetId se não encontrar área correta
          expectedAreaId = targetId;
        }
      }
    }
    
    // Early return: verificar se a área está na lista de áreas coloríveis
    const isColorableArea = this.colorableAreas.some(area => area.id === expectedAreaId);
    if (!isColorableArea) {
      console.warn(`[SVGCanvas] Área ${expectedAreaId} não está na lista de áreas coloríveis - clique ignorado`);
      this.logError('Área não encontrada na lista de áreas coloríveis', {
        expectedAreaId,
        targetId,
        targetElement,
        pointerEvents,
        fill
      });
      return;
    }

    // Para áreas sobrepostas, o navegador já seleciona automaticamente
    // o elemento mais à frente no z-index através do event.target.
    // Portanto, podemos confiar no targetId/expectedAreaId que já representa
    // a área mais específica que foi clicada.

    // Aplicar cor à área usando método dedicado
    this.applyColorToArea(expectedAreaId, this.selectedColor);
    
    // Log de clique bem-sucedido
    this.logClickEvent({
      expectedAreaId,
      targetId,
      targetElement,
      pointerEvents,
      fill,
      success: true,
      appliedColor: this.selectedColor
    });
  }

  /**
   * Aplica cor a uma área específica
   * Método separado para isolar a lógica de aplicação de cor
   * @param {string} areaId - ID da área a colorir
   * @param {string} color - Cor hexadecimal a aplicar
   */
  applyColorToArea(areaId, color) {
    if (!this.svgElement || !areaId || !color) {
      return;
    }

    // Aplicar cor à área usando SVGManipulator
    this.svgManipulator.applyColorToArea(this.svgElement, areaId, color);
    
    // Armazenar cor aplicada
    this.appliedColors.set(areaId, color);

    // Chamar callback
    this.onAreaClick(areaId, color);
  }

  /**
   * Registra um evento de clique para debugging
   * @param {Object} logData - Dados do evento de clique
   * @param {string} logData.expectedAreaId - ID esperado da área
   * @param {string|null} logData.targetId - ID do elemento clicado
   * @param {string|null} logData.targetElement - Tag do elemento clicado
   * @param {string|null} logData.pointerEvents - Valor de pointer-events
   * @param {string|null} logData.fill - Cor de preenchimento
   * @param {boolean} logData.success - Se a cor foi aplicada com sucesso
   * @param {string|null} logData.appliedColor - Cor aplicada
   */
  logClickEvent(logData) {
    const log = {
      timestamp: Date.now(),
      expectedAreaId: logData.expectedAreaId,
      targetId: logData.targetId,
      targetElement: logData.targetElement,
      pointerEvents: logData.pointerEvents,
      fill: logData.fill,
      success: logData.success,
      appliedColor: logData.appliedColor
    };
    
    this.clickLogs.push(log);
    
    // Log no console para debugging
    console.log('[SVGCanvas] Click event logged:', log);
  }

  /**
   * Registra um erro de seleção de área para debugging
   * @param {string} reason - Motivo da falha
   * @param {Object} context - Contexto adicional do erro
   * @param {string} context.expectedAreaId - ID esperado da área
   * @param {string|null} [context.targetId] - ID do elemento clicado
   * @param {string|null} [context.targetElement] - Tag do elemento clicado
   * @param {string|null} [context.pointerEvents] - Valor de pointer-events
   * @param {string|null} [context.fill] - Cor de preenchimento
   */
  logError(reason, context = {}) {
    const errorLog = {
      timestamp: Date.now(),
      reason,
      expectedAreaId: context.expectedAreaId || null,
      targetId: context.targetId || null,
      targetElement: context.targetElement || null,
      pointerEvents: context.pointerEvents || null,
      fill: context.fill || null
    };
    
    this.clickLogs.push({
      ...errorLog,
      success: false,
      appliedColor: null
    });
    
    // Log de erro no console
    console.error('[SVGCanvas] Error logged:', errorLog);
  }

  /**
   * Encontra a área colorível correta quando o target está incorreto
   * Percorre a árvore DOM buscando uma área válida
   * @param {Element} target - Elemento clicado
   * @param {string} expectedAreaId - ID esperado da área
   * @returns {string|null} ID da área correta ou null se não encontrada
   */
  findCorrectArea(target, expectedAreaId) {
    if (!target || !this.svgElement) {
      this.logError('Target ou SVG não disponível em findCorrectArea', {
        expectedAreaId,
        targetId: target ? target.getAttribute('id') : null
      });
      return null;
    }

    // Verificar se o target é decorativo
    if (this.svgManipulator.isDecorativeElement(target)) {
      console.log(`[SVGCanvas] Target é decorativo, procurando área colorível`);
      
      // Procurar área colorível com o mesmo ID
      const targetId = target.getAttribute('id');
      if (targetId && targetId.startsWith('area-')) {
        // Verificar se existe uma área colorível com este ID
        const colorableArea = this.colorableAreas.find(a => a.id === targetId);
        if (colorableArea) {
          return targetId;
        }
      }
      
      // Se não encontrou pelo ID, procurar área colorível com o expectedAreaId
      const expectedArea = this.colorableAreas.find(a => a.id === expectedAreaId);
      if (expectedArea) {
        return expectedAreaId;
      }
    }

    // Percorrer árvore DOM em direção aos pais
    let currentElement = target.parentElement;
    let depth = 0;
    const maxDepth = 10; // Prevenir loop infinito
    
    while (currentElement && depth < maxDepth) {
      const elementId = currentElement.getAttribute('id');
      
      // Verificar se o elemento tem um ID de área válido
      if (elementId && elementId.startsWith('area-')) {
        // Verificar se é uma área colorível (não decorativa)
        if (!this.svgManipulator.isDecorativeElement(currentElement)) {
          // Verificar se está na lista de áreas coloríveis
          const colorableArea = this.colorableAreas.find(a => a.id === elementId);
          if (colorableArea) {
            console.log(`[SVGCanvas] Área válida encontrada na árvore DOM: ${elementId} (profundidade: ${depth})`);
            return elementId;
          }
        }
      }
      
      // Subir na árvore
      currentElement = currentElement.parentElement;
      depth++;
    }

    // Não encontrou área válida
    console.warn(`[SVGCanvas] Nenhuma área válida encontrada na árvore DOM (profundidade máxima: ${depth})`);
    this.logError('Nenhuma área válida encontrada na árvore DOM', {
      expectedAreaId,
      targetId: target.getAttribute('id'),
      targetElement: target.tagName,
      pointerEvents: target.getAttribute('pointer-events'),
      fill: target.getAttribute('fill')
    });
    return null;
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
    console.log('[SVGCanvas] setSelectedColor chamado com:', color, 'tipo:', typeof color);
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
   * Retorna uma cópia dos logs de cliques
   * Útil para debugging e análise de eventos
   * @returns {Array<ClickEventLog>} Array com cópia dos logs de cliques
   */
  getClickLogs() {
    return [...this.clickLogs];
  }

  /**
   * Limpa todos os logs de cliques armazenados
   * Útil para resetar o estado de logging entre testes ou sessões
   */
  clearClickLogs() {
    this.clickLogs = [];
    console.log('[SVGCanvas] Logs de cliques limpos');
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
