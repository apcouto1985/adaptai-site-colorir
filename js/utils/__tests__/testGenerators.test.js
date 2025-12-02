/**
 * Test Generators Tests
 * Tests for custom property-based testing generators
 */

import { jest } from '@jest/globals';
import fc from 'fast-check';
import {
    arbitraryColor,
    arbitraryAreaId,
    arbitraryCategory,
    arbitraryColorableArea,
    arbitraryDrawing,
    arbitraryRGB,
    arbitraryHSL,
    arbitraryFontSize,
    arbitraryInteractiveSize,
    arbitraryStrokeWidth
} from '../testGenerators.js';

describe('Test Generators', () => {
    describe('arbitraryColor', () => {
        test('should generate valid hex colors', () => {
            fc.assert(
                fc.property(arbitraryColor(), (color) => {
                    // Should start with #
                    expect(color).toMatch(/^#/);
                    // Should be 7 characters long (#XXXXXX)
                    expect(color).toHaveLength(7);
                    // Should only contain valid hex characters
                    expect(color).toMatch(/^#[0-9A-F]{6}$/);
                })
            );
        });
    });

    describe('arbitraryAreaId', () => {
        test('should generate valid area IDs', () => {
            fc.assert(
                fc.property(arbitraryAreaId(), (areaId) => {
                    // Should start with 'area-'
                    expect(areaId).toMatch(/^area-/);
                    // Should be followed by a number
                    expect(areaId).toMatch(/^area-\d+$/);
                })
            );
        });
    });

    describe('arbitraryCategory', () => {
        test('should generate valid categories', () => {
            const validCategories = ['animais', 'carros', 'comidas', 'natureza', 'objetos'];
            
            fc.assert(
                fc.property(arbitraryCategory(), (category) => {
                    expect(validCategories).toContain(category);
                })
            );
        });
    });

    describe('arbitraryColorableArea', () => {
        test('should generate valid colorable area objects', () => {
            fc.assert(
                fc.property(arbitraryColorableArea(), (area) => {
                    // Should have required properties
                    expect(area).toHaveProperty('id');
                    expect(area).toHaveProperty('element');
                    expect(area).toHaveProperty('originalFill');
                    
                    // ID should be valid
                    expect(area.id).toMatch(/^area-\d+$/);
                    
                    // Element should be 'path'
                    expect(area.element).toBe('path');
                    
                    // originalFill should be null or valid hex color
                    if (area.originalFill !== null) {
                        expect(area.originalFill).toMatch(/^#[0-9A-F]{6}$/);
                    }
                })
            );
        });
    });

    describe('arbitraryDrawing', () => {
        test('should generate valid drawing objects', () => {
            fc.assert(
                fc.property(arbitraryDrawing(), (drawing) => {
                    // Should have required properties
                    expect(drawing).toHaveProperty('id');
                    expect(drawing).toHaveProperty('name');
                    expect(drawing).toHaveProperty('category');
                    expect(drawing).toHaveProperty('svgPath');
                    expect(drawing).toHaveProperty('thumbnailPath');
                    expect(drawing).toHaveProperty('colorableAreas');
                    
                    // Category should be valid
                    const validCategories = ['animais', 'carros', 'comidas', 'natureza', 'objetos'];
                    expect(validCategories).toContain(drawing.category);
                    
                    // Should have at least one colorable area
                    expect(drawing.colorableAreas.length).toBeGreaterThan(0);
                    expect(drawing.colorableAreas.length).toBeLessThanOrEqual(20);
                })
            );
        });
    });

    describe('arbitraryRGB', () => {
        test('should generate valid RGB color objects', () => {
            fc.assert(
                fc.property(arbitraryRGB(), (rgb) => {
                    // Should have r, g, b properties
                    expect(rgb).toHaveProperty('r');
                    expect(rgb).toHaveProperty('g');
                    expect(rgb).toHaveProperty('b');
                    
                    // Values should be in valid range (0-255)
                    expect(rgb.r).toBeGreaterThanOrEqual(0);
                    expect(rgb.r).toBeLessThanOrEqual(255);
                    expect(rgb.g).toBeGreaterThanOrEqual(0);
                    expect(rgb.g).toBeLessThanOrEqual(255);
                    expect(rgb.b).toBeGreaterThanOrEqual(0);
                    expect(rgb.b).toBeLessThanOrEqual(255);
                })
            );
        });
    });

    describe('arbitraryHSL', () => {
        test('should generate valid HSL color objects', () => {
            fc.assert(
                fc.property(arbitraryHSL(), (hsl) => {
                    // Should have h, s, l properties
                    expect(hsl).toHaveProperty('h');
                    expect(hsl).toHaveProperty('s');
                    expect(hsl).toHaveProperty('l');
                    
                    // Hue should be 0-360
                    expect(hsl.h).toBeGreaterThanOrEqual(0);
                    expect(hsl.h).toBeLessThanOrEqual(360);
                    
                    // Saturation should be 0-100
                    expect(hsl.s).toBeGreaterThanOrEqual(0);
                    expect(hsl.s).toBeLessThanOrEqual(100);
                    
                    // Lightness should be 0-100
                    expect(hsl.l).toBeGreaterThanOrEqual(0);
                    expect(hsl.l).toBeLessThanOrEqual(100);
                })
            );
        });
    });

    describe('arbitraryFontSize', () => {
        test('should generate font sizes >= 16px for accessibility', () => {
            fc.assert(
                fc.property(arbitraryFontSize(), (fontSize) => {
                    // Minimum 16px for accessibility
                    expect(fontSize).toBeGreaterThanOrEqual(16);
                    expect(fontSize).toBeLessThanOrEqual(72);
                })
            );
        });
    });

    describe('arbitraryInteractiveSize', () => {
        test('should generate sizes >= 44x44px for accessibility', () => {
            fc.assert(
                fc.property(arbitraryInteractiveSize(), (size) => {
                    // Should have width and height
                    expect(size).toHaveProperty('width');
                    expect(size).toHaveProperty('height');
                    
                    // Minimum 44px for accessibility
                    expect(size.width).toBeGreaterThanOrEqual(44);
                    expect(size.height).toBeGreaterThanOrEqual(44);
                })
            );
        });
    });

    describe('arbitraryStrokeWidth', () => {
        test('should generate stroke widths >= 2px', () => {
            fc.assert(
                fc.property(arbitraryStrokeWidth(), (strokeWidth) => {
                    // Minimum 2px for visibility
                    expect(strokeWidth).toBeGreaterThanOrEqual(2);
                    expect(strokeWidth).toBeLessThanOrEqual(10);
                })
            );
        });
    });
});
