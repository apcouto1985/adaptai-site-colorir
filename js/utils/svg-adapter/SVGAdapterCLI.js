/**
 * CLI Interface for SVG Adapter Tool
 * 
 * Provides command-line interface for adapting arbitrary SVG files
 * to AdaptAI coloring website format.
 */

import fs from 'fs';
import path from 'path';

/**
 * Custom error for CLI-related issues
 */
export class CLIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CLIError';
  }
}

/**
 * CLI Interface for SVG Adapter
 */
export class SVGAdapterCLI {
  /**
   * Main entry point for CLI
   * @param {string[]} args - Command line arguments
   * @returns {Promise<void>}
   */
  async run(args) {
    try {
      const options = this.parseArguments(args);
      
      if (!options.inputPath) {
        this.showUsage();
        return;
      }
      
      // Placeholder for actual adaptation logic (will be implemented in Task 9)
      const result = {
        success: true,
        outputPath: options.outputPath,
        colorableCount: 0,
        decorativeCount: 0,
        idsAssigned: 0,
        validation: null
      };
      
      this.displayResults(result);
    } catch (error) {
      this.displayError(error);
      throw error; // Re-throw for testing purposes
    }
  }

  /**
   * Parse command line arguments
   * @param {string[]} args - Arguments array
   * @returns {CLIOptions} Parsed options
   */
  parseArguments(args) {
    if (!args || args.length === 0) {
      return { inputPath: null };
    }

    const options = {
      inputPath: null,
      outputPath: null,
      interactive: false,
      validate: false
    };

    // Filter out flags to find positional arguments
    const positionalArgs = args.filter(arg => !arg.startsWith('--'));
    const flags = args.filter(arg => arg.startsWith('--'));

    // First positional argument is input path
    if (positionalArgs.length > 0) {
      options.inputPath = positionalArgs[0];
    }

    // Second positional argument is output path (optional)
    if (positionalArgs.length > 1) {
      options.outputPath = positionalArgs[1];
    } else if (options.inputPath) {
      // Generate default output path
      options.outputPath = this.generateOutputPath(options.inputPath);
    }

    // Parse flags
    options.interactive = flags.includes('--interactive');
    options.validate = flags.includes('--validate');

    return options;
  }

  /**
   * Generate default output path from input path
   * @param {string} inputPath - Input file path
   * @returns {string} Generated output path
   */
  generateOutputPath(inputPath) {
    const parsed = path.parse(inputPath);
    return path.join(parsed.dir, `${parsed.name}-adapted${parsed.ext}`);
  }

  /**
   * Display usage information
   */
  showUsage() {
    console.log(`
Uso: svg-adapter <input.svg> [output.svg] [opções]

Opções:
  --interactive    Modo interativo para revisão manual
  --validate       Executar validação automática
  --help           Exibir esta mensagem

Exemplos:
  svg-adapter drawing.svg
  svg-adapter drawing.svg adapted.svg --validate
  svg-adapter drawing.svg --interactive --validate
    `);
  }

  /**
   * Display adaptation results
   * @param {AdaptationResult} result - Adaptation result
   */
  displayResults(result) {
    if (!result.success) {
      console.log('\n❌ Adaptação falhou\n');
      return;
    }

    console.log(`
✓ SVG adaptado com sucesso!

Estatísticas:
  - Áreas coloríveis: ${result.colorableCount}
  - Elementos decorativos: ${result.decorativeCount}
  - IDs atribuídos: ${result.idsAssigned}
  - Arquivo salvo em: ${result.outputPath}
    `);

    // Display validation results if available
    if (result.validation) {
      if (result.validation.valid) {
        console.log('✓ Validação passou - SVG pronto para uso\n');
      } else {
        console.log('⚠ Validação encontrou problemas:\n');
        result.validation.errors.forEach(err => {
          console.log(`  ❌ ${err}`);
        });
        result.validation.warnings.forEach(warn => {
          console.log(`  ⚠ ${warn}`);
        });
        
        if (result.validation.suggestions && result.validation.suggestions.length > 0) {
          console.log('\n💡 Sugestões:');
          result.validation.suggestions.forEach(sug => {
            console.log(`  - ${sug}`);
          });
        }
        console.log();
      }
    }
  }

  /**
   * Display error message
   * @param {Error} error - Error object
   */
  displayError(error) {
    console.error(`\n❌ Erro: ${error.message}\n`);
    
    // Provide helpful suggestions based on error type
    if (error.message.includes('não encontrado') || error.message.includes('not found')) {
      console.error('💡 Verifique se o caminho está correto e se o arquivo existe.\n');
    } else if (error.message.includes('malformado') || error.message.includes('parsing')) {
      console.error('💡 O arquivo SVG parece estar malformado. Verifique a sintaxe XML.\n');
    } else if (error.message.includes('permissão') || error.message.includes('permission')) {
      console.error('💡 Verifique as permissões de leitura/escrita do arquivo.\n');
    }
  }
}

/**
 * @typedef {Object} CLIOptions
 * @property {string|null} inputPath - Input SVG file path
 * @property {string|null} outputPath - Output SVG file path
 * @property {boolean} interactive - Interactive mode flag
 * @property {boolean} validate - Validation flag
 */

/**
 * @typedef {Object} AdaptationResult
 * @property {boolean} success - Whether adaptation succeeded
 * @property {string} outputPath - Path to generated file
 * @property {number} colorableCount - Number of colorable areas
 * @property {number} decorativeCount - Number of decorative elements
 * @property {number} idsAssigned - Number of IDs assigned
 * @property {ValidationResult|null} validation - Validation result if executed
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether SVG is valid
 * @property {string[]} errors - Critical errors
 * @property {string[]} warnings - Non-critical warnings
 * @property {string[]} suggestions - Correction suggestions
 */
