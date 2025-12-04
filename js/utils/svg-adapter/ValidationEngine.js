import svgManipulator from '../../services/SVGManipulator.js';

/**
 * Motor de validação de SVG adaptado
 * Integra com SVGStructureValidator existente para validar SVGs transformados
 */
export class ValidationEngine {
  /**
   * Valida um SVG adaptado
   * @param {SVGElement} svg - Elemento SVG a validar
   * @returns {ValidationResult} Resultado da validação
   */
  validate(svg) {
    const result = svgManipulator.validateSVGStructure(svg);
    
    return {
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      colorableAreas: result.colorableAreas,
      decorativeElements: result.decorativeElements,
      suggestions: this.generateSuggestions(result)
    };
  }

  /**
   * Gera sugestões de correção baseadas no resultado da validação
   * @param {Object} validationResult - Resultado da validação do SVGManipulator
   * @returns {string[]} Array de sugestões
   */
  generateSuggestions(validationResult) {
    const suggestions = [];
    
    if (validationResult.errors.length > 0) {
      suggestions.push('Corrija os erros antes de usar o SVG');
      
      // Sugestões específicas para IDs duplicados
      const hasDuplicateIds = validationResult.errors.some(err => 
        err.includes('ID duplicado')
      );
      if (hasDuplicateIds) {
        suggestions.push('Execute novamente a transformação para garantir IDs únicos');
      }
    }
    
    if (validationResult.colorableAreas.length === 0) {
      suggestions.push('Nenhuma área colorível encontrada - verifique a classificação');
      suggestions.push('Considere reclassificar elementos manualmente no modo interativo');
    }
    
    if (validationResult.warnings.length > 0) {
      suggestions.push('Revise os avisos para garantir qualidade');
      
      // Sugestões específicas para elementos decorativos sem pointer-events
      const hasPointerEventsWarning = validationResult.warnings.some(warn =>
        warn.includes('pointer-events="none"')
      );
      if (hasPointerEventsWarning) {
        suggestions.push('Adicione pointer-events="none" aos elementos decorativos');
      }
    }
    
    return suggestions;
  }
}

export default new ValidationEngine();
