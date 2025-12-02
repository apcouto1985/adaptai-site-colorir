/**
 * Gerenciador de Eventos Touch e Mouse
 * Fornece interface unificada para eventos touch e mouse
 */
export class TouchEventHandler {
  /**
   * @param {HTMLElement} element - Elemento para adicionar listeners
   * @param {Object} handlers - Handlers para eventos
   * @param {Function} handlers.onClick - Handler para clique/toque
   * @param {Function} handlers.onHover - Handler para hover (apenas mouse)
   * @param {Function} handlers.onHoverEnd - Handler para fim de hover (apenas mouse)
   */
  constructor(element, handlers = {}) {
    if (!element) {
      throw new Error('Elemento é obrigatório');
    }

    this.element = element;
    this.handlers = handlers;
    this.isTouch = false;
    this.listeners = [];

    this.setupEventListeners();
  }

  /**
   * Configura todos os event listeners
   * @private
   */
  setupEventListeners() {
    // Detectar se é dispositivo touch
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Click/Touch handlers
    if (this.handlers.onClick) {
      // Mouse click
      const clickListener = (e) => {
        // Prevenir execução dupla em dispositivos touch
        if (!this.isTouch) {
          this.handleClick(e);
        }
      };
      this.element.addEventListener('click', clickListener);
      this.listeners.push({ type: 'click', listener: clickListener });

      // Touch
      const touchEndListener = (e) => {
        this.handleTouch(e);
      };
      this.element.addEventListener('touchend', touchEndListener);
      this.listeners.push({ type: 'touchend', listener: touchEndListener });
    }

    // Hover handlers (apenas para mouse)
    if (this.handlers.onHover) {
      const mouseEnterListener = (e) => {
        if (!this.isTouch) {
          this.handlers.onHover(e);
        }
      };
      this.element.addEventListener('mouseenter', mouseEnterListener);
      this.listeners.push({ type: 'mouseenter', listener: mouseEnterListener });
    }

    if (this.handlers.onHoverEnd) {
      const mouseLeaveListener = (e) => {
        if (!this.isTouch) {
          this.handlers.onHoverEnd(e);
        }
      };
      this.element.addEventListener('mouseleave', mouseLeaveListener);
      this.listeners.push({ type: 'mouseleave', listener: mouseLeaveListener });
    }
  }

  /**
   * Manipula evento de clique
   * @param {MouseEvent} event - Evento de mouse
   * @private
   */
  handleClick(event) {
    if (this.handlers.onClick) {
      this.handlers.onClick({
        type: 'click',
        target: event.target,
        clientX: event.clientX,
        clientY: event.clientY,
        originalEvent: event
      });
    }
  }

  /**
   * Manipula evento de touch
   * @param {TouchEvent} event - Evento de touch
   * @private
   */
  handleTouch(event) {
    // Prevenir comportamento padrão e evento de mouse subsequente
    event.preventDefault();

    if (this.handlers.onClick) {
      // Usar o primeiro touch point
      const touch = event.changedTouches[0];
      
      this.handlers.onClick({
        type: 'touch',
        target: event.target,
        clientX: touch.clientX,
        clientY: touch.clientY,
        originalEvent: event
      });
    }
  }

  /**
   * Remove todos os event listeners
   */
  destroy() {
    this.listeners.forEach(({ type, listener }) => {
      this.element.removeEventListener(type, listener);
    });
    this.listeners = [];
  }

  /**
   * Adiciona suporte touch/mouse a um elemento
   * @param {HTMLElement} element - Elemento
   * @param {Function} onClick - Handler de clique
   * @returns {TouchEventHandler} Instância do handler
   * @static
   */
  static addClickSupport(element, onClick) {
    return new TouchEventHandler(element, { onClick });
  }

  /**
   * Adiciona suporte hover (apenas mouse) a um elemento
   * @param {HTMLElement} element - Elemento
   * @param {Function} onHover - Handler de hover
   * @param {Function} onHoverEnd - Handler de fim de hover
   * @returns {TouchEventHandler} Instância do handler
   * @static
   */
  static addHoverSupport(element, onHover, onHoverEnd) {
    return new TouchEventHandler(element, { onHover, onHoverEnd });
  }

  /**
   * Adiciona suporte completo (click + hover) a um elemento
   * @param {HTMLElement} element - Elemento
   * @param {Object} handlers - Todos os handlers
   * @returns {TouchEventHandler} Instância do handler
   * @static
   */
  static addFullSupport(element, handlers) {
    return new TouchEventHandler(element, handlers);
  }
}

export default TouchEventHandler;
