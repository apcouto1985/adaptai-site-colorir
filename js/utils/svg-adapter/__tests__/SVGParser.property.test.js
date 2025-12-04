import { SVGParser, SVGParseError } from '../SVGParser.js';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import fc from 'fast-check';

describe('SVGParser - Property-Based Tests', () => {
  let parser;
  let tempDir;
  let testFiles = [];

  beforeEach(() => {
    parser = new SVGParser();
    tempDir = join(tmpdir(), `svg-parser-pbt-${Date.now()}`);
  });

  afterEach(async () => {
    // Limpar arquivos temporários
    for (const file of testFiles) {
      try {
        await unlink(file);
      } catch (error) {
        // Ignorar erros de limpeza
      }
    }
    testFiles = [];
  });

  /**
   * Helper para criar arquivo SVG temporário
   */
  async function createTempSVG(content) {
    await mkdir(tempDir, { recursive: true });
    const filePath = join(tempDir, `test-${Date.now()}-${Math.random()}.svg`);
    await writeFile(filePath, content, 'utf-8');
    testFiles.push(filePath);
    return filePath;
  }

  // ============================================================================
  // GERADORES CUSTOMIZADOS
  // ============================================================================

  /**
   * Gerador de cores SVG válidas
   */
  const colorGenerator = fc.oneof(
    fc.constant('none'),
    fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`),
    fc.constantFrom('#000000', '#222221', '#B5B5B5', '#FFFFFF', 'black', 'white', 'red', 'blue', 'green')
  );

  /**
   * Gerador de elementos SVG válidos
   */
  const svgElementGenerator = fc.record({
    tagName: fc.constantFrom('path', 'rect', 'circle', 'polygon', 'ellipse', 'line'),
    id: fc.option(fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9-]/g, '')), { nil: null }),
    fill: fc.option(colorGenerator, { nil: null }),
    stroke: fc.option(colorGenerator, { nil: null }),
    strokeWidth: fc.option(fc.integer({ min: 0, max: 10 }).map(String), { nil: null }),
    pointerEvents: fc.option(fc.constantFrom('none', 'auto'), { nil: null }),
    // Atributos específicos por tipo
    x: fc.integer({ min: 0, max: 100 }),
    y: fc.integer({ min: 0, max: 100 }),
    width: fc.integer({ min: 1, max: 100 }),
    height: fc.integer({ min: 1, max: 100 }),
    cx: fc.integer({ min: 0, max: 100 }),
    cy: fc.integer({ min: 0, max: 100 }),
    r: fc.integer({ min: 1, max: 50 }),
    rx: fc.integer({ min: 1, max: 50 }),
    ry: fc.integer({ min: 1, max: 50 }),
    x1: fc.integer({ min: 0, max: 100 }),
    y1: fc.integer({ min: 0, max: 100 }),
    x2: fc.integer({ min: 0, max: 100 }),
    y2: fc.integer({ min: 0, max: 100 })
  });

  /**
   * Converte elemento gerado para XML
   */
  function elementToXML(el) {
    const attrs = [];
    
    if (el.id) attrs.push(`id="${el.id}"`);
    if (el.fill) attrs.push(`fill="${el.fill}"`);
    if (el.stroke) attrs.push(`stroke="${el.stroke}"`);
    if (el.strokeWidth) attrs.push(`stroke-width="${el.strokeWidth}"`);
    if (el.pointerEvents) attrs.push(`pointer-events="${el.pointerEvents}"`);
    
    // Adicionar atributos específicos por tipo
    switch (el.tagName) {
      case 'rect':
        attrs.push(`x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"`);
        break;
      case 'circle':
        attrs.push(`cx="${el.cx}" cy="${el.cy}" r="${el.r}"`);
        break;
      case 'ellipse':
        attrs.push(`cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}"`);
        break;
      case 'line':
        attrs.push(`x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}"`);
        break;
      case 'path':
        attrs.push(`d="M${el.x} ${el.y} L${el.x + el.width} ${el.y + el.height}"`);
        break;
      case 'polygon':
        attrs.push(`points="${el.x},${el.y} ${el.x + el.width},${el.y} ${el.x + el.width / 2},${el.y + el.height}"`);
        break;
    }
    
    return `<${el.tagName} ${attrs.join(' ')} />`;
  }

  /**
   * Gerador de SVG completo válido
   */
  const validSVGGenerator = fc.array(svgElementGenerator, { minLength: 1, maxLength: 20 })
    .map(elements => {
      const elementsXML = elements.map(elementToXML).join('\n  ');
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ${elementsXML}
</svg>`;
    });

  /**
   * Gerador de SVG malformado
   */
  const malformedSVGGenerator = fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.constant('<svg><path'),
    fc.constant('not xml at all'),
    fc.constant('<svg xmlns="http://www.w3.org/2000/svg"><path></svg>'),
    fc.constant('<?xml version="1.0"?><root><child /></root>'),
    fc.constant('<svg><path d="M10 10" unclosed="'),
    fc.string().filter(s => !s.includes('<?xml') && !s.includes('<svg'))
  );

  // ============================================================================
  // PROPERTY 1: Parsing completo de SVG válido
  // Feature: svg-auto-adapter, Property 1: Parsing completo de SVG válido
  // Validates: Requirements 1.1, 1.2, 1.3, 1.4
  // ============================================================================

  test('property: parsing any well-formed SVG returns valid DOM with all elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const filePath = await createTempSVG(svgContent);
          const result = await parser.parse(filePath);
          
          // Deve retornar estrutura DOM válida
          expect(result.element).toBeDefined();
          expect(result.element.tagName.toLowerCase()).toBe('svg');
          expect(result.document).toBeDefined();
          
          // Deve ter elementos extraídos
          expect(Array.isArray(result.elements)).toBe(true);
          expect(result.elements.length).toBeGreaterThan(0);
          
          // Todos os elementos devem ter estrutura correta
          result.elements.forEach(el => {
            expect(el.element).toBeDefined();
            expect(el.tagName).toBeDefined();
            expect(['path', 'rect', 'circle', 'polygon', 'ellipse', 'line']).toContain(el.tagName);
            expect(el.bounds).toBeDefined();
            expect(el.bounds).toHaveProperty('x');
            expect(el.bounds).toHaveProperty('y');
            expect(el.bounds).toHaveProperty('width');
            expect(el.bounds).toHaveProperty('height');
            expect(el.bounds).toHaveProperty('area');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: all graphic elements are identified and attributes extracted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(svgElementGenerator, { minLength: 1, maxLength: 10 }),
        async (elements) => {
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ${elements.map(elementToXML).join('\n  ')}
</svg>`;
          
          const filePath = await createTempSVG(svgContent);
          const result = await parser.parse(filePath);
          
          // Número de elementos deve corresponder
          expect(result.elements.length).toBe(elements.length);
          
          // Cada elemento deve ter atributos extraídos corretamente
          result.elements.forEach((parsed, i) => {
            const original = elements[i];
            
            expect(parsed.tagName).toBe(original.tagName);
            
            // Verificar atributos (null se não definido)
            if (original.id) {
              expect(parsed.id).toBe(original.id);
            }
            if (original.fill) {
              expect(parsed.fill).toBe(original.fill);
            }
            if (original.stroke) {
              expect(parsed.stroke).toBe(original.stroke);
            }
            if (original.strokeWidth) {
              expect(parsed.strokeWidth).toBe(original.strokeWidth);
            }
            if (original.pointerEvents) {
              expect(parsed.pointerEvents).toBe(original.pointerEvents);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: bounds are calculated for all elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const filePath = await createTempSVG(svgContent);
          const result = await parser.parse(filePath);
          
          // Todos os elementos devem ter bounds calculados
          result.elements.forEach(el => {
            expect(el.bounds).toBeDefined();
            expect(typeof el.bounds.x).toBe('number');
            expect(typeof el.bounds.y).toBe('number');
            expect(typeof el.bounds.width).toBe('number');
            expect(typeof el.bounds.height).toBe('number');
            expect(typeof el.bounds.area).toBe('number');
            
            // Área deve ser não-negativa
            expect(el.bounds.area).toBeGreaterThanOrEqual(0);
            
            // Width e height devem ser não-negativos
            expect(el.bounds.width).toBeGreaterThanOrEqual(0);
            expect(el.bounds.height).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 2: Erro descritivo para SVG malformado
  // Feature: svg-auto-adapter, Property 2: Erro descritivo para SVG malformado
  // Validates: Requirements 1.5
  // ============================================================================

  test('property: parsing malformed SVG throws descriptive SVGParseError', async () => {
    await fc.assert(
      fc.asyncProperty(
        malformedSVGGenerator,
        async (malformedContent) => {
          const filePath = await createTempSVG(malformedContent);
          
          // Deve lançar SVGParseError
          await expect(parser.parse(filePath)).rejects.toThrow(SVGParseError);
          
          // Deve ter mensagem descritiva
          try {
            await parser.parse(filePath);
            fail('Deveria ter lançado erro');
          } catch (error) {
            expect(error).toBeInstanceOf(SVGParseError);
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(0);
            
            // Mensagem deve indicar o problema
            const message = error.message.toLowerCase();
            const hasDescriptiveMessage = 
              message.includes('vazio') ||
              message.includes('parsing') ||
              message.includes('xml') ||
              message.includes('svg') ||
              message.includes('válido') ||
              message.includes('malformado');
            
            expect(hasDescriptiveMessage).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: error messages contain relevant context', async () => {
    await fc.assert(
      fc.asyncProperty(
        malformedSVGGenerator,
        async (malformedContent) => {
          const filePath = await createTempSVG(malformedContent);
          
          try {
            await parser.parse(filePath);
            fail('Deveria ter lançado erro');
          } catch (error) {
            expect(error).toBeInstanceOf(SVGParseError);
            
            // Erro deve ter nome correto
            expect(error.name).toBe('SVGParseError');
            
            // Pode ter erro original encapsulado
            if (error.originalError) {
              expect(error.originalError).toBeInstanceOf(Error);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
