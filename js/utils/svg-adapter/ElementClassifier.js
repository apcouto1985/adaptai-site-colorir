/**
 * Classificador de elementos SVG
 * Responsável por analisar elementos e classificá-los como coloríveis ou decorativos
 * baseado em heurísticas definidas
 */
export class ElementClassifier {
  /**
   * Classifica elementos como coloríveis ou decorativos
   * @param {SVGElementInfo[]} elements - Elementos a classificar
   * @returns {ClassificationResult} Resultado da classificação
   */
  classify(elements) {
    const colorable = [];
    const decorative = [];
    
    elements.forEach(elementInfo => {
      const classification = this.classifyElement(elementInfo);
      
      if (classification === 'colorable') {
        colorable.push(elementInfo);
      } else {
        decorative.push(elementInfo);
      }
    });
    
    return { colorable, decorative };
  }

  /**
   * Classifica um único elemento baseado em heurísticas
   * @param {SVGElementInfo} elementInfo - Informações do elemento
   * @returns {'colorable'|'decorative'} Classificação
   */
  classifyElement(elementInfo) {
    // Heurística 1: fill="none" e stroke definido → colorível
    if (elementInfo.fill === 'none' && elementInfo.stroke) {
      return 'colorable';
    }
    
    // Heurística 2: Área pequena (< 100px²) → decorativo
    if (elementInfo.bounds.area < 100) {
      return 'decorative';
    }
    
    // Heurística 3: Cores decorativas → decorativo
    const decorativeColors = [
      '#000000', '#222221', '#B5B5B5', '#FFFFFF',
      'black', 'white', 'gray', 'grey'
    ];
    
    if (elementInfo.fill) {
      const fillUpper = elementInfo.fill.toUpperCase();
      const isDecorativeColor = decorativeColors.some(
        color => fillUpper === color.toUpperCase()
      );
      
      if (isDecorativeColor) {
        return 'decorative';
      }
    }
    
    // Heurística 4: fill com cor e stroke → decorativo
    if (elementInfo.fill && 
        elementInfo.fill !== 'none' && 
        elementInfo.stroke) {
      return 'decorative';
    }
    
    // Padrão: colorível
    return 'colorable';
  }

  /**
   * Gera relatório de classificação para revisão
   * @param {ClassificationResult} result - Resultado da classificação
   * @returns {string} Relatório formatado
   */
  generateReport(result) {
    let report = '\n=== Relatório de Classificação ===\n\n';
    
    report += `Áreas Coloríveis (${result.colorable.length}):\n`;
    result.colorable.forEach((el, i) => {
      const dimensions = `${el.bounds.width.toFixed(1)}x${el.bounds.height.toFixed(1)}px`;
      const area = `(${el.bounds.area.toFixed(1)}px²)`;
      const fill = el.fill ? `fill="${el.fill}"` : 'sem fill';
      const stroke = el.stroke ? `stroke="${el.stroke}"` : 'sem stroke';
      
      report += `  ${i + 1}. <${el.tagName}> - ${dimensions} ${area}\n`;
      report += `     ${fill}, ${stroke}\n`;
    });
    
    report += `\nElementos Decorativos (${result.decorative.length}):\n`;
    result.decorative.forEach((el, i) => {
      const dimensions = `${el.bounds.width.toFixed(1)}x${el.bounds.height.toFixed(1)}px`;
      const area = `(${el.bounds.area.toFixed(1)}px²)`;
      const fill = el.fill ? `fill="${el.fill}"` : 'sem fill';
      const stroke = el.stroke ? `stroke="${el.stroke}"` : 'sem stroke';
      
      report += `  ${i + 1}. <${el.tagName}> - ${dimensions} ${area}\n`;
      report += `     ${fill}, ${stroke}\n`;
    });
    
    report += '\n';
    return report;
  }
}

/**
 * @typedef {Object} ClassificationResult
 * @property {SVGElementInfo[]} colorable - Elementos classificados como coloríveis
 * @property {SVGElementInfo[]} decorative - Elementos classificados como decorativos
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
