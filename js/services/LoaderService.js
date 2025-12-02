import { isValidDrawing } from '../models/Drawing.js';
import { groupDrawingsByCategory } from '../models/Category.js';
import { AppError, errorLogger } from '../utils/errorHandling.js';

/**
 * Serviço para carregamento de recursos (desenhos, catálogo)
 */
export class LoaderService {
  constructor() {
    this.catalogCache = null;
    this.preloadedDrawings = new Map();
  }

  /**
   * Carrega o catálogo completo de desenhos
   * @returns {Promise<Array<import('../models/Drawing.js').Drawing>>} Array de desenhos
   * @throws {AppError} Se o carregamento falhar
   */
  async loadDrawings() {
    // Verificar cache
    if (this.catalogCache) {
      return this.catalogCache;
    }

    try {
      const response = await fetch('/data/drawings-catalog.json');
      
      if (!response.ok) {
        const error = new AppError(
          `Falha ao carregar catálogo: HTTP ${response.status}`,
          'CATALOG_LOAD_ERROR',
          new Error(response.statusText)
        );
        errorLogger.log(error, { status: response.status });
        throw error;
      }
      
      const data = await response.json();
      
      // Validar estrutura do catálogo
      if (!data || typeof data !== 'object') {
        const error = new AppError(
          'Catálogo inválido: formato incorreto',
          'CATALOG_INVALID_FORMAT'
        );
        errorLogger.log(error, { data });
        throw error;
      }
      
      // Extrair todos os desenhos de todas as categorias
      const allDrawings = [];
      
      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach(category => {
          if (category.drawings && Array.isArray(category.drawings)) {
            category.drawings.forEach(drawing => {
              if (isValidDrawing(drawing)) {
                allDrawings.push(drawing);
              } else {
                console.warn('Desenho inválido ignorado:', drawing);
                errorLogger.log(
                  new AppError('Desenho inválido no catálogo', 'INVALID_DRAWING'),
                  { drawing, category: category.id }
                );
              }
            });
          }
        });
      }
      
      // Verificar se encontrou desenhos
      if (allDrawings.length === 0) {
        console.warn('Nenhum desenho válido encontrado no catálogo');
      }
      
      // Armazenar em cache
      this.catalogCache = allDrawings;
      
      return allDrawings;
    } catch (error) {
      // Se já é um AppError, apenas re-lançar
      if (error instanceof AppError) {
        throw error;
      }

      // Caso contrário, encapsular
      const wrappedError = new AppError(
        'Erro ao carregar catálogo de desenhos',
        'CATALOG_LOAD_ERROR',
        error
      );
      errorLogger.log(wrappedError);
      throw wrappedError;
    }
  }

  /**
   * Carrega desenhos filtrados por categoria
   * @param {string} categoryId - ID da categoria
   * @returns {Promise<Array<import('../models/Drawing.js').Drawing>>} Array de desenhos da categoria
   * @throws {AppError} Se o carregamento falhar
   */
  async loadDrawingsByCategory(categoryId) {
    if (!categoryId || typeof categoryId !== 'string') {
      const error = new AppError(
        'ID de categoria inválido',
        'INVALID_CATEGORY_ID'
      );
      errorLogger.log(error, { categoryId });
      throw error;
    }

    try {
      const allDrawings = await this.loadDrawings();
      
      const filteredDrawings = allDrawings.filter(
        drawing => drawing.category === categoryId
      );
      
      return filteredDrawings;
    } catch (error) {
      // Se já é um AppError, apenas re-lançar
      if (error instanceof AppError) {
        throw error;
      }

      // Caso contrário, encapsular
      const wrappedError = new AppError(
        `Erro ao carregar desenhos da categoria ${categoryId}`,
        'CATEGORY_LOAD_ERROR',
        error
      );
      errorLogger.log(wrappedError, { categoryId });
      throw wrappedError;
    }
  }

  /**
   * Carrega desenhos agrupados por categoria
   * @returns {Promise<Array<import('../models/Category.js').Category>>} Array de categorias com desenhos
   */
  async loadDrawingsGroupedByCategory() {
    try {
      const allDrawings = await this.loadDrawings();
      return groupDrawingsByCategory(allDrawings);
    } catch (error) {
      console.error('Erro ao carregar desenhos agrupados:', error);
      throw error;
    }
  }

  /**
   * Pré-carrega um desenho específico (para otimização)
   * @param {string} drawingId - ID do desenho
   * @returns {Promise<void>}
   */
  async preloadDrawing(drawingId) {
    if (!drawingId || typeof drawingId !== 'string') {
      console.warn('ID de desenho inválido para pré-carregamento:', drawingId);
      return;
    }

    // Verificar se já foi pré-carregado
    if (this.preloadedDrawings.has(drawingId)) {
      return;
    }

    try {
      const allDrawings = await this.loadDrawings();
      const drawing = allDrawings.find(d => d.id === drawingId);
      
      if (!drawing) {
        console.warn('Desenho não encontrado para pré-carregamento:', drawingId);
        return;
      }

      // Pré-carregar SVG e miniatura
      const promises = [
        this.preloadImage(drawing.svgUrl),
        this.preloadImage(drawing.thumbnailUrl)
      ];

      await Promise.all(promises);
      
      this.preloadedDrawings.set(drawingId, true);
    } catch (error) {
      console.error('Erro ao pré-carregar desenho:', error);
      // Não propagar erro - pré-carregamento é otimização
    }
  }

  /**
   * Pré-carrega uma imagem
   * @param {string} url - URL da imagem
   * @returns {Promise<void>}
   * @private
   */
  preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${url}`));
      
      img.src = url;
    });
  }

  /**
   * Implementa lazy loading de miniaturas usando Intersection Observer
   * @param {HTMLElement} container - Container com as miniaturas
   * @param {string} imageSelector - Seletor CSS para as imagens
   * @returns {IntersectionObserver} Observer criado
   */
  setupLazyLoading(container, imageSelector = 'img[data-src]') {
    if (!container) {
      throw new Error('Container inválido para lazy loading');
    }

    const images = container.querySelectorAll(imageSelector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px' // Começar a carregar 50px antes de entrar no viewport
    });

    images.forEach(img => observer.observe(img));
    
    return observer;
  }

  /**
   * Limpa o cache do catálogo
   */
  clearCache() {
    this.catalogCache = null;
    this.preloadedDrawings.clear();
  }
}

// Exportar instância singleton
export default new LoaderService();
