/**
 * Motor de transformação de SVG
 * Responsável por aplicar transformações em elementos classificados
 * para torná-los compatíveis com o sistema AdaptAI
 */
export class TransformEngine {
  /**
   * Aplica todas as transformações necessárias
   * @param {SVGElement} svgElement - Elemento SVG raiz
   * @param {ClassificationResult} classification - Classificação de elementos
   * @returns {TransformResult} Resultado das transformações
   */
  transform(svgElement, classification) {
    const stats = {
      idsAssigned: 0,
      strokesAdjusted: 0,
      fillsCleared: 0,
      pointerEventsAdded: 0
    };
    
    // Transformar áreas coloríveis
    classification.colorable.forEach((elementInfo, index) => {
      this.transformColorableArea(elementInfo.element, index + 1, stats);
    });
    
    // Transformar elementos decorativos
    classification.decorative.forEach(elementInfo => {
      this.transformDecorativeElement(elementInfo.element, stats);
    });
    
    return {
      svg: svgElement,
      stats,
      colorableCount: classification.colorable.length,
      decorativeCount: classification.decorative.length
    };
  }

  /**
   * Transforma uma área colorível
   * @param {Element} element - Elemento a transformar
   * @param {number} index - Índice para ID (começando em 1)
   * @param {Object} stats - Estatísticas
   */
  transformColorableArea(element, index, stats) {
    // Atribuir ID único no formato "area-N"
    const newId = `area-${index}`;
    element.setAttribute('id', newId);
    stats.idsAssigned++;
    
    // Definir fill="none"
    if (element.getAttribute('fill') !== 'none') {
      element.setAttribute('fill', 'none');
      stats.fillsCleared++;
    }
    
    // Ajustar stroke-width para mínimo 2px
    const strokeWidth = parseFloat(element.getAttribute('stroke-width')) || 0;
    if (strokeWidth < 2) {
      element.setAttribute('stroke-width', '2');
      stats.strokesAdjusted++;
    }
    
    // Remover pointer-events se existir
    if (element.hasAttribute('pointer-events')) {
      element.removeAttribute('pointer-events');
    }
  }

  /**
   * Transforma um elemento decorativo
   * @param {Element} element - Elemento a transformar
   * @param {Object} stats - Estatísticas
   */
  transformDecorativeElement(element, stats) {
    // Adicionar pointer-events="none"
    element.setAttribute('pointer-events', 'none');
    stats.pointerEventsAdded++;
    
    // Preservar fill original (não modificar)
    // Preservar stroke original (não modificar)
    // Não atribuir ID no formato area-N
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
 * @typedef {Object} TransformResult
 * @property {SVGElement} svg - SVG transformado
 * @property {Object} stats - Estatísticas de transformações
 * @property {number} stats.idsAssigned - Número de IDs atribuídos
 * @property {number} stats.strokesAdjusted - Número de strokes ajustados
 * @property {number} stats.fillsCleared - Número de fills limpos
 * @property {number} stats.pointerEventsAdded - Número de pointer-events adicionados
 * @property {number} colorableCount - Total de áreas coloríveis
 * @property {number} decorativeCount - Total de elementos decorativos
 */
