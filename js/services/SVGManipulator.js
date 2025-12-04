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
   * Verifica se um elemento tem cor decorativa na estrutura original
   * Usado apenas para validação de SVG, não para identificação durante coloração
   * @param {Element} element - Elemento a verificar
   * @returns {boolean} True se tem cor decorativa
   * @private
   */
  _hasDecorativeColor(element) {
    if (!element) {
      return false;
    }
    
    const fill = element.getAttribute('fill');
    const decorativeColors = ['#B5B5B5', '#222221', '#000000', 'black', 'gray'];
    return fill && decorativeColors.includes(fill.toUpperCase());
  }

  /**
   * Verifica se um elemento é decorativo (não colorível)
   * Elementos decorativos são contornos, sombras ou bordas que não devem ser coloridos
   * @param {Element} element - Elemento a verificar
   * @returns {boolean} True se decorativo, false se colorível
   */
  isDecorativeElement(element) {
    if (!element) {
      return false;
    }

    // Verificar pointer-events="none"
    // Este é o único critério confiável para identificar elementos decorativos
    // pois a cor pode ser alterada pelo usuário durante a coloração
    const pointerEvents = element.getAttribute('pointer-events');
    return pointerEvents === 'none';
  }

  /**
   * Identifica todas as áreas coloríveis em um SVG
   * Filtra elementos decorativos e retorna apenas áreas coloríveis válidas
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
      // Filtrar elementos decorativos
      if (this.isDecorativeElement(element)) {
        return;
      }
      
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

    // Usar setAttribute para modificar o atributo fill do SVG
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

  /**
   * Valida a estrutura de um SVG
   * Verifica IDs únicos, áreas coloríveis e elementos decorativos
   * @param {SVGElement} svg - Elemento SVG
   * @returns {Object} Resultado da validação com erros e avisos
   * @returns {boolean} result.valid - Se o SVG é válido
   * @returns {string[]} result.errors - Erros críticos
   * @returns {string[]} result.warnings - Avisos não críticos
   * @returns {string[]} result.colorableAreas - IDs de áreas coloríveis
   * @returns {string[]} result.decorativeElements - IDs de elementos decorativos
   */
  validateSVGStructure(svg) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      colorableAreas: [],
      decorativeElements: []
    };

    if (!svg || !(svg instanceof SVGElement)) {
      result.valid = false;
      result.errors.push('SVG inválido ou não fornecido');
      return result;
    }
    
    // Verificar IDs únicos
    const ids = new Map();
    const elements = svg.querySelectorAll('[id^="area-"]');
    
    elements.forEach(element => {
      const id = element.getAttribute('id');
      
      if (ids.has(id)) {
        result.errors.push(`ID duplicado encontrado: ${id}`);
        result.valid = false;
      } else {
        ids.set(id, element);
      }
      
      // Classificar elemento
      // Na validação, consideramos decorativo se tem pointer-events="none" OU cor decorativa
      const hasPointerEventsNone = this.isDecorativeElement(element);
      const hasDecorativeColor = this._hasDecorativeColor(element);
      
      if (hasPointerEventsNone || hasDecorativeColor) {
        result.decorativeElements.push(id);
        
        // Verificar se elemento decorativo tem pointer-events="none"
        if (!hasPointerEventsNone) {
          result.warnings.push(`Elemento decorativo ${id} não possui pointer-events="none"`);
        }
      } else {
        result.colorableAreas.push(id);
      }
    });
    
    // Verificar se há áreas coloríveis
    if (result.colorableAreas.length === 0) {
      result.warnings.push('Nenhuma área colorível encontrada');
    }
    
    return result;
  }
}

// Exportar instância singleton
export default new SVGManipulator();
