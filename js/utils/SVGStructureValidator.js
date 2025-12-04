import svgManipulator from '../services/SVGManipulator.js';

/**
 * Utilitário para validar e corrigir estrutura de arquivos SVG
 */
export class SVGStructureValidator {
  /**
   * Valida um arquivo SVG
   * @param {string} svgPath - Caminho do arquivo SVG
   * @returns {Promise<Object>} Resultado da validação
   */
  async validateFile(svgPath) {
    try {
      const svg = await svgManipulator.loadSVG(svgPath);
      return svgManipulator.validateSVGStructure(svg);
    } catch (error) {
      return {
        valid: false,
        errors: [`Erro ao carregar SVG: ${error.message}`],
        warnings: [],
        colorableAreas: [],
        decorativeElements: []
      };
    }
  }

  /**
   * Corrige IDs duplicados em um SVG
   * @param {SVGElement} svg - Elemento SVG
   * @returns {Object} Resultado da correção
   */
  fixDuplicateIds(svg) {
    const result = {
      fixed: false,
      changes: []
    };

    if (!svg || !(svg instanceof SVGElement)) {
      return result;
    }
    
    const ids = new Map();
    const elements = svg.querySelectorAll('[id^="area-"]');
    let nextId = 1;
    
    elements.forEach(element => {
      const id = element.getAttribute('id');
      
      if (ids.has(id)) {
        // ID duplicado - renomear elemento decorativo
        if (svgManipulator.isDecorativeElement(element)) {
          const newId = `decorative-${nextId++}`;
          element.setAttribute('id', newId);
          result.changes.push(`Renomeado ${id} para ${newId}`);
          result.fixed = true;
        }
      } else {
        ids.set(id, element);
      }
    });
    
    return result;
  }
}

// Exportar instância singleton
export default new SVGStructureValidator();
