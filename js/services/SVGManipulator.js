import { createColorableArea } from '../models/ColorableArea.js';
import { DrawingLoadError, SVGParseError, errorLogger } from '../utils/errorHandling.js';

/**
 * Helper para selecionar elemento por ID de forma segura
 * @param {SVGElement} svg - Elemento SVG
 * @param {string} id - ID do elemento
 * @returns {Element|null} Elemento encontrado ou null
 */
function selectById(svg, id) {
  return svg.querySelector(`[id="${id}"]`);
}

/**
 * Serviço para manipulação de arquivos SVG
 */
export class SVGManipulator {
  /**
   * Carrega um arquivo SVG de uma URL
   * @param {string} url - URL do arquivo SVG
   * @returns {Promise<SVGElement>} Elemento SVG parseado
   * @throws {DrawingLoadError|SVGParseError} Se o carregamento ou parsing falhar
   */
  async loadSVG(url) {
    try {
      // Validar URL
      if (!url || typeof url !== 'string') {
        const error = new DrawingLoadError(url, new Error('URL inválida'));
        errorLogger.log(error, { url });
        throw error;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const error = new DrawingLoadError(
          url,
          new Error(`HTTP ${response.status}: ${response.statusText}`)
        );
        errorLogger.log(error, { url, status: response.status });
        throw error;
      }
      
      const svgText = await response.text();
      
      // Verificar se o conteúdo não está vazio
      if (!svgText || svgText.trim().length === 0) {
        const error = new SVGParseError('Conteúdo SVG vazio', null);
        errorLogger.log(error, { url });
        throw error;
      }

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      
      // Verificar erros de parsing
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        const error = new SVGParseError(
          'Erro de parsing XML',
          new Error(parserError.textContent)
        );
        errorLogger.log(error, { url });
        throw error;
      }
      
      const svgElement = svgDoc.documentElement;
      
      if (!(svgElement instanceof SVGElement)) {
        const error = new SVGParseError(
          'Documento não contém elemento SVG válido',
          null
        );
        errorLogger.log(error, { url, elementType: svgElement?.tagName });
        throw error;
      }
      
      return svgElement;
    } catch (error) {
      // Se já é um erro customizado, apenas re-lançar
      if (error instanceof DrawingLoadError || error instanceof SVGParseError) {
        throw error;
      }

      // Caso contrário, encapsular em DrawingLoadError
      const wrappedError = new DrawingLoadError(url, error);
      errorLogger.log(wrappedError, { url });
      throw wrappedError;
    }
  }

  /**
   * Identifica todas as áreas coloríveis em um SVG
   * @param {SVGElement} svg - Elemento SVG
   * @returns {Array<import('../models/ColorableArea.js').ColorableArea>} Array de áreas coloríveis
   */
  identifyColorableAreas(svg) {
    if (!svg || !(svg instanceof SVGElement)) {
      console.warn('SVG inválido fornecido para identificação de áreas');
      return [];
    }

    const areas = [];
    
    // Buscar todos os elementos com id começando com "area-"
    const elements = svg.querySelectorAll('[id^="area-"]');
    
    elements.forEach(element => {
      const area = createColorableArea(element);
      if (area) {
        areas.push(area);
      }
    });
    
    return areas;
  }

  /**
   * Aplica uma cor a uma área específica do SVG
   * @param {SVGElement} svg - Elemento SVG
   * @param {string} areaId - ID da área a ser colorida
   * @param {string} color - Cor em formato hexadecimal (ex: #FF0000)
   */
  applyColorToArea(svg, areaId, color) {
    if (!svg || !(svg instanceof SVGElement)) {
      console.warn('SVG inválido fornecido para aplicação de cor');
      return;
    }

    if (!areaId || typeof areaId !== 'string') {
      console.warn('ID de área inválido:', areaId);
      return;
    }

    if (!color || typeof color !== 'string') {
      console.warn('Cor inválida:', color);
      return;
    }

    const element = selectById(svg, areaId);
    
    if (!element) {
      console.warn('Elemento não encontrado:', areaId);
      return;
    }

    if (!areaId.startsWith('area-')) {
      console.warn('Tentativa de colorir elemento não colorível:', areaId);
      return;
    }

    element.setAttribute('fill', color);
  }

  /**
   * Remove todas as cores aplicadas ao SVG
   * @param {SVGElement} svg - Elemento SVG
   */
  clearAllColors(svg) {
    if (!svg || !(svg instanceof SVGElement)) {
      console.warn('SVG inválido fornecido para limpeza de cores');
      return;
    }

    const colorableElements = svg.querySelectorAll('[id^="area-"]');
    
    colorableElements.forEach(element => {
      element.setAttribute('fill', 'white');
    });
  }

  /**
   * Destaca ou remove destaque de uma área
   * @param {SVGElement} svg - Elemento SVG
   * @param {string} areaId - ID da área
   * @param {boolean} highlight - True para destacar, false para remover destaque
   */
  highlightArea(svg, areaId, highlight) {
    if (!svg || !(svg instanceof SVGElement)) {
      console.warn('SVG inválido fornecido para destaque');
      return;
    }

    if (!areaId || typeof areaId !== 'string') {
      console.warn('ID de área inválido:', areaId);
      return;
    }

    const element = selectById(svg, areaId);
    
    if (!element) {
      console.warn('Elemento não encontrado:', areaId);
      return;
    }

    if (highlight) {
      element.classList.add('highlighted');
      element.style.opacity = '0.7';
    } else {
      element.classList.remove('highlighted');
      element.style.opacity = '1';
    }
  }

  /**
   * Obtém a cor atual de uma área
   * @param {SVGElement} svg - Elemento SVG
   * @param {string} areaId - ID da área
   * @returns {string|null} Cor atual ou null se não colorida
   */
  getAreaColor(svg, areaId) {
    if (!svg || !(svg instanceof SVGElement)) {
      return null;
    }

    const element = selectById(svg, areaId);
    
    if (!element) {
      return null;
    }

    const fill = element.getAttribute('fill');
    
    if (!fill || fill === 'white' || fill === 'transparent') {
      return null;
    }

    return fill;
  }
}

// Exportar instância singleton
export default new SVGManipulator();
