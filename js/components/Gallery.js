import LoaderService from '../services/LoaderService.js';
import { createErrorPlaceholder, createLoadingPlaceholder, errorLogger } from '../utils/errorHandling.js';

/**
 * Componente Galeria
 * Exibe todos os desenhos disponíveis organizados por categorias
 */
export class Gallery {
  /**
   * @param {Object} options - Opções de configuração
   * @param {HTMLElement} options.container - Container onde a galeria será renderizada
   * @param {Function} options.onDrawingSelect - Callback quando um desenho é selecionado
   */
  constructor({ container, onDrawingSelect }) {
    if (!container || typeof container.appendChild !== 'function') {
      throw new Error('Container inválido para Gallery');
    }

    if (!onDrawingSelect || typeof onDrawingSelect !== 'function') {
      throw new Error('Callback onDrawingSelect é obrigatório');
    }

    this.container = container;
    this.onDrawingSelect = onDrawingSelect;
    this.categories = [];
    this.lazyLoadObserver = null;
    this.loaderService = LoaderService;
  }

  /**
   * Inicializa a galeria carregando e renderizando os desenhos
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Exibir loading
      this.renderLoading();

      // Carregar desenhos agrupados por categoria
      this.categories = await this.loaderService.loadDrawingsGroupedByCategory();

      // Renderizar galeria
      this.render();

      // Configurar lazy loading
      this.setupLazyLoading();
    } catch (error) {
      console.error('Erro ao inicializar galeria:', error);
      this.renderError(error);
    }
  }

  /**
   * Renderiza o estado de loading
   * @private
   */
  renderLoading() {
    this.container.innerHTML = '';
    const loadingElement = createLoadingPlaceholder('Carregando desenhos...');
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
    errorLogger.log(error, { component: 'Gallery', phase: 'initialization' });
    
    // Criar placeholder de erro com botão de retry
    const errorElement = createErrorPlaceholder(
      `Erro ao carregar galeria: ${error.message}`,
      {
        showRetry: true,
        onRetry: () => this.init(),
        className: 'gallery-error'
      }
    );
    
    this.container.appendChild(errorElement);
  }

  /**
   * Renderiza a galeria completa
   * @private
   */
  render() {
    // Limpar container
    this.container.innerHTML = '';

    // Criar elemento principal da galeria
    const galleryElement = document.createElement('div');
    galleryElement.className = 'gallery';
    galleryElement.setAttribute('role', 'main');
    galleryElement.setAttribute('aria-label', 'Galeria de desenhos para colorir');

    // Renderizar cada categoria
    this.categories.forEach(category => {
      if (category.drawings && category.drawings.length > 0) {
        const categoryElement = this.renderCategory(category);
        galleryElement.appendChild(categoryElement);
      }
    });

    // Adicionar ao container
    this.container.appendChild(galleryElement);
  }

  /**
   * Renderiza uma categoria com seus desenhos
   * @param {import('../models/Category.js').Category} category - Categoria a renderizar
   * @returns {HTMLElement} Elemento da categoria
   * @private
   */
  renderCategory(category) {
    const categoryElement = document.createElement('section');
    categoryElement.className = 'gallery-category';
    categoryElement.dataset.categoryId = category.id;
    categoryElement.setAttribute('aria-labelledby', `category-header-${category.id}`);

    // Cabeçalho da categoria
    const header = document.createElement('h2');
    header.className = 'gallery-category-header';
    header.id = `category-header-${category.id}`;
    header.textContent = category.name;
    categoryElement.appendChild(header);

    // Grid de desenhos
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    grid.setAttribute('role', 'list');
    grid.setAttribute('aria-label', `Desenhos da categoria ${category.name}`);

    category.drawings.forEach(drawing => {
      const drawingElement = this.renderDrawing(drawing);
      grid.appendChild(drawingElement);
    });

    categoryElement.appendChild(grid);

    return categoryElement;
  }

  /**
   * Renderiza um desenho individual
   * @param {import('../models/Drawing.js').Drawing} drawing - Desenho a renderizar
   * @returns {HTMLElement} Elemento do desenho
   * @private
   */
  renderDrawing(drawing) {
    const drawingElement = document.createElement('div');
    drawingElement.className = 'gallery-item';
    drawingElement.dataset.drawingId = drawing.id;
    drawingElement.setAttribute('role', 'listitem');

    // Criar botão clicável
    const button = document.createElement('button');
    button.className = 'gallery-item-button';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', `Colorir ${drawing.name}`);
    
    // Garantir tamanho mínimo de 44x44px
    button.style.minWidth = '44px';
    button.style.minHeight = '44px';

    // Criar imagem com lazy loading
    const img = document.createElement('img');
    img.className = 'gallery-item-thumbnail';
    img.alt = drawing.name;
    img.setAttribute('aria-hidden', 'true'); // Decorativa, já temos aria-label no botão
    
    // Usar data-src para lazy loading
    img.setAttribute('data-src', drawing.thumbnailUrl);
    
    // Placeholder enquanto carrega
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3C/svg%3E';

    button.appendChild(img);

    // Nome do desenho
    const name = document.createElement('span');
    name.className = 'gallery-item-name';
    name.textContent = drawing.name;
    name.setAttribute('aria-hidden', 'true'); // Já incluído no aria-label
    button.appendChild(name);

    // Event listener para seleção
    button.addEventListener('click', () => {
      this.handleDrawingClick(drawing);
    });

    // Touch event para dispositivos móveis
    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleDrawingClick(drawing);
    });

    // Keyboard navigation
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleDrawingClick(drawing);
      }
    });

    drawingElement.appendChild(button);

    return drawingElement;
  }

  /**
   * Manipula clique em um desenho
   * @param {import('../models/Drawing.js').Drawing} drawing - Desenho clicado
   * @private
   */
  handleDrawingClick(drawing) {
    // Feedback visual
    const button = this.container.querySelector(`[data-drawing-id="${drawing.id}"] button`);
    if (button) {
      button.classList.add('gallery-item-selected');
      
      // Remover classe após animação
      setTimeout(() => {
        button.classList.remove('gallery-item-selected');
      }, 300);
    }

    // Chamar callback
    this.onDrawingSelect(drawing);
  }

  /**
   * Configura lazy loading de miniaturas
   * @private
   */
  setupLazyLoading() {
    // Limpar observer anterior se existir
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
    }

    // Criar novo observer
    this.lazyLoadObserver = this.loaderService.setupLazyLoading(
      this.container,
      'img[data-src]'
    );
  }

  /**
   * Retorna IDs de todos os desenhos renderizados
   * @returns {string[]} Array de IDs
   */
  getRenderedDrawingIds() {
    const items = this.container.querySelectorAll('.gallery-item');
    return Array.from(items).map(item => item.dataset.drawingId);
  }

  /**
   * Retorna todas as categorias carregadas
   * @returns {Array<import('../models/Category.js').Category>} Categorias
   */
  getCategories() {
    return this.categories;
  }

  /**
   * Destrói o componente e limpa recursos
   */
  destroy() {
    // Desconectar observer
    if (this.lazyLoadObserver) {
      this.lazyLoadObserver.disconnect();
      this.lazyLoadObserver = null;
    }

    // Limpar container
    this.container.innerHTML = '';

    // Limpar referências
    this.categories = [];
  }
}

export default Gallery;
