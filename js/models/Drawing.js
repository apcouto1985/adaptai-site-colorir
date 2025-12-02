/**
 * @typedef {Object} DrawingMetadata
 * @property {number} width - Largura original do desenho
 * @property {number} height - Altura original do desenho
 * @property {number} areaCount - Número de áreas coloríveis
 */

/**
 * @typedef {Object} Drawing
 * @property {string} id - Identificador único do desenho
 * @property {string} name - Nome do desenho
 * @property {string} category - Categoria do desenho
 * @property {string} thumbnailUrl - URL da miniatura
 * @property {string} svgUrl - URL do arquivo SVG
 * @property {DrawingMetadata} metadata - Metadados do desenho
 */

/**
 * Valida se um objeto Drawing possui todos os campos obrigatórios
 * @param {any} drawing - Objeto a ser validado
 * @returns {boolean} True se válido, false caso contrário
 */
export function isValidDrawing(drawing) {
  if (!drawing || typeof drawing !== 'object') {
    return false;
  }

  const requiredFields = ['id', 'name', 'category', 'thumbnailUrl', 'svgUrl', 'metadata'];
  const hasAllFields = requiredFields.every(field => field in drawing);
  
  if (!hasAllFields) {
    return false;
  }

  // Validar tipos
  if (typeof drawing.id !== 'string' || drawing.id.trim() === '') {
    return false;
  }
  
  if (typeof drawing.name !== 'string' || drawing.name.trim() === '') {
    return false;
  }
  
  if (typeof drawing.category !== 'string' || drawing.category.trim() === '') {
    return false;
  }
  
  if (typeof drawing.thumbnailUrl !== 'string' || drawing.thumbnailUrl.trim() === '') {
    return false;
  }
  
  if (typeof drawing.svgUrl !== 'string' || drawing.svgUrl.trim() === '') {
    return false;
  }

  // Validar metadata
  if (!drawing.metadata || typeof drawing.metadata !== 'object') {
    return false;
  }

  const { width, height, areaCount } = drawing.metadata;
  
  if (typeof width !== 'number' || width <= 0) {
    return false;
  }
  
  if (typeof height !== 'number' || height <= 0) {
    return false;
  }
  
  if (typeof areaCount !== 'number' || areaCount < 0 || !Number.isInteger(areaCount)) {
    return false;
  }

  return true;
}

/**
 * Valida se uma categoria é válida
 * @param {string} category - Categoria a ser validada
 * @returns {boolean} True se válida, false caso contrário
 */
export function isValidCategory(category) {
  const validCategories = [
    'carros', 'esportes', 'paisagens', 'locais', 'comidas',
    'insetos', 'animais', 'bandeiras', 'castelos', 'piratas',
    'sereias', 'princesas', 'monstros', 'ocupações', 'dinossauros'
  ];
  
  return validCategories.includes(category);
}
