import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fc from 'fast-check';
import { ValidationEngine } from '../ValidationEngine.js';

describe('ValidationEngine - Property-Based Tests', () => {
  let validator;

  beforeEach(() => {
    validator = new ValidationEngine();
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.SVGElement = dom.window.SVGElement;
  });

  /**
   * Feature: svg-auto-adapter, Property 15: Validação automática executada
   * Validates: Requirements 8.1
   */
  test('property: validation is executed when requested', () => {
    const svgGenerator = fc.array(
      fc.record({
        id: fc.integer({ min: 1, max: 100 }),
        fill: fc.constantFrom('none', '#FF0000', '#B5B5B5'),
        stroke: fc.oneof(fc.constant(null), fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`)),
        strokeWidth: fc.integer({ min: 1, max: 5 }),
        pointerEvents: fc.oneof(fc.constant(null), fc.constant('none'))
      }),
      { minLength: 1, maxLength: 10 }
    ).map(elements => {
      const elementsXML = elements.map(el => {
        const attrs = [
          `id="area-${el.id}"`,
          `fill="${el.fill}"`,
          el.stroke ? `stroke="${el.stroke}"` : '',
          `stroke-width="${el.strokeWidth}"`,
          el.pointerEvents ? `pointer-events="${el.pointerEvents}"` : ''
        ].filter(Boolean).join(' ');
        
        return `<path ${attrs} d="M10,10 L90,90" />`;
      }).join('\n  ');
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  ${elementsXML}\n</svg>`;
    });

    fc.assert(
      fc.property(svgGenerator, (svgString) => {
        const doc = new JSDOM(svgString, { contentType: 'image/svg+xml' });
        const svg = doc.window.document.documentElement;
        
        const result = validator.validate(svg);
        
        // Validação deve sempre retornar um resultado
        expect(result).toBeDefined();
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('colorableAreas');
        expect(result).toHaveProperty('decorativeElements');
        expect(result).toHaveProperty('suggestions');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 16: Erros e avisos reportados
   * Validates: Requirements 8.3
   */
  test('property: errors and warnings are reported correctly', () => {
    // Gerador que cria SVGs com IDs duplicados intencionalmente
    const svgWithDuplicatesGenerator = fc.array(
      fc.record({
        id: fc.integer({ min: 1, max: 5 }), // Range pequeno para forçar duplicatas
        fill: fc.constantFrom('none', '#FF0000'),
        stroke: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`)
      }),
      { minLength: 2, maxLength: 10 }
    ).map(elements => {
      const elementsXML = elements.map(el => 
        `<path id="area-${el.id}" fill="${el.fill}" stroke="${el.stroke}" d="M10,10 L90,90" />`
      ).join('\n  ');
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  ${elementsXML}\n</svg>`;
    });

    fc.assert(
      fc.property(svgWithDuplicatesGenerator, (svgString) => {
        const doc = new JSDOM(svgString, { contentType: 'image/svg+xml' });
        const svg = doc.window.document.documentElement;
        
        const result = validator.validate(svg);
        
        // Se há IDs duplicados, deve reportar erro
        const ids = new Set();
        const elements = svg.querySelectorAll('[id^="area-"]');
        let hasDuplicates = false;
        
        elements.forEach(el => {
          const id = el.getAttribute('id');
          if (ids.has(id)) {
            hasDuplicates = true;
          }
          ids.add(id);
        });
        
        if (hasDuplicates) {
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 17: Confirmação de validação bem-sucedida
   * Validates: Requirements 8.4
   */
  test('property: confirmation for valid SVGs', () => {
    // Gerador de SVGs válidos (sem duplicatas)
    const validSVGGenerator = fc.array(
      fc.record({
        index: fc.nat(),
        fill: fc.constantFrom('none', '#FF0000'),
        stroke: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
        strokeWidth: fc.integer({ min: 2, max: 5 })
      }),
      { minLength: 1, maxLength: 10 }
    ).map(elements => {
      const elementsXML = elements.map((el, i) => 
        `<path id="area-${i + 1}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth}" d="M10,10 L90,90" />`
      ).join('\n  ');
      
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  ${elementsXML}\n</svg>`;
    });

    fc.assert(
      fc.property(validSVGGenerator, (svgString) => {
        const doc = new JSDOM(svgString, { contentType: 'image/svg+xml' });
        const svg = doc.window.document.documentElement;
        
        const result = validator.validate(svg);
        
        // SVG válido deve ter valid=true e sem erros
        if (result.valid) {
          expect(result.errors).toHaveLength(0);
        }
        
        // Se não há erros, deve ser válido
        if (result.errors.length === 0) {
          expect(result.valid).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: svg-auto-adapter, Property 18: Sugestões de correção
   * Validates: Requirements 8.5
   */
  test('property: suggestions provided for problematic SVGs', () => {
    const problematicSVGGenerator = fc.oneof(
      // SVG com IDs duplicados
      fc.constant(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <path id="area-1" fill="none" stroke="#000000" d="M10,10 L90,90" />
          <path id="area-1" fill="none" stroke="#000000" d="M90,10 L10,90" />
        </svg>
      `),
      // SVG sem áreas coloríveis
      fc.constant(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle id="area-1" fill="#B5B5B5" pointer-events="none" cx="50" cy="50" r="5" />
        </svg>
      `),
      // SVG com elemento decorativo sem pointer-events
      fc.constant(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <path id="area-1" fill="none" stroke="#000000" d="M10,10 L90,90" />
          <circle id="area-2" fill="#B5B5B5" cx="50" cy="50" r="5" />
        </svg>
      `)
    );

    fc.assert(
      fc.property(problematicSVGGenerator, (svgString) => {
        const doc = new JSDOM(svgString, { contentType: 'image/svg+xml' });
        const svg = doc.window.document.documentElement;
        
        const result = validator.validate(svg);
        
        // Se há erros ou avisos, deve fornecer sugestões
        if (result.errors.length > 0 || result.warnings.length > 0) {
          expect(result.suggestions.length).toBeGreaterThan(0);
        }
        
        // Sugestões devem ser strings não vazias
        result.suggestions.forEach(suggestion => {
          expect(typeof suggestion).toBe('string');
          expect(suggestion.length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });
});
