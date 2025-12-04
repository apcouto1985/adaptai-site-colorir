import { SVGGenerator, SVGGenerationError } from '../SVGGenerator.js';
import { SVGParser } from '../SVGParser.js';
import { ElementClassifier } from '../ElementClassifier.js';
import { TransformEngine } from '../TransformEngine.js';
import { writeFile, unlink, mkdir, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { JSDOM } from 'jsdom';
import fc from 'fast-check';

describe('SVGGenerator - Property-Based Tests', () => {
  let generator;
  let parser;
  let classifier;
  let transformer;
  let tempDir;
  let testFiles = [];

  beforeEach(() => {
    generator = new SVGGenerator();
    parser = new SVGParser();
    classifier = new ElementClassifier();
    transformer = new TransformEngine();
    tempDir = join(tmpdir(), `svg-generator-pbt-${Date.now()}`);
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

  /**
   * Helper para criar caminho de saída temporário
   */
  function createTempOutputPath() {
    const filePath = join(tempDir, `output-${Date.now()}-${Math.random()}.svg`);
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
    fc.constantFrom('#000000', '#222221', '#B5B5B5', '#FFFFFF', 'red', 'blue', 'green')
  );

  /**
   * Gerador de elementos SVG válidos
   */
  const svgElementGenerator = fc.record({
    tagName: fc.constantFrom('path', 'rect', 'circle', 'polygon', 'ellipse'),
    fill: fc.option(colorGenerator, { nil: null }),
    stroke: fc.option(colorGenerator, { nil: null }),
    strokeWidth: fc.option(fc.integer({ min: 0, max: 10 }).map(String), { nil: null }),
    x: fc.integer({ min: 0, max: 100 }),
    y: fc.integer({ min: 0, max: 100 }),
    width: fc.integer({ min: 10, max: 100 }),
    height: fc.integer({ min: 10, max: 100 }),
    cx: fc.integer({ min: 20, max: 100 }),
    cy: fc.integer({ min: 20, max: 100 }),
    r: fc.integer({ min: 5, max: 50 })
  });

  /**
   * Converte elemento gerado para XML
   */
  function elementToXML(el) {
    const attrs = [];
    
    if (el.fill) attrs.push(`fill="${el.fill}"`);
    if (el.stroke) attrs.push(`stroke="${el.stroke}"`);
    if (el.strokeWidth) attrs.push(`stroke-width="${el.strokeWidth}"`);
    
    switch (el.tagName) {
      case 'rect':
        attrs.push(`x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"`);
        break;
      case 'circle':
        attrs.push(`cx="${el.cx}" cy="${el.cy}" r="${el.r}"`);
        break;
      case 'path':
        attrs.push(`d="M${el.x} ${el.y} L${el.x + el.width} ${el.y + el.height}"`);
        break;
      case 'polygon':
        attrs.push(`points="${el.x},${el.y} ${el.x + el.width},${el.y} ${el.x + el.width / 2},${el.y + el.height}"`);
        break;
      case 'ellipse':
        attrs.push(`cx="${el.cx}" cy="${el.cy}" rx="${el.r}" ry="${el.r * 0.7}"`);
        break;
    }
    
    return `<${el.tagName} ${attrs.join(' ')} />`;
  }

  /**
   * Gerador de SVG completo válido
   */
  const validSVGGenerator = fc.array(svgElementGenerator, { minLength: 1, maxLength: 15 })
    .map(elements => {
      const elementsXML = elements.map(elementToXML).join('\n  ');
      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  ${elementsXML}
</svg>`;
    });

  /**
   * Gerador de estatísticas de transformação
   */
  const statsGenerator = fc.record({
    colorableCount: fc.integer({ min: 0, max: 20 }),
    decorativeCount: fc.integer({ min: 0, max: 20 }),
    idsAssigned: fc.integer({ min: 0, max: 20 }),
    strokesAdjusted: fc.integer({ min: 0, max: 20 }),
    fillsCleared: fc.integer({ min: 0, max: 20 }),
    pointerEventsAdded: fc.integer({ min: 0, max: 20 })
  });

  // ============================================================================
  // PROPERTY 11: Serialização para XML válido
  // Feature: svg-auto-adapter, Property 11: Serialização para XML válido
  // Validates: Requirements 7.1
  // ============================================================================

  test('property: serialized SVG is valid XML that can be parsed again', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          // Criar SVG inicial
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          // Parse, transform e gerar
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          const result = await generator.generate(transformed.svg, outputPath, transformed);
          
          // Deve ter sucesso
          expect(result.success).toBe(true);
          
          // Arquivo gerado deve ser XML válido que pode ser parseado novamente
          const reparsed = await parser.parse(outputPath);
          
          expect(reparsed.element).toBeDefined();
          expect(reparsed.element.tagName.toLowerCase()).toBe('svg');
          expect(reparsed.document).toBeDefined();
          
          // Deve ter elementos
          expect(Array.isArray(reparsed.elements)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: round-trip parsing preserves element count', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          // Parse original
          const parsed = await parser.parse(inputPath);
          const originalCount = parsed.elements.length;
          
          // Transform e gerar
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          await generator.generate(transformed.svg, outputPath, transformed);
          
          // Re-parse
          const reparsed = await parser.parse(outputPath);
          
          // Número de elementos deve ser preservado
          expect(reparsed.elements.length).toBe(originalCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 12: Preservação de declaração XML
  // Feature: svg-auto-adapter, Property 12: Preservação de declaração XML
  // Validates: Requirements 7.2
  // ============================================================================

  test('property: generated SVG contains XML declaration and namespace', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          // Parse, transform e gerar
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          await generator.generate(transformed.svg, outputPath, transformed);
          
          // Ler conteúdo gerado
          const generatedContent = await readFile(outputPath, 'utf-8');
          
          // Deve conter declaração XML
          expect(generatedContent).toMatch(/^<\?xml\s+version="1\.0"\s+encoding="UTF-8"\?>/);
          
          // Deve conter namespace SVG
          expect(generatedContent).toContain('xmlns="http://www.w3.org/2000/svg"');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: XML declaration is always at the start', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          await generator.generate(transformed.svg, outputPath, transformed);
          
          const generatedContent = await readFile(outputPath, 'utf-8');
          
          // Declaração XML deve estar no início (após possíveis espaços)
          const trimmed = generatedContent.trim();
          expect(trimmed.startsWith('<?xml')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 13: Arquivo salvo no caminho especificado
  // Feature: svg-auto-adapter, Property 13: Arquivo salvo no caminho especificado
  // Validates: Requirements 7.4
  // ============================================================================

  test('property: file exists at specified path after generation', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          // Parse, transform e gerar
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          const result = await generator.generate(transformed.svg, outputPath, transformed);
          
          // Resultado deve indicar sucesso
          expect(result.success).toBe(true);
          expect(result.outputPath).toBe(outputPath);
          
          // Arquivo deve existir no caminho especificado
          await expect(access(outputPath)).resolves.not.toThrow();
          
          // Arquivo deve ser legível
          const content = await readFile(outputPath, 'utf-8');
          expect(content).toBeDefined();
          expect(content.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: generated file is readable and non-empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          await generator.generate(transformed.svg, outputPath, transformed);
          
          // Arquivo deve ser legível
          const content = await readFile(outputPath, 'utf-8');
          
          // Conteúdo não deve estar vazio
          expect(content.trim().length).toBeGreaterThan(0);
          
          // Deve ser XML válido
          expect(content).toContain('<?xml');
          expect(content).toContain('<svg');
          expect(content).toContain('</svg>');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 14: Estatísticas corretas
  // Feature: svg-auto-adapter, Property 14: Estatísticas corretas
  // Validates: Requirements 7.5
  // ============================================================================

  test('property: statistics match processed elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          // Parse e classificar
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          
          // Transform
          const transformed = transformer.transform(parsed.element, classification);
          
          // Gerar
          await mkdir(tempDir, { recursive: true });
          const result = await generator.generate(transformed.svg, outputPath, transformed);
          
          // Estatísticas devem corresponder aos elementos processados
          expect(result.stats.colorableAreas).toBe(transformed.colorableCount);
          expect(result.stats.decorativeElements).toBe(transformed.decorativeCount);
          expect(result.stats.idsAssigned).toBe(transformed.stats.idsAssigned);
          expect(result.stats.strokesAdjusted).toBe(transformed.stats.strokesAdjusted);
          expect(result.stats.fillsCleared).toBe(transformed.stats.fillsCleared);
          expect(result.stats.pointerEventsAdded).toBe(transformed.stats.pointerEventsAdded);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: statistics are non-negative integers', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          const parsed = await parser.parse(inputPath);
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          const result = await generator.generate(transformed.svg, outputPath, transformed);
          
          // Todas as estatísticas devem ser números não-negativos
          expect(result.stats.colorableAreas).toBeGreaterThanOrEqual(0);
          expect(result.stats.decorativeElements).toBeGreaterThanOrEqual(0);
          expect(result.stats.idsAssigned).toBeGreaterThanOrEqual(0);
          expect(result.stats.strokesAdjusted).toBeGreaterThanOrEqual(0);
          expect(result.stats.fillsCleared).toBeGreaterThanOrEqual(0);
          expect(result.stats.pointerEventsAdded).toBeGreaterThanOrEqual(0);
          
          // Devem ser inteiros
          expect(Number.isInteger(result.stats.colorableAreas)).toBe(true);
          expect(Number.isInteger(result.stats.decorativeElements)).toBe(true);
          expect(Number.isInteger(result.stats.idsAssigned)).toBe(true);
          expect(Number.isInteger(result.stats.strokesAdjusted)).toBe(true);
          expect(Number.isInteger(result.stats.fillsCleared)).toBe(true);
          expect(Number.isInteger(result.stats.pointerEventsAdded)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('property: total elements equals colorable plus decorative', async () => {
    await fc.assert(
      fc.asyncProperty(
        validSVGGenerator,
        async (svgContent) => {
          const inputPath = await createTempSVG(svgContent);
          const outputPath = createTempOutputPath();
          
          const parsed = await parser.parse(inputPath);
          const totalElements = parsed.elements.length;
          
          const classification = classifier.classify(parsed.elements);
          const transformed = transformer.transform(parsed.element, classification);
          
          await mkdir(tempDir, { recursive: true });
          const result = await generator.generate(transformed.svg, outputPath, transformed);
          
          // Total de elementos deve ser soma de coloríveis e decorativos
          const sum = result.stats.colorableAreas + result.stats.decorativeElements;
          expect(sum).toBe(totalElements);
        }
      ),
      { numRuns: 100 }
    );
  });
});
