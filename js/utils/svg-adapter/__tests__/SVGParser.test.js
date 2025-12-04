import { SVGParser, SVGParseError } from '../SVGParser.js';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SVGParser', () => {
  let parser;
  let tempDir;
  let testFiles = [];

  beforeEach(() => {
    parser = new SVGParser();
    tempDir = join(tmpdir(), `svg-parser-test-${Date.now()}`);
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
    const filePath = join(tempDir, `test-${Date.now()}.svg`);
    await writeFile(filePath, content, 'utf-8');
    testFiles.push(filePath);
    return filePath;
  }

  describe('parse()', () => {
    test('deve fazer parsing de SVG simples com 3 paths', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path id="path1" d="M10 10 L20 20" fill="none" stroke="black" />
  <path id="path2" d="M30 30 L40 40" fill="red" stroke="black" />
  <path id="path3" d="M50 50 L60 60" fill="none" stroke="blue" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      expect(result.element).toBeDefined();
      expect(result.element.tagName.toLowerCase()).toBe('svg');
      expect(result.elements).toHaveLength(3);
      expect(result.elements[0].tagName).toBe('path');
      expect(result.elements[0].id).toBe('path1');
      expect(result.elements[0].fill).toBe('none');
      expect(result.elements[0].stroke).toBe('black');
    });

    test('deve identificar elementos mistos (path, rect, circle)', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 L20 20" fill="none" stroke="black" />
  <rect x="30" y="30" width="20" height="20" fill="red" />
  <circle cx="70" cy="70" r="10" fill="blue" stroke="black" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      expect(result.elements).toHaveLength(3);
      expect(result.elements[0].tagName).toBe('path');
      expect(result.elements[1].tagName).toBe('rect');
      expect(result.elements[2].tagName).toBe('circle');
    });

    test('deve extrair todos os atributos relevantes', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path id="test-id" d="M10 10" fill="#FF0000" stroke="#000000" stroke-width="2" pointer-events="none" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const element = result.elements[0];
      expect(element.id).toBe('test-id');
      expect(element.fill).toBe('#FF0000');
      expect(element.stroke).toBe('#000000');
      expect(element.strokeWidth).toBe('2');
      expect(element.pointerEvents).toBe('none');
    });

    test('deve retornar array vazio para SVG sem elementos gráficos', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad1">
      <stop offset="0%" style="stop-color:rgb(255,255,0)" />
    </linearGradient>
  </defs>
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      expect(result.elements).toHaveLength(0);
    });

    test('deve lançar SVGParseError para arquivo vazio', async () => {
      const filePath = await createTempSVG('');

      await expect(parser.parse(filePath)).rejects.toThrow(SVGParseError);
      await expect(parser.parse(filePath)).rejects.toThrow('Arquivo SVG vazio');
    });

    test('deve lançar SVGParseError para XML malformado', async () => {
      const svgContent = '<svg><path></svg>'; // Tag path não fechada
      const filePath = await createTempSVG(svgContent);

      await expect(parser.parse(filePath)).rejects.toThrow(SVGParseError);
    });

    test('deve lançar SVGParseError para arquivo não encontrado', async () => {
      const nonExistentPath = join(tempDir, 'nao-existe.svg');

      await expect(parser.parse(nonExistentPath)).rejects.toThrow(SVGParseError);
      await expect(parser.parse(nonExistentPath)).rejects.toThrow('Arquivo não encontrado');
    });

    test('deve lançar SVGParseError para documento sem elemento SVG', async () => {
      const xmlContent = '<?xml version="1.0"?><root><child /></root>';
      const filePath = await createTempSVG(xmlContent);

      await expect(parser.parse(filePath)).rejects.toThrow(SVGParseError);
      await expect(parser.parse(filePath)).rejects.toThrow('não contém elemento SVG válido');
    });
  });

  describe('extractElements()', () => {
    test('deve extrair apenas elementos gráficos', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="grad" /></defs>
  <g id="group">
    <path d="M10 10" />
    <rect x="20" y="20" width="10" height="10" />
  </g>
  <text>Texto</text>
  <circle cx="50" cy="50" r="5" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      // Deve extrair apenas path, rect, circle (não defs, g, text)
      expect(result.elements).toHaveLength(3);
      expect(result.elements.map(e => e.tagName)).toEqual(['path', 'rect', 'circle']);
    });
  });

  describe('calculateBounds()', () => {
    test('deve calcular bounds para rect', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="20" width="30" height="40" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const bounds = result.elements[0].bounds;
      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(20);
      expect(bounds.width).toBe(30);
      expect(bounds.height).toBe(40);
      expect(bounds.area).toBe(1200);
    });

    test('deve calcular bounds para circle', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="10" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const bounds = result.elements[0].bounds;
      expect(bounds.x).toBe(40); // cx - r
      expect(bounds.y).toBe(40); // cy - r
      expect(bounds.width).toBe(20); // diameter
      expect(bounds.height).toBe(20); // diameter
      expect(bounds.area).toBeCloseTo(Math.PI * 100, 1); // π * r²
    });

    test('deve calcular bounds para ellipse', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="50" rx="20" ry="10" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const bounds = result.elements[0].bounds;
      expect(bounds.x).toBe(30); // cx - rx
      expect(bounds.y).toBe(40); // cy - ry
      expect(bounds.width).toBe(40); // rx * 2
      expect(bounds.height).toBe(20); // ry * 2
      expect(bounds.area).toBeCloseTo(Math.PI * 200, 1); // π * rx * ry
    });

    test('deve calcular bounds para line', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <line x1="10" y1="20" x2="50" y2="80" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const bounds = result.elements[0].bounds;
      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(20);
      expect(bounds.width).toBe(40);
      expect(bounds.height).toBe(60);
      expect(bounds.area).toBe(2400);
    });

    test('deve retornar bounds padrão para path complexo', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 C 20 20, 40 20, 50 10" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const bounds = result.elements[0].bounds;
      // Fallback para path retorna bounds padrão
      expect(bounds).toBeDefined();
      expect(bounds.area).toBeGreaterThan(0);
    });

    test('deve retornar bounds zero para elementos sem dimensões', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      const bounds = result.elements[0].bounds;
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
      expect(bounds.area).toBe(0);
    });
  });

  describe('Casos extremos', () => {
    test('deve processar SVG com namespace customizado', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:custom="http://example.com" viewBox="0 0 100 100">
  <path d="M10 10" custom:attr="value" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      expect(result.elements).toHaveLength(1);
    });

    test('deve processar SVG com elementos aninhados', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g>
    <g>
      <path d="M10 10" />
      <rect x="20" y="20" width="10" height="10" />
    </g>
  </g>
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      // Deve encontrar elementos mesmo aninhados
      expect(result.elements).toHaveLength(2);
    });

    test('deve processar SVG com comentários', async () => {
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Este é um comentário -->
  <path d="M10 10" />
  <!-- Outro comentário -->
  <rect x="20" y="20" width="10" height="10" />
</svg>`;

      const filePath = await createTempSVG(svgContent);
      const result = await parser.parse(filePath);

      expect(result.elements).toHaveLength(2);
    });
  });
});
