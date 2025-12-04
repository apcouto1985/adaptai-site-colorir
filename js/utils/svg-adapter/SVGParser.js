import { readFile } from 'fs/promises';
import { JSDOM } from 'jsdom';

/**
 * Erro customizado para problemas de parsing de SVG
 */
export class SVGParseError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'SVGParseError';
    this.originalError = originalError;
  }
}

/**
 * Parser de arquivos SVG
 * Responsável por ler, fazer parsing e extrair informações de arquivos SVG
 */
export class SVGParser {
  /**
   * Faz parsing de um arquivo SVG
   * @param {string} filePath - Caminho do arquivo SVG
   * @returns {Promise<SVGDocument>} Documento SVG parseado com elementos extraídos
   * @throws {SVGParseError} Se o parsing falhar
   */
  async parse(filePath) {
    try {
      // Ler conteúdo do arquivo
      const content = await readFile(filePath, 'utf-8');
      
      // Validar conteúdo não vazio
      if (!content || content.trim().length === 0) {
        throw new SVGParseError('Arquivo SVG vazio');
      }
      
      // Criar DOM usando JSDOM para ambiente Node.js
      const dom = new JSDOM(content, { contentType: 'image/svg+xml' });
      const document = dom.window.document;
      
      // Verificar erros de parsing XML
      const parserError = document.querySelector('parsererror');
      if (parserError) {
        throw new SVGParseError(
          `Erro de parsing XML: ${parserError.textContent}`
        );
      }
      
      // Obter elemento SVG raiz
      const svgElement = document.documentElement;
      
      // Validar que é um elemento SVG
      if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
        throw new SVGParseError(
          `Documento não contém elemento SVG válido (encontrado: ${svgElement?.tagName || 'nenhum'})`
        );
      }
      
      // Extrair todos os elementos gráficos
      const elements = this.extractElements(svgElement);
      
      return {
        element: svgElement,
        elements,
        document: document
      };
      
    } catch (error) {
      // Se já é SVGParseError, re-lançar
      if (error instanceof SVGParseError) {
        throw error;
      }
      
      // Tratar erro de arquivo não encontrado
      if (error.code === 'ENOENT') {
        throw new SVGParseError(
          `Arquivo não encontrado: ${filePath}`,
          error
        );
      }
      
      // Tratar erro de permissão
      if (error.code === 'EACCES') {
        throw new SVGParseError(
          `Sem permissão para ler arquivo: ${filePath}`,
          error
        );
      }
      
      // Outros erros
      throw new SVGParseError(
        `Erro ao processar arquivo SVG: ${error.message}`,
        error
      );
    }
  }

  /**
   * Extrai todos os elementos gráficos do SVG
   * @param {SVGElement} svg - Elemento SVG raiz
   * @returns {SVGElementInfo[]} Array de informações de elementos
   */
  extractElements(svg) {
    // Elementos gráficos que podem ser coloríveis ou decorativos
    const selector = 'path, rect, circle, polygon, ellipse, line';
    const elements = Array.from(svg.querySelectorAll(selector));
    
    return elements.map(element => {
      const elementInfo = {
        element,
        tagName: element.tagName.toLowerCase(),
        id: element.getAttribute('id'),
        fill: element.getAttribute('fill'),
        stroke: element.getAttribute('stroke'),
        strokeWidth: element.getAttribute('stroke-width'),
        pointerEvents: element.getAttribute('pointer-events'),
        bounds: this.calculateBounds(element)
      };
      
      return elementInfo;
    });
  }

  /**
   * Calcula os limites (bounding box) de um elemento SVG
   * @param {Element} element - Elemento SVG
   * @returns {Bounds} Limites do elemento (x, y, width, height, area)
   */
  calculateBounds(element) {
    try {
      // Tentar usar getBBox() se disponível
      if (typeof element.getBBox === 'function') {
        const bbox = element.getBBox();
        return {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
          area: bbox.width * bbox.height
        };
      }
      
      // Fallback: calcular bounds baseado no tipo de elemento
      return this._calculateBoundsFallback(element);
      
    } catch (error) {
      // Se getBBox() falhar (comum em ambiente Node.js sem renderização),
      // retornar bounds padrão
      console.warn(`Não foi possível calcular bounds para ${element.tagName}: ${error.message}`);
      return { x: 0, y: 0, width: 0, height: 0, area: 0 };
    }
  }

  /**
   * Calcula bounds usando fallback baseado em atributos do elemento
   * @param {Element} element - Elemento SVG
   * @returns {Bounds} Limites calculados
   * @private
   */
  _calculateBoundsFallback(element) {
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
      case 'rect': {
        const x = parseFloat(element.getAttribute('x')) || 0;
        const y = parseFloat(element.getAttribute('y')) || 0;
        const width = parseFloat(element.getAttribute('width')) || 0;
        const height = parseFloat(element.getAttribute('height')) || 0;
        return { x, y, width, height, area: width * height };
      }
      
      case 'circle': {
        const cx = parseFloat(element.getAttribute('cx')) || 0;
        const cy = parseFloat(element.getAttribute('cy')) || 0;
        const r = parseFloat(element.getAttribute('r')) || 0;
        const diameter = r * 2;
        return {
          x: cx - r,
          y: cy - r,
          width: diameter,
          height: diameter,
          area: Math.PI * r * r
        };
      }
      
      case 'ellipse': {
        const cx = parseFloat(element.getAttribute('cx')) || 0;
        const cy = parseFloat(element.getAttribute('cy')) || 0;
        const rx = parseFloat(element.getAttribute('rx')) || 0;
        const ry = parseFloat(element.getAttribute('ry')) || 0;
        return {
          x: cx - rx,
          y: cy - ry,
          width: rx * 2,
          height: ry * 2,
          area: Math.PI * rx * ry
        };
      }
      
      case 'line': {
        const x1 = parseFloat(element.getAttribute('x1')) || 0;
        const y1 = parseFloat(element.getAttribute('y1')) || 0;
        const x2 = parseFloat(element.getAttribute('x2')) || 0;
        const y2 = parseFloat(element.getAttribute('y2')) || 0;
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return {
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width,
          height,
          area: width * height
        };
      }
      
      case 'polygon':
      case 'path':
      default:
        // Para path e polygon, não podemos calcular facilmente sem renderização
        // Retornar bounds padrão que não afetarão classificação
        return { x: 0, y: 0, width: 100, height: 100, area: 10000 };
    }
  }
}

/**
 * @typedef {Object} SVGDocument
 * @property {SVGElement} element - Elemento SVG raiz
 * @property {SVGElementInfo[]} elements - Array de elementos gráficos extraídos
 * @property {Document} document - Documento DOM completo
 */

/**
 * @typedef {Object} SVGElementInfo
 * @property {Element} element - Referência ao elemento DOM
 * @property {string} tagName - Nome da tag (path, rect, circle, etc)
 * @property {string|null} id - ID atual do elemento
 * @property {string|null} fill - Valor do atributo fill
 * @property {string|null} stroke - Valor do atributo stroke
 * @property {string|null} strokeWidth - Valor do atributo stroke-width
 * @property {string|null} pointerEvents - Valor do atributo pointer-events
 * @property {Bounds} bounds - Limites do elemento
 */

/**
 * @typedef {Object} Bounds
 * @property {number} x - Posição X
 * @property {number} y - Posição Y
 * @property {number} width - Largura
 * @property {number} height - Altura
 * @property {number} area - Área (width * height)
 */
