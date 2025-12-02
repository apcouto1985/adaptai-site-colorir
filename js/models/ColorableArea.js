/**
 * @typedef {Object} ColorableArea
 * @property {string} id - Identificador único da área
 * @property {SVGElement} element - Elemento SVG correspondente
 * @property {DOMRect} bounds - Limites da área
 * @property {string|null} currentColor - Cor atual (null se não colorida)
 */

/**
 * Cria um objeto ColorableArea a partir de um elemento SVG
 * @param {SVGElement} element - Elemento SVG
 * @returns {ColorableArea|null} Objeto ColorableArea ou null se inválido
 */
export function createColorableArea(element) {
  if (!element || !(element instanceof SVGElement)) {
    return null;
  }

  const id = element.getAttribute('id');
  if (!id || !id.startsWith('area-')) {
    return null;
  }

  const bounds = element.getBoundingClientRect();
  const currentColor = element.getAttribute('fill') || null;

  return {
    id,
    element,
    bounds,
    currentColor: currentColor === 'white' || currentColor === 'transparent' ? null : currentColor
  };
}

/**
 * Valida se um ID de área é válido
 * @param {string} areaId - ID da área a ser validado
 * @returns {boolean} True se válido, false caso contrário
 */
export function isValidAreaId(areaId) {
  if (typeof areaId !== 'string') {
    return false;
  }
  
  // Deve começar com "area-" seguido de um número
  const pattern = /^area-\d+$/;
  return pattern.test(areaId);
}
