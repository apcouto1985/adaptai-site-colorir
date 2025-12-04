import { writeFile } from 'fs/promises';

/**
 * Erro customizado para problemas de geração de SVG
 */
export class SVGGenerationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'SVGGenerationError';
    this.originalError = originalError;
  }
}

/**
 * Gerador de arquivos SVG
 * Responsável por serializar e salvar SVGs transformados
 */
export class SVGGenerator {
  /**
   * Serializa e salva um SVG
   * @param {SVGElement} svg - Elemento SVG a serializar
   * @param {string} outputPath - Caminho de saída
   * @param {Object} transformResult - Resultado da transformação com stats
   * @returns {Promise<GenerationResult>} Resultado da geração
   * @throws {SVGGenerationError} Se a geração falhar
   */
  async generate(svg, outputPath, transformResult = {}) {
    try {
      // Serializar SVG para string XML
      const svgString = this._serializeSVG(svg);
      
      // Adicionar declaração XML se não existir
      let finalSVG = svgString;
      if (!svgString.trim().startsWith('<?xml')) {
        finalSVG = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      }
      
      // Formatar XML com indentação
      const formatted = this.formatXML(finalSVG);
      
      // Salvar arquivo
      await writeFile(outputPath, formatted, 'utf-8');
      
      // Extrair stats do transformResult
      const stats = transformResult.stats || {};
      
      return {
        success: true,
        outputPath,
        stats: {
          colorableAreas: transformResult.colorableCount || 0,
          decorativeElements: transformResult.decorativeCount || 0,
          idsAssigned: stats.idsAssigned || 0,
          strokesAdjusted: stats.strokesAdjusted || 0,
          fillsCleared: stats.fillsCleared || 0,
          pointerEventsAdded: stats.pointerEventsAdded || 0
        }
      };
      
    } catch (error) {
      // Se já é SVGGenerationError, re-lançar
      if (error instanceof SVGGenerationError) {
        throw error;
      }
      
      // Tratar erro de permissão
      if (error.code === 'EACCES') {
        throw new SVGGenerationError(
          `Sem permissão para escrever arquivo: ${outputPath}`,
          error
        );
      }
      
      // Tratar erro de diretório não encontrado
      if (error.code === 'ENOENT') {
        throw new SVGGenerationError(
          `Diretório não encontrado: ${outputPath}`,
          error
        );
      }
      
      // Outros erros
      throw new SVGGenerationError(
        `Erro ao gerar arquivo SVG: ${error.message}`,
        error
      );
    }
  }

  /**
   * Serializa um elemento SVG para string XML
   * @param {SVGElement} svg - Elemento SVG
   * @returns {string} String XML
   * @private
   */
  _serializeSVG(svg) {
    // Obter o documento do elemento
    const doc = svg.ownerDocument;
    
    // Criar serializer
    const serializer = new doc.defaultView.XMLSerializer();
    
    // Serializar elemento SVG
    let svgString = serializer.serializeToString(svg);
    
    // Garantir que namespace SVG está presente
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace(
        '<svg',
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
    
    return svgString;
  }

  /**
   * Formata XML com indentação legível
   * @param {string} xml - XML não formatado
   * @returns {string} XML formatado
   */
  formatXML(xml) {
    // Remover espaços em branco extras entre tags
    let formatted = xml.replace(/>\s+</g, '><');
    
    // Adicionar quebras de linha entre tags
    formatted = formatted.replace(/></g, '>\n<');
    
    // Aplicar indentação
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentedLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      
      // Pular linhas vazias
      if (!trimmed) continue;
      
      // Calcular indentação para esta linha
      const isClosingTag = trimmed.startsWith('</');
      const isSelfClosing = trimmed.endsWith('/>') || trimmed.startsWith('<?');
      
      // Diminuir indentação antes de tag de fechamento
      if (isClosingTag) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Adicionar linha com indentação
      indentedLines.push('  '.repeat(indentLevel) + trimmed);
      
      // Aumentar indentação após tag de abertura (exceto self-closing)
      if (!isClosingTag && !isSelfClosing && !trimmed.includes('</')) {
        indentLevel++;
      }
    }
    
    return indentedLines.join('\n');
  }
}

/**
 * @typedef {Object} GenerationResult
 * @property {boolean} success - Se a geração foi bem-sucedida
 * @property {string} outputPath - Caminho do arquivo gerado
 * @property {Object} stats - Estatísticas de transformação
 * @property {number} stats.colorableAreas - Número de áreas coloríveis
 * @property {number} stats.decorativeElements - Número de elementos decorativos
 * @property {number} stats.idsAssigned - Número de IDs atribuídos
 * @property {number} stats.strokesAdjusted - Número de strokes ajustados
 * @property {number} stats.fillsCleared - Número de fills limpos
 * @property {number} stats.pointerEventsAdded - Número de pointer-events adicionados
 */
