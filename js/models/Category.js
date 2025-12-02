/**
 * @typedef {Object} Category
 * @property {string} id - Identificador único da categoria
 * @property {string} name - Nome da categoria
 * @property {import('./Drawing.js').Drawing[]} drawings - Desenhos da categoria
 */

/**
 * Cria um objeto Category
 * @param {string} id - ID da categoria
 * @param {string} name - Nome da categoria
 * @param {import('./Drawing.js').Drawing[]} drawings - Array de desenhos
 * @returns {Category} Objeto Category
 */
export function createCategory(id, name, drawings = []) {
  return {
    id,
    name,
    drawings
  };
}

/**
 * Agrupa desenhos por categoria
 * @param {import('./Drawing.js').Drawing[]} drawings - Array de desenhos
 * @returns {Category[]} Array de categorias com desenhos agrupados
 */
export function groupDrawingsByCategory(drawings) {
  const categoryMap = new Map();

  drawings.forEach(drawing => {
    const categoryId = drawing.category;
    
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, createCategory(
        categoryId,
        capitalizeCategory(categoryId),
        []
      ));
    }
    
    categoryMap.get(categoryId).drawings.push(drawing);
  });

  return Array.from(categoryMap.values());
}

/**
 * Capitaliza o nome da categoria para exibição
 * @param {string} category - Nome da categoria
 * @returns {string} Nome capitalizado
 */
function capitalizeCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
