/**
 * Motor de validação de SVG adaptado
 * Valida SVGs transformados sem depender de APIs do browser
 */
export class ValidationEngine {
  /**
   * Valida um SVG adaptado
   * @param {Element} svg - Elemento SVG a validar
   * @returns {ValidationResult} Resultado da validação
   */
  validate(svg) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      colorableAreas: [],
      decorativeElements: []
    };

    if (!svg || svg.tagName.toLowerCase() !== 'svg') {
      result.valid = false;
      result.errors.push('SVG inválido ou não fornecido');
      return { ...result, suggestions: this.generateSuggestions(result) };
    }

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

      const pointerEvents = element.getAttribute('pointer-events');
      if (pointerEvents === 'none') {
        result.decorativeElements.push(id);
      } else {
        result.colorableAreas.push(id);
      }
    });

    if (result.colorableAreas.length === 0) {
      result.warnings.push('Nenhuma área colorível encontrada');
    }

    return { ...result, suggestions: this.generateSuggestions(result) };
  }

  /**
   * Gera sugestões de correção baseadas no resultado da validação
   * @param {Object} validationResult - Resultado da validação
   * @returns {string[]} Array de sugestões
   */
  generateSuggestions(validationResult) {
    const suggestions = [];

    if (validationResult.errors.length > 0) {
      suggestions.push('Corrija os erros antes de usar o SVG');
      if (validationResult.errors.some(err => err.includes('ID duplicado'))) {
        suggestions.push('Execute novamente a transformação para garantir IDs únicos');
      }
    }

    if (validationResult.colorableAreas.length === 0) {
      suggestions.push('Nenhuma área colorível encontrada - verifique a classificação');
      suggestions.push('Considere reclassificar elementos manualmente no modo interativo');
    }

    if (validationResult.warnings.length > 0) {
      suggestions.push('Revise os avisos para garantir qualidade');
      if (validationResult.warnings.some(w => w.includes('pointer-events="none"'))) {
        suggestions.push('Adicione pointer-events="none" aos elementos decorativos');
      }
    }

    return suggestions;
  }
}

export default new ValidationEngine();
