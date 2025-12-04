/**
 * Unit Tests for SVGAdapterCLI
 * 
 * Tests specific examples, edge cases, and error conditions
 * for CLI argument parsing and display functionality.
 */

import { SVGAdapterCLI } from '../SVGAdapterCLI.js';
import path from 'path';

describe('SVGAdapterCLI - Unit Tests', () => {
  let cli;
  let consoleLogSpy;
  let consoleErrorSpy;
  let originalLog;
  let originalError;

  beforeEach(() => {
    cli = new SVGAdapterCLI();
    originalLog = console.log;
    originalError = console.error;
    consoleLogSpy = { calls: [] };
    consoleErrorSpy = { calls: [] };
    console.log = (...args) => consoleLogSpy.calls.push(args);
    console.error = (...args) => consoleErrorSpy.calls.push(args);
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  describe('parseArguments', () => {
    it('parses single input path', () => {
      const options = cli.parseArguments(['drawing.svg']);
      
      expect(options.inputPath).toBe('drawing.svg');
      expect(options.outputPath).toBe('drawing-adapted.svg');
      expect(options.interactive).toBe(false);
      expect(options.validate).toBe(false);
    });

    it('parses input and output paths', () => {
      const options = cli.parseArguments(['input.svg', 'output.svg']);
      
      expect(options.inputPath).toBe('input.svg');
      expect(options.outputPath).toBe('output.svg');
    });

    it('recognizes --interactive flag', () => {
      const options = cli.parseArguments(['drawing.svg', '--interactive']);
      
      expect(options.interactive).toBe(true);
      expect(options.validate).toBe(false);
    });

    it('recognizes --validate flag', () => {
      const options = cli.parseArguments(['drawing.svg', '--validate']);
      
      expect(options.interactive).toBe(false);
      expect(options.validate).toBe(true);
    });

    it('recognizes multiple flags', () => {
      const options = cli.parseArguments(['drawing.svg', '--interactive', '--validate']);
      
      expect(options.interactive).toBe(true);
      expect(options.validate).toBe(true);
    });

    it('handles flags in any order', () => {
      const options = cli.parseArguments(['--validate', 'drawing.svg', '--interactive']);
      
      expect(options.inputPath).toBe('drawing.svg');
      expect(options.interactive).toBe(true);
      expect(options.validate).toBe(true);
    });

    it('handles empty arguments', () => {
      const options = cli.parseArguments([]);
      
      expect(options.inputPath).toBeNull();
    });

    it('handles null arguments', () => {
      const options = cli.parseArguments(null);
      
      expect(options.inputPath).toBeNull();
    });

    it('handles undefined arguments', () => {
      const options = cli.parseArguments(undefined);
      
      expect(options.inputPath).toBeNull();
    });
  });

  describe('generateOutputPath', () => {
    it('generates path with -adapted suffix', () => {
      const output = cli.generateOutputPath('drawing.svg');
      
      expect(output).toBe('drawing-adapted.svg');
    });

    it('preserves directory path', () => {
      const output = cli.generateOutputPath('assets/drawings/car.svg');
      
      expect(output).toBe(path.join('assets/drawings', 'car-adapted.svg'));
    });

    it('handles absolute paths', () => {
      const output = cli.generateOutputPath('/home/user/drawing.svg');
      
      expect(output).toBe('/home/user/drawing-adapted.svg');
    });

    it('preserves file extension', () => {
      const output = cli.generateOutputPath('drawing.SVG');
      
      expect(output).toBe('drawing-adapted.SVG');
    });

    it('handles files without extension', () => {
      const output = cli.generateOutputPath('drawing');
      
      expect(output).toBe('drawing-adapted');
    });

    it('handles complex filenames', () => {
      const output = cli.generateOutputPath('my-drawing-v2.final.svg');
      
      expect(output).toBe('my-drawing-v2.final-adapted.svg');
    });
  });

  describe('showUsage', () => {
    it('displays usage information', () => {
      cli.showUsage();
      
      expect(consoleLogSpy.calls.length).toBeGreaterThan(0);
      const output = consoleLogSpy.calls[0][0];
      
      expect(output).toContain('Uso:');
      expect(output).toContain('svg-adapter');
      expect(output).toContain('--interactive');
      expect(output).toContain('--validate');
      expect(output).toContain('Exemplos:');
    });
  });

  describe('displayResults', () => {
    it('displays success message with statistics', () => {
      const result = {
        success: true,
        outputPath: 'output.svg',
        colorableCount: 5,
        decorativeCount: 3,
        idsAssigned: 5,
        validation: null
      };
      
      cli.displayResults(result);
      
      expect(consoleLogSpy.calls.length).toBeGreaterThan(0);
      const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
      
      expect(output).toContain('✓ SVG adaptado com sucesso');
      expect(output).toContain('Áreas coloríveis: 5');
      expect(output).toContain('Elementos decorativos: 3');
      expect(output).toContain('IDs atribuídos: 5');
      expect(output).toContain('output.svg');
    });

    it('displays failure message', () => {
      const result = {
        success: false,
        outputPath: '',
        colorableCount: 0,
        decorativeCount: 0,
        idsAssigned: 0,
        validation: null
      };
      
      cli.displayResults(result);
      
      const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('❌ Adaptação falhou');
    });

    it('displays validation success', () => {
      const result = {
        success: true,
        outputPath: 'output.svg',
        colorableCount: 5,
        decorativeCount: 3,
        idsAssigned: 5,
        validation: {
          valid: true,
          errors: [],
          warnings: [],
          suggestions: []
        }
      };
      
      cli.displayResults(result);
      
      const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('✓ Validação passou');
    });

    it('displays validation errors', () => {
      const result = {
        success: true,
        outputPath: 'output.svg',
        colorableCount: 5,
        decorativeCount: 3,
        idsAssigned: 5,
        validation: {
          valid: false,
          errors: ['ID duplicado: area-1', 'Área sem stroke'],
          warnings: ['Elemento muito pequeno'],
          suggestions: ['Corrija os IDs duplicados']
        }
      };
      
      cli.displayResults(result);
      
      const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('⚠ Validação encontrou problemas');
      expect(output).toContain('ID duplicado: area-1');
      expect(output).toContain('Área sem stroke');
      expect(output).toContain('Elemento muito pequeno');
      expect(output).toContain('💡 Sugestões');
      expect(output).toContain('Corrija os IDs duplicados');
    });

    it('displays validation warnings without errors', () => {
      const result = {
        success: true,
        outputPath: 'output.svg',
        colorableCount: 5,
        decorativeCount: 3,
        idsAssigned: 5,
        validation: {
          valid: false,
          errors: [],
          warnings: ['Elemento muito pequeno'],
          suggestions: []
        }
      };
      
      cli.displayResults(result);
      
      const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Elemento muito pequeno');
    });
  });

  describe('displayError', () => {
    it('displays error message', () => {
      const error = new Error('Arquivo não encontrado');
      
      cli.displayError(error);
      
      expect(consoleErrorSpy.calls.length).toBeGreaterThan(0);
      const output = consoleErrorSpy.calls.map(call => call[0]).join('\n');
      
      expect(output).toContain('❌ Erro');
      expect(output).toContain('Arquivo não encontrado');
    });

    it('provides suggestion for file not found error', () => {
      const error = new Error('Arquivo não encontrado: drawing.svg');
      
      cli.displayError(error);
      
      const output = consoleErrorSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('💡 Verifique se o caminho está correto');
    });

    it('provides suggestion for parsing error', () => {
      const error = new Error('Erro de parsing XML');
      
      cli.displayError(error);
      
      const output = consoleErrorSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('💡 O arquivo SVG parece estar malformado');
    });

    it('provides suggestion for permission error', () => {
      const error = new Error('Erro de permissão ao salvar arquivo');
      
      cli.displayError(error);
      
      const output = consoleErrorSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('💡 Verifique as permissões');
    });
  });

  describe('run', () => {
    it('shows usage when no input path provided', async () => {
      await cli.run([]);
      
      expect(consoleLogSpy.calls.length).toBeGreaterThan(0);
      const output = consoleLogSpy.calls[0][0];
      expect(output).toContain('Uso:');
    });

    it('displays results on successful run', async () => {
      // Mock adaptSVG to return success result
      cli.adaptSVG = async () => ({
        success: true,
        outputPath: 'drawing-adapted.svg',
        colorableCount: 5,
        decorativeCount: 3,
        idsAssigned: 5,
        validation: null
      });
      
      await cli.run(['drawing.svg']);
      
      expect(consoleLogSpy.calls.length).toBeGreaterThan(0);
      const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
      expect(output).toContain('✓ SVG adaptado com sucesso');
    });

    it('displays error and re-throws on failure', async () => {
      // Mock parseArguments to throw error
      const originalParse = cli.parseArguments;
      cli.parseArguments = () => {
        throw new Error('Test error');
      };
      
      await expect(cli.run(['drawing.svg'])).rejects.toThrow('Test error');
      expect(consoleErrorSpy.calls.length).toBeGreaterThan(0);
      
      cli.parseArguments = originalParse;
    });
  });
});
