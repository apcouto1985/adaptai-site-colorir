/**
 * Utilitários para verificação de compatibilidade do navegador
 */

import { BrowserCompatibilityError, errorLogger } from './errorHandling.js';

/**
 * Resultado da verificação de compatibilidade
 * @typedef {Object} CompatibilityResult
 * @property {boolean} compatible - Se o navegador é compatível
 * @property {string[]} issues - Lista de problemas encontrados
 * @property {Object} features - Mapa de funcionalidades e seu suporte
 */

/**
 * Verifica suporte a SVG
 * @returns {boolean} True se SVG é suportado
 */
function checkSVGSupport() {
  return !!(
    document.implementation &&
    document.implementation.hasFeature &&
    document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')
  );
}

/**
 * Verifica suporte a eventos touch
 * @returns {boolean} True se touch é suportado
 */
function checkTouchSupport() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Verifica suporte a Intersection Observer
 * @returns {boolean} True se Intersection Observer é suportado
 */
function checkIntersectionObserverSupport() {
  return 'IntersectionObserver' in window;
}

/**
 * Verifica suporte a Fetch API
 * @returns {boolean} True se Fetch é suportado
 */
function checkFetchSupport() {
  return 'fetch' in window;
}

/**
 * Verifica suporte a DOMParser
 * @returns {boolean} True se DOMParser é suportado
 */
function checkDOMParserSupport() {
  return 'DOMParser' in window;
}

/**
 * Verifica suporte a CSS Grid
 * @returns {boolean} True se CSS Grid é suportado
 */
function checkCSSGridSupport() {
  return CSS && CSS.supports && CSS.supports('display', 'grid');
}

/**
 * Verifica suporte a CSS Flexbox
 * @returns {boolean} True se Flexbox é suportado
 */
function checkFlexboxSupport() {
  return CSS && CSS.supports && CSS.supports('display', 'flex');
}

/**
 * Verifica suporte a localStorage
 * @returns {boolean} True se localStorage é suportado
 */
function checkLocalStorageSupport() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Verifica compatibilidade completa do navegador
 * @returns {CompatibilityResult} Resultado da verificação
 */
export function checkBrowserCompatibility() {
  const features = {
    svg: checkSVGSupport(),
    touch: checkTouchSupport(),
    intersectionObserver: checkIntersectionObserverSupport(),
    fetch: checkFetchSupport(),
    domParser: checkDOMParserSupport(),
    cssGrid: checkCSSGridSupport(),
    flexbox: checkFlexboxSupport(),
    localStorage: checkLocalStorageSupport()
  };

  const issues = [];

  // Funcionalidades críticas (obrigatórias)
  if (!features.svg) {
    issues.push('SVG não suportado');
  }

  if (!features.fetch) {
    issues.push('Fetch API não suportada');
  }

  if (!features.domParser) {
    issues.push('DOMParser não suportado');
  }

  if (!features.cssGrid && !features.flexbox) {
    issues.push('CSS Grid e Flexbox não suportados');
  }

  // Funcionalidades opcionais (avisos)
  const warnings = [];

  if (!features.touch) {
    warnings.push('Eventos touch não detectados (dispositivo não-touch)');
  }

  if (!features.intersectionObserver) {
    warnings.push('Intersection Observer não suportado (lazy loading desabilitado)');
  }

  if (!features.localStorage) {
    warnings.push('localStorage não disponível (persistência desabilitada)');
  }

  // Log de avisos
  if (warnings.length > 0) {
    console.info('[BrowserCompatibility] Avisos:', warnings);
  }

  const compatible = issues.length === 0;

  // Log de erros se incompatível
  if (!compatible) {
    const error = new BrowserCompatibilityError('navegador', issues);
    errorLogger.log(error, { features });
  }

  return {
    compatible,
    issues,
    warnings,
    features
  };
}

/**
 * Exibe mensagem de incompatibilidade para o usuário
 * @param {CompatibilityResult} result - Resultado da verificação
 * @param {HTMLElement} container - Container onde exibir a mensagem
 */
export function showIncompatibilityMessage(result, container) {
  if (!container) {
    console.error('Container inválido para mensagem de incompatibilidade');
    return;
  }

  container.innerHTML = '';

  const messageDiv = document.createElement('div');
  messageDiv.className = 'compatibility-error';
  messageDiv.setAttribute('role', 'alert');
  messageDiv.setAttribute('aria-live', 'assertive');
  messageDiv.style.padding = '32px';
  messageDiv.style.textAlign = 'center';
  messageDiv.style.maxWidth = '600px';
  messageDiv.style.margin = '0 auto';

  // Ícone
  const icon = document.createElement('div');
  icon.textContent = '⚠️';
  icon.style.fontSize = '64px';
  icon.style.marginBottom = '24px';
  messageDiv.appendChild(icon);

  // Título
  const title = document.createElement('h1');
  title.textContent = 'Navegador Incompatível';
  title.style.fontSize = '24px';
  title.style.marginBottom = '16px';
  title.style.color = '#333';
  messageDiv.appendChild(title);

  // Descrição
  const description = document.createElement('p');
  description.textContent = 'Seu navegador não suporta algumas funcionalidades necessárias para usar este site.';
  description.style.fontSize = '16px';
  description.style.marginBottom = '24px';
  description.style.color = '#666';
  messageDiv.appendChild(description);

  // Lista de problemas
  if (result.issues.length > 0) {
    const issuesList = document.createElement('ul');
    issuesList.style.textAlign = 'left';
    issuesList.style.marginBottom = '24px';
    issuesList.style.fontSize = '16px';
    issuesList.style.color = '#666';

    result.issues.forEach(issue => {
      const li = document.createElement('li');
      li.textContent = issue;
      li.style.marginBottom = '8px';
      issuesList.appendChild(li);
    });

    messageDiv.appendChild(issuesList);
  }

  // Recomendações
  const recommendations = document.createElement('div');
  recommendations.style.marginTop = '24px';
  recommendations.style.padding = '16px';
  recommendations.style.backgroundColor = '#f8f9fa';
  recommendations.style.borderRadius = '8px';

  const recTitle = document.createElement('h2');
  recTitle.textContent = 'Navegadores Recomendados:';
  recTitle.style.fontSize = '18px';
  recTitle.style.marginBottom = '12px';
  recTitle.style.color = '#333';
  recommendations.appendChild(recTitle);

  const browserList = document.createElement('ul');
  browserList.style.listStyle = 'none';
  browserList.style.padding = '0';
  browserList.style.fontSize = '16px';
  browserList.style.color = '#666';

  const browsers = [
    'Google Chrome (versão 90 ou superior)',
    'Mozilla Firefox (versão 88 ou superior)',
    'Safari (versão 14 ou superior)',
    'Microsoft Edge (versão 90 ou superior)'
  ];

  browsers.forEach(browser => {
    const li = document.createElement('li');
    li.textContent = `• ${browser}`;
    li.style.marginBottom = '8px';
    browserList.appendChild(li);
  });

  recommendations.appendChild(browserList);
  messageDiv.appendChild(recommendations);

  container.appendChild(messageDiv);
}

/**
 * Inicializa verificação de compatibilidade e exibe mensagem se necessário
 * @param {HTMLElement} container - Container da aplicação
 * @returns {CompatibilityResult} Resultado da verificação
 */
export function initCompatibilityCheck(container) {
  const result = checkBrowserCompatibility();

  if (!result.compatible) {
    showIncompatibilityMessage(result, container);
  }

  return result;
}

export default {
  checkBrowserCompatibility,
  showIncompatibilityMessage,
  initCompatibilityCheck
};
