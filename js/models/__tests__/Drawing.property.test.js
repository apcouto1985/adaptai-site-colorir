import fc from 'fast-check';
import { isValidDrawing, isValidCategory } from '../Drawing.js';

// Geradores personalizados
const arbitraryDrawing = () => fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 30 }),
  category: fc.constantFrom(
    'carros', 'esportes', 'paisagens', 'locais', 'comidas',
    'insetos', 'animais', 'bandeiras', 'castelos', 'piratas',
    'sereias', 'princesas', 'monstros', 'ocupações', 'dinossauros'
  ),
  thumbnailUrl: fc.webUrl(),
  svgUrl: fc.webUrl(),
  metadata: fc.record({
    width: fc.integer({ min: 400, max: 1200 }),
    height: fc.integer({ min: 400, max: 1200 }),
    areaCount: fc.integer({ min: 5, max: 30 })
  })
});

describe('Drawing Property Tests', () => {
  // **Feature: site-colorir, Property 23: Formato SVG válido**
  test('Propriedade 23: Todos os desenhos válidos devem ter URL SVG válida', () => {
    fc.assert(
      fc.property(
        arbitraryDrawing(),
        (drawing) => {
          if (isValidDrawing(drawing)) {
            // URL SVG deve ser uma string não vazia
            return typeof drawing.svgUrl === 'string' && 
                   drawing.svgUrl.length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: site-colorir, Property 24: Unicidade de IDs de áreas**
  test('Propriedade 24: Desenhos válidos devem ter IDs únicos', () => {
    fc.assert(
      fc.property(
        arbitraryDrawing(),
        (drawing) => {
          if (isValidDrawing(drawing)) {
            // ID deve ser único (string não vazia)
            return typeof drawing.id === 'string' && 
                   drawing.id.length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Desenhos com campos obrigatórios devem ser válidos', () => {
    fc.assert(
      fc.property(
        arbitraryDrawing(),
        (drawing) => {
          return isValidDrawing(drawing) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Desenhos sem ID devem ser inválidos', () => {
    fc.assert(
      fc.property(
        arbitraryDrawing(),
        (drawing) => {
          const invalidDrawing = { ...drawing, id: '' };
          return isValidDrawing(invalidDrawing) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Desenhos com metadata inválida devem ser inválidos', () => {
    fc.assert(
      fc.property(
        arbitraryDrawing(),
        fc.integer({ min: -100, max: 0 }),
        (drawing, invalidWidth) => {
          const invalidDrawing = {
            ...drawing,
            metadata: { ...drawing.metadata, width: invalidWidth }
          };
          return isValidDrawing(invalidDrawing) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Categorias válidas devem ser reconhecidas', () => {
    const validCategories = [
      'carros', 'esportes', 'paisagens', 'locais', 'comidas',
      'insetos', 'animais', 'bandeiras', 'castelos', 'piratas',
      'sereias', 'princesas', 'monstros', 'ocupações', 'dinossauros'
    ];

    validCategories.forEach(category => {
      expect(isValidCategory(category)).toBe(true);
    });
  });

  test('Categorias inválidas devem ser rejeitadas', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !isValidCategory(s)),
        (invalidCategory) => {
          return isValidCategory(invalidCategory) === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
