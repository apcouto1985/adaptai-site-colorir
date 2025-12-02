/**
 * Utilitários para tratamento de erros
 */

/**
 * Classe base para erros customizados da aplicação
 */
export class AppError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Erro de carregamento de desenho
 */
export class DrawingLoadError extends AppError {
  constructor(url, originalError) {
    super(
      `Falha ao carregar desenho: ${url}`,
      'DRAWING_LOAD_ERROR',
      originalError
    );
    this.url = url;
  }
}

/**
 * Erro de parsing de SVG
 */
export class SVGParseError extends AppError {
  constructor(message, originalError) {
    super(
      `Erro ao processar SVG: ${message}`,
      'SVG_PARSE_ERROR',
      originalError
    );
  }
}

/**
 * Erro de área não colorível
 */
export class InvalidAreaError extends AppError {
  constructor(areaId) {
    super(
      `Área não colorível ou inválida: ${areaId}`,
      'INVALID_AREA_ERROR'
    );
    this.areaId = areaId;
  }
}

/**
 * Erro de compatibilidade do navegador
 */
export class BrowserCompatibilityError extends AppError {
  constructor(feature, issues) {
    super(
      `Navegador não suporta funcionalidades necessárias: ${issues.join(', ')}`,
      'BROWSER_COMPATIBILITY_ERROR'
    );
    this.feature = feature;
    this.issues = issues;
  }
}

/**
 * Logger centralizado de erros
 */
export class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Limitar histórico
  }

  /**
   * Registra um erro
   * @param {Error} error - Erro a ser registrado
   * @param {Object} context - Contexto adicional
   */
  log(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      name: error.name,
      code: error.code || 'UNKNOWN',
      stack: error.stack,
      context,
      originalError: error.originalError
    };

    this.errors.push(errorEntry);

    // Limitar tamanho do histórico
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log no console
    console.error('[ErrorLogger]', {
      error: errorEntry,
      context
    });

    return errorEntry;
  }

  /**
   * Retorna todos os erros registrados
   * @returns {Array} Array de erros
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Limpa o histórico de erros
   */
  clear() {
    this.errors = [];
  }

  /**
   * Retorna erros filtrados por código
   * @param {string} code - Código do erro
   * @returns {Array} Array de erros filtrados
   */
  getErrorsByCode(code) {
    return this.errors.filter(e => e.code === code);
  }
}

// Instância singleton do logger
export const errorLogger = new ErrorLogger();

/**
 * Wrapper para executar funções com tratamento de erro
 * @param {Function} fn - Função a ser executada
 * @param {Object} options - Opções
 * @param {Function} options.onError - Callback de erro
 * @param {Object} options.context - Contexto adicional
 * @returns {Promise<any>} Resultado da função ou erro
 */
export async function withErrorHandling(fn, options = {}) {
  const { onError, context = {} } = options;

  try {
    return await fn();
  } catch (error) {
    // Registrar erro
    errorLogger.log(error, context);

    // Chamar callback se fornecido
    if (onError && typeof onError === 'function') {
      onError(error);
    }

    // Re-lançar erro
    throw error;
  }
}

/**
 * Cria um placeholder visual para erro
 * @param {string} message - Mensagem de erro
 * @param {Object} options - Opções de customização
 * @returns {HTMLElement} Elemento de erro
 */
export function createErrorPlaceholder(message, options = {}) {
  const {
    showRetry = false,
    onRetry = null,
    icon = '⚠️',
    className = 'error-placeholder'
  } = options;

  const container = document.createElement('div');
  container.className = className;
  container.setAttribute('role', 'alert');
  container.setAttribute('aria-live', 'assertive');

  // Ícone
  const iconElement = document.createElement('div');
  iconElement.className = 'error-icon';
  iconElement.textContent = icon;
  iconElement.style.fontSize = '48px';
  iconElement.style.marginBottom = '16px';
  container.appendChild(iconElement);

  // Mensagem
  const messageElement = document.createElement('p');
  messageElement.className = 'error-message';
  messageElement.textContent = message;
  messageElement.style.fontSize = '16px';
  messageElement.style.color = '#666';
  messageElement.style.marginBottom = '16px';
  container.appendChild(messageElement);

  // Botão de retry (opcional)
  if (showRetry && onRetry) {
    const retryButton = document.createElement('button');
    retryButton.className = 'retry-button';
    retryButton.textContent = 'Tentar novamente';
    retryButton.setAttribute('type', 'button');
    retryButton.setAttribute('aria-label', 'Tentar carregar novamente');
    retryButton.style.minWidth = '44px';
    retryButton.style.minHeight = '44px';
    retryButton.style.padding = '12px 24px';
    retryButton.style.fontSize = '16px';
    retryButton.style.cursor = 'pointer';
    
    retryButton.addEventListener('click', onRetry);
    
    container.appendChild(retryButton);
  }

  return container;
}

/**
 * Cria um placeholder visual para loading
 * @param {string} message - Mensagem de loading
 * @returns {HTMLElement} Elemento de loading
 */
export function createLoadingPlaceholder(message = 'Carregando...') {
  const container = document.createElement('div');
  container.className = 'loading-placeholder';
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-label', message);

  // Spinner
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.style.width = '48px';
  spinner.style.height = '48px';
  spinner.style.border = '4px solid #f3f3f3';
  spinner.style.borderTop = '4px solid #3498db';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';
  spinner.style.marginBottom = '16px';
  container.appendChild(spinner);

  // Mensagem
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageElement.style.fontSize = '16px';
  messageElement.style.color = '#666';
  container.appendChild(messageElement);

  return container;
}
