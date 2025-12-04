import { SVGGenerator, SVGGenerationError } from '../SVGGenerator.js';
import { SVGParser } from '../SVGParser.js';
import { ElementClassifier } from '../ElementClassifier.js';
import { TransformEngine } from '../TransformEngine.js';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SVGGenerator - Unit Tests', () => {
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
    tempDir = join(tmpdir(), `svg-generator-test-${Date.now()}`);
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
  // TESTES DE SERIALIZAÇÃO
  // ============================================================================

  describe('Serialização', () => {
    test('deve serializar SVG simples com 3 paths', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L20 20" fill="none" stroke="black" />
  <path d="M30 30 L40 40" fill="none" stroke="black" />
  <path d="M50 50 L60 60" fill="none" stroke="black" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const outputPath = createTempOutputPath();

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      await mkdir(tempDir, { recursive: true });
      const result = await generator.generate(transformed.svg, outputPath, transformed);

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputPath);

      // Verificar que arquivo foi criado
      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('<?xml');
      expect(content).toContain('<svg');
      expect(content).toContain('</svg>');
    });

    test('deve preservar namespace SVG', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="30" height="30" fill="red" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const outputPath = createTempOutputPath();

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      await mkdir(tempDir, { recursive: true });
      await generator.generate(transformed.svg, outputPath, transformed);

      const content = await readFile(outputPath, 'utf-8');
      expect(content).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    test('deve adicionar declaração XML se não existir', async () => {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="20" fill="blue" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const outputPath = createTempOutputPath();

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      await mkdir(tempDir, { recursive: true });
      await generator.generate(transformed.svg, outputPath, transformed);

      const content = await readFile(outputPath, 'utf-8');
      expect(content.trim().startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    });
  });

  // ============================================================================
  // TESTES DE FORMATAÇÃO
  // ============================================================================

  describe('Formatação XML', () => {
    test('deve formatar XML com indentação', () => {
      const unformatted = '<?xml version="1.0"?><svg><path d="M10 10"/></svg>';
      const formatted = generator.formatXML(unformatted);

      // Deve ter quebras de linha
      expect(formatted.split('\n').length).toBeGreaterThan(1);

      // Deve ter indentação
      expect(formatted).toContain('  <path');
    });

    test('deve remover espaços em branco extras entre tags na mesma linha', () => {
      const unformatted = '<?xml version="1.0"?><svg><path d="M10 10"/></svg>';
      const formatted = generator.formatXML(unformatted);

      // Deve ter quebras de linha entre tags (não múltiplos espaços na mesma linha)
      const lines = formatted.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      // Cada linha não deve ter múltiplos espaços consecutivos (exceto indentação no início)
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed) {
          // Não deve ter múltiplos espaços no meio do conteúdo
          expect(trimmed).not.toMatch(/\S\s{2,}\S/);
        }
      });
    });

    test('deve preservar declaração XML', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><svg><path/></svg>';
      const formatted = generator.formatXML(xml);

      expect(formatted).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    });
  });

  // ============================================================================
  // TESTES DE ESTATÍSTICAS
  // ============================================================================

  describe('Estatísticas', () => {
    test('deve retornar estatísticas corretas para SVG com 2 coloríveis e 1 decorativo', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L20 20" fill="none" stroke="black" />
  <path d="M30 30 L40 40" fill="none" stroke="blue" />
  <circle cx="5" cy="5" r="2" fill="black" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const outputPath = createTempOutputPath();

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      await mkdir(tempDir, { recursive: true });
      const result = await generator.generate(transformed.svg, outputPath, transformed);

      expect(result.stats.colorableAreas).toBe(2);
      expect(result.stats.decorativeElements).toBe(1);
      expect(result.stats.idsAssigned).toBe(2);
    });

    test('deve retornar estatísticas zeradas para SVG vazio', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const outputPath = createTempOutputPath();

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      await mkdir(tempDir, { recursive: true });
      const result = await generator.generate(transformed.svg, outputPath, transformed);

      expect(result.stats.colorableAreas).toBe(0);
      expect(result.stats.decorativeElements).toBe(0);
      expect(result.stats.idsAssigned).toBe(0);
      expect(result.stats.strokesAdjusted).toBe(0);
      expect(result.stats.fillsCleared).toBe(0);
      expect(result.stats.pointerEventsAdded).toBe(0);
    });
  });

  // ============================================================================
  // TESTES DE ERRO
  // ============================================================================

  describe('Tratamento de Erros', () => {
    test('deve lançar SVGGenerationError para diretório inválido', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="30" height="30" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const invalidPath = '/invalid/directory/that/does/not/exist/output.svg';

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      await expect(
        generator.generate(transformed.svg, invalidPath, transformed)
      ).rejects.toThrow(SVGGenerationError);
    });

    test('erro deve ter nome correto', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="30" height="30" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const invalidPath = '/invalid/directory/output.svg';

      const parsed = await parser.parse(inputPath);
      const classification = classifier.classify(parsed.elements);
      const transformed = transformer.transform(parsed.element, classification);

      try {
        await generator.generate(transformed.svg, invalidPath, transformed);
        fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(SVGGenerationError);
        expect(error.name).toBe('SVGGenerationError');
        expect(error.message).toBeDefined();
      }
    });
  });

  // ============================================================================
  // TESTES DE INTEGRAÇÃO
  // ============================================================================

  describe('Integração', () => {
    test('deve processar SVG completo do início ao fim', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M10 10 L50 50" fill="none" stroke="black" stroke-width="1" />
  <rect x="60" y="60" width="40" height="40" fill="red" stroke="black" />
  <circle cx="150" cy="150" r="3" fill="black" />
</svg>`;

      const inputPath = await createTempSVG(svgContent);
      const outputPath = createTempOutputPath();

      // Parse
      const parsed = await parser.parse(inputPath);
      expect(parsed.elements.length).toBe(3);

      // Classificar
      const classification = classifier.classify(parsed.elements);
      expect(classification.colorable.length + classification.decorative.length).toBe(3);

      // Transformar
      const transformed = transformer.transform(parsed.element, classification);
      expect(transformed.colorableCount).toBeGreaterThan(0);

      // Gerar
      await mkdir(tempDir, { recursive: true });
      const result = await generator.generate(transformed.svg, outputPath, transformed);

      expect(result.success).toBe(true);
      expect(result.stats.colorableAreas + result.stats.decorativeElements).toBe(3);

      // Verificar que pode ser parseado novamente
      const reparsed = await parser.parse(outputPath);
      expect(reparsed.elements.length).toBe(3);
    });
  });
});
