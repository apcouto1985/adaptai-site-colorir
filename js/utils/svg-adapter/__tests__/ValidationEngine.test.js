import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { ValidationEngine } from '../ValidationEngine.js';

describe('ValidationEngine', () => {
  let validator;
  let dom;

  beforeEach(() => {
    validator = new ValidationEngine();
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.SVGElement = dom.window.SVGElement;
  });

  describe('validate', () => {
    test('should call SVGManipulator and add suggestions', () => {
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path id="area-1" fill="none" stroke="#000000" stroke-width="2" d="M10,10 L90,90" />
</svg>`;
      
      const doc = new JSDOM(svgString, { contentType: 'image/svg+xml' });
      const svg = doc.window.document.documentElement;
      
      const result = validator.validate(svg);
      
      // Deve retornar estrutura com suggestions
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('colorableAreas');
      expect(result).toHaveProperty('decorativeElements');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('generateSuggestions', () => {
    test('should suggest fixing errors when errors exist', () => {
      const validationResult = {
        valid: false,
        errors: ['ID duplicado encontrado: area-1'],
        warnings: [],
        colorableAreas: ['area-1', 'area-2'],
        decorativeElements: []
      };
      
      const suggestions = validator.generateSuggestions(validationResult);
      
      expect(suggestions).toContain('Corrija os erros antes de usar o SVG');
      expect(suggestions.some(s => s.includes('Execute novamente a transformação'))).toBe(true);
    });

    test('should suggest checking classification when no colorable areas', () => {
      const validationResult = {
        valid: true,
        errors: [],
        warnings: ['Nenhuma área colorível encontrada'],
        colorableAreas: [],
        decorativeElements: ['area-1']
      };
      
      const suggestions = validator.generateSuggestions(validationResult);
      
      expect(suggestions.some(s => s.includes('verifique a classificação'))).toBe(true);
      expect(suggestions.some(s => s.includes('modo interativo'))).toBe(true);
    });

    test('should suggest reviewing warnings when warnings exist', () => {
      const validationResult = {
        valid: true,
        errors: [],
        warnings: ['Elemento decorativo area-1 não possui pointer-events="none"'],
        colorableAreas: ['area-2'],
        decorativeElements: ['area-1']
      };
      
      const suggestions = validator.generateSuggestions(validationResult);
      
      expect(suggestions).toContain('Revise os avisos para garantir qualidade');
      expect(suggestions.some(s => s.includes('pointer-events="none"'))).toBe(true);
    });

    test('should return empty suggestions for valid SVG', () => {
      const validationResult = {
        valid: true,
        errors: [],
        warnings: [],
        colorableAreas: ['area-1', 'area-2'],
        decorativeElements: ['area-3']
      };
      
      const suggestions = validator.generateSuggestions(validationResult);
      
      expect(suggestions).toHaveLength(0);
    });
  });
});
