/**
 * Property-Based Tests for SVGAdapterCLI
 * 
 * Tests CLI argument parsing, default path generation, flag recognition,
 * and execution summary using property-based testing with fast-check.
 */

import fc from 'fast-check';
import { SVGAdapterCLI } from '../SVGAdapterCLI.js';
import path from 'path';

describe('SVGAdapterCLI - Property-Based Tests', () => {
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

  /**
   * Feature: svg-auto-adapter, Property 22: Parsing de argumento de entrada
   * Validates: Requirements 10.1
   * 
   * For any CLI invocation with an SVG file path, the system must accept
   * and process the argument correctly.
   */
  it('property: accepts and processes input path argument', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('--')),
        (inputPath) => {
          const options = cli.parseArguments([inputPath]);
          
          // Input path must be accepted
          expect(options.inputPath).toBe(inputPath);
          
          // Output path must be generated
          expect(options.outputPath).toBeDefined();
          expect(typeof options.outputPath).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 23: Caminho de saída padrão
   * Validates: Requirements 10.2
   * 
   * For any CLI invocation without output path specified, the system must
   * generate a file with the same name as input plus "-adapted" suffix.
   */
  it('property: generates default output path with -adapted suffix', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('/')),
          ext: fc.constantFrom('.svg', '.SVG')
        }),
        ({ name, ext }) => {
          const inputPath = `${name}${ext}`;
          const options = cli.parseArguments([inputPath]);
          
          // Output path must contain -adapted suffix
          expect(options.outputPath).toContain('-adapted');
          
          // Output path must preserve extension
          expect(options.outputPath).toMatch(new RegExp(`${ext}$`));
          
          // Output path must be based on input name
          expect(options.outputPath).toContain(name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 23: Caminho de saída padrão (com diretório)
   * Validates: Requirements 10.2
   * 
   * For any input path with directory, the default output path must be
   * in the same directory.
   */
  it('property: preserves directory in default output path', () => {
    fc.assert(
      fc.property(
        fc.record({
          dir: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('/') && s.trim().length > 0),
          ext: fc.constant('.svg')
        }),
        ({ dir, name, ext }) => {
          const inputPath = path.join(dir, `${name}${ext}`);
          const options = cli.parseArguments([inputPath]);
          
          // Output path must be in same directory
          const outputDir = path.dirname(options.outputPath);
          const expectedDir = path.dirname(inputPath);
          expect(outputDir).toBe(expectedDir);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 24: Flags CLI reconhecidas
   * Validates: Requirements 10.3, 10.4
   * 
   * For any CLI invocation with --interactive or --validate flags,
   * the system must recognize and apply the corresponding behavior.
   */
  it('property: recognizes --interactive flag', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('--')),
        fc.boolean(),
        (inputPath, includeFlag) => {
          const args = includeFlag 
            ? [inputPath, '--interactive']
            : [inputPath];
          
          const options = cli.parseArguments(args);
          
          // Interactive flag must match inclusion
          expect(options.interactive).toBe(includeFlag);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 24: Flags CLI reconhecidas
   * Validates: Requirements 10.3, 10.4
   * 
   * For any CLI invocation with --validate flag, the system must
   * recognize and apply the corresponding behavior.
   */
  it('property: recognizes --validate flag', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('--')),
        fc.boolean(),
        (inputPath, includeFlag) => {
          const args = includeFlag 
            ? [inputPath, '--validate']
            : [inputPath];
          
          const options = cli.parseArguments(args);
          
          // Validate flag must match inclusion
          expect(options.validate).toBe(includeFlag);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 24: Flags CLI reconhecidas (múltiplas flags)
   * Validates: Requirements 10.3, 10.4
   * 
   * For any CLI invocation with multiple flags, the system must
   * recognize all flags correctly.
   */
  it('property: recognizes multiple flags simultaneously', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('--')),
        fc.boolean(),
        fc.boolean(),
        (inputPath, includeInteractive, includeValidate) => {
          const args = [inputPath];
          if (includeInteractive) args.push('--interactive');
          if (includeValidate) args.push('--validate');
          
          const options = cli.parseArguments(args);
          
          // Both flags must be recognized correctly
          expect(options.interactive).toBe(includeInteractive);
          expect(options.validate).toBe(includeValidate);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 22: Parsing de argumento de entrada (com output)
   * Validates: Requirements 10.1, 10.2
   * 
   * For any CLI invocation with both input and output paths,
   * the system must use the specified output path.
   */
  it('property: uses specified output path when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('--')),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.startsWith('--')),
        (inputPath, outputPath) => {
          const options = cli.parseArguments([inputPath, outputPath]);
          
          // Must use specified output path
          expect(options.outputPath).toBe(outputPath);
          
          // Must not generate default path
          expect(options.outputPath).not.toContain('-adapted');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 25: Resumo de execução
   * Validates: Requirements 10.5
   * 
   * For any completed execution, the system must display a summary
   * containing statistics and the generated file path.
   */
  it('property: displays summary with all required information', () => {
    fc.assert(
      fc.property(
        fc.record({
          success: fc.constant(true),
          outputPath: fc.string({ minLength: 1, maxLength: 100 }),
          colorableCount: fc.integer({ min: 0, max: 100 }),
          decorativeCount: fc.integer({ min: 0, max: 100 }),
          idsAssigned: fc.integer({ min: 0, max: 100 }),
          validation: fc.constant(null)
        }),
        (result) => {
          consoleLogSpy.calls = [];
          cli.displayResults(result);
          
          // Must display success message
          expect(consoleLogSpy.calls.length).toBeGreaterThan(0);
          const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
          
          // Must contain all statistics
          expect(output).toContain('Áreas coloríveis');
          expect(output).toContain(result.colorableCount.toString());
          expect(output).toContain('Elementos decorativos');
          expect(output).toContain(result.decorativeCount.toString());
          expect(output).toContain('IDs atribuídos');
          expect(output).toContain(result.idsAssigned.toString());
          
          // Must contain output path
          expect(output).toContain('Arquivo salvo em');
          expect(output).toContain(result.outputPath);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 25: Resumo de execução (com validação)
   * Validates: Requirements 10.5
   * 
   * For any completed execution with validation, the summary must
   * include validation results.
   */
  it('property: displays validation results when available', () => {
    fc.assert(
      fc.property(
        fc.record({
          success: fc.constant(true),
          outputPath: fc.string({ minLength: 1, maxLength: 100 }),
          colorableCount: fc.integer({ min: 0, max: 100 }),
          decorativeCount: fc.integer({ min: 0, max: 100 }),
          idsAssigned: fc.integer({ min: 0, max: 100 }),
          validation: fc.record({
            valid: fc.boolean(),
            errors: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
            warnings: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
            suggestions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 3 })
          })
        }),
        (result) => {
          consoleLogSpy.calls = [];
          cli.displayResults(result);
          
          const output = consoleLogSpy.calls.map(call => call[0]).join('\n');
          
          if (result.validation.valid) {
            // Must show validation passed
            expect(output).toContain('Validação passou');
          } else {
            // Must show validation problems
            expect(output).toContain('Validação encontrou problemas');
            
            // Must show errors if present
            if (result.validation.errors.length > 0) {
              result.validation.errors.forEach(err => {
                expect(output).toContain(err);
              });
            }
            
            // Must show suggestions if present
            if (result.validation.suggestions.length > 0) {
              expect(output).toContain('Sugestões');
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 22: Parsing de argumento de entrada (sem argumentos)
   * Validates: Requirements 10.1
   * 
   * For any CLI invocation without arguments, the system must
   * return null input path.
   */
  it('property: handles empty arguments gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom([], null, undefined),
        (args) => {
          const options = cli.parseArguments(args || []);
          
          // Must return null input path
          expect(options.inputPath).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
