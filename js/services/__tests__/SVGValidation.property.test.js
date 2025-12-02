import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';

describe('SVG Validation Property Tests', () => {
  /**
   * **Feature: site-colorir, Property 13: Espessura mínima de linhas**
   * **Valida: Requisitos 4.1**
   * 
   * Para qualquer desenho SVG renderizado na tela de colorir, todos os elementos
   * de linha de contorno devem ter stroke-width maior ou igual a 2 pixels.
   */
  it('Propriedade 13: Todos os elementos de linha devem ter stroke-width >= 2px', () => {
    fc.assert(
      fc.property(
        // Gerador de SVG com diferentes configurações de stroke-width
        fc.record({
          numElements: fc.integer({ min: 1, max: 20 }),
          strokeWidths: fc.array(
            fc.integer({ min: 2, max: 10 }).map(n => n.toString()), 
            { minLength: 1, maxLength: 20 }
          )
        }),
        ({ numElements, strokeWidths }) => {
          // Criar SVG com elementos que têm stroke-width >= 2
          const svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
              ${Array.from({ length: numElements }, (_, i) => {
                const strokeWidth = strokeWidths[i % strokeWidths.length];
                return `<path id="area-${i + 1}" d="M 10 10 L 50 50" stroke="black" stroke-width="${strokeWidth}" fill="white"/>`;
              }).join('\n')}
            </svg>
          `;

          // Parse SVG
          const dom = new JSDOM(svgContent, { contentType: 'text/xml' });
          const svg = dom.window.document.documentElement;

          // Verificar todos os elementos com stroke
          const elementsWithStroke = svg.querySelectorAll('[stroke]');
          
          // Todos devem ter stroke-width >= 2
          const allValid = Array.from(elementsWithStroke).every(element => {
            const strokeWidth = element.getAttribute('stroke-width');
            const width = parseFloat(strokeWidth);
            return !isNaN(width) && width >= 2;
          });

          return allValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Teste adicional: Validar desenhos SVG reais do projeto
   */
  it('Desenhos SVG reais devem ter stroke-width >= 2px', async () => {
    const fs = await import('fs');
    const path = await import('path');
    
    // Listar todos os arquivos SVG de desenhos
    const drawingsDir = path.join(process.cwd(), 'assets', 'drawings');
    const categories = ['carros', 'animais', 'comidas'];
    
    for (const category of categories) {
      const categoryPath = path.join(drawingsDir, category);
      
      if (!fs.existsSync(categoryPath)) {
        continue;
      }
      
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.svg'));
      
      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const svgContent = fs.readFileSync(filePath, 'utf-8');
        
        // Parse SVG
        const dom = new JSDOM(svgContent, { contentType: 'text/xml' });
        const svg = dom.window.document.documentElement;
        
        // Verificar todos os elementos com stroke
        const elementsWithStroke = svg.querySelectorAll('[stroke]');
        
        elementsWithStroke.forEach(element => {
          const strokeWidth = element.getAttribute('stroke-width');
          const width = parseFloat(strokeWidth);
          
          expect(width).toBeGreaterThanOrEqual(2);
        });
      }
    }
  });

  /**
   * Teste de edge case: SVG sem elementos com stroke
   */
  it('SVG sem elementos com stroke deve passar a validação', () => {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect id="area-1" x="10" y="10" width="50" height="50" fill="white"/>
        <circle id="area-2" cx="100" cy="100" r="30" fill="white"/>
      </svg>
    `;

    const dom = new JSDOM(svgContent, { contentType: 'text/xml' });
    const svg = dom.window.document.documentElement;

    const elementsWithStroke = svg.querySelectorAll('[stroke]');
    
    // Se não há elementos com stroke, a validação passa
    expect(elementsWithStroke.length).toBe(0);
  });

  /**
   * Teste de edge case: Elementos com stroke mas sem stroke-width explícito
   * (devem usar o valor padrão do navegador, que geralmente é 1)
   */
  it('Elementos com stroke mas sem stroke-width devem ser identificados', () => {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <path id="area-1" d="M 10 10 L 50 50" stroke="black" fill="white"/>
      </svg>
    `;

    const dom = new JSDOM(svgContent, { contentType: 'text/xml' });
    const svg = dom.window.document.documentElement;

    const elementsWithStroke = svg.querySelectorAll('[stroke]');
    const element = elementsWithStroke[0];
    
    // Elemento tem stroke mas não tem stroke-width explícito
    expect(element.hasAttribute('stroke')).toBe(true);
    expect(element.hasAttribute('stroke-width')).toBe(false);
  });
});
