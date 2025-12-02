/**
 * Custom Generators for Property-Based Testing
 * Provides arbitrary generators for fast-check property tests
 */

import fc from 'fast-check';

/**
 * Generate random hex color
 * @returns {fc.Arbitrary<string>} Arbitrary hex color string
 */
export function arbitraryColor() {
    return fc.hexaString({ minLength: 6, maxLength: 6 })
        .map(hex => `#${hex.toUpperCase()}`);
}

/**
 * Generate random valid area ID
 * @returns {fc.Arbitrary<string>} Arbitrary area ID
 */
export function arbitraryAreaId() {
    return fc.nat({ max: 100 })
        .map(n => `area-${n}`);
}

/**
 * Generate random valid category
 * @returns {fc.Arbitrary<string>} Arbitrary category name
 */
export function arbitraryCategory() {
    return fc.constantFrom('animais', 'carros', 'comidas', 'natureza', 'objetos');
}

/**
 * Generate random colorable area object
 * @returns {fc.Arbitrary<Object>} Arbitrary colorable area
 */
export function arbitraryColorableArea() {
    return fc.record({
        id: arbitraryAreaId(),
        element: fc.constant('path'), // Simplified for testing
        originalFill: fc.option(arbitraryColor(), { nil: null })
    });
}

/**
 * Generate random drawing object
 * @returns {fc.Arbitrary<Object>} Arbitrary drawing object
 */
export function arbitraryDrawing() {
    return fc.record({
        id: fc.stringOf(fc.char(), { minLength: 5, maxLength: 20 }),
        name: fc.stringOf(fc.char(), { minLength: 3, maxLength: 30 }),
        category: arbitraryCategory(),
        svgPath: fc.webPath().map(path => `/assets/drawings/${path}.svg`),
        thumbnailPath: fc.webPath().map(path => `/assets/thumbnails/${path}.png`),
        colorableAreas: fc.array(arbitraryColorableArea(), { minLength: 1, maxLength: 20 })
    });
}

/**
 * Generate random drawing with specific category
 * @param {string} category - Category name
 * @returns {fc.Arbitrary<Object>} Arbitrary drawing in category
 */
export function arbitraryDrawingInCategory(category) {
    return fc.record({
        id: fc.stringOf(fc.char(), { minLength: 5, maxLength: 20 }),
        name: fc.stringOf(fc.char(), { minLength: 3, maxLength: 30 }),
        category: fc.constant(category),
        svgPath: fc.webPath().map(path => `/assets/drawings/${category}/${path}.svg`),
        thumbnailPath: fc.webPath().map(path => `/assets/thumbnails/${category}/${path}.png`),
        colorableAreas: fc.array(arbitraryColorableArea(), { minLength: 1, maxLength: 20 })
    });
}

/**
 * Generate random catalog structure
 * @returns {fc.Arbitrary<Object>} Arbitrary catalog object
 */
export function arbitraryCatalog() {
    return fc.record({
        categories: fc.array(
            fc.record({
                id: arbitraryCategory(),
                name: fc.stringOf(fc.char(), { minLength: 3, maxLength: 20 }),
                drawings: fc.array(arbitraryDrawing(), { minLength: 1, maxLength: 10 })
            }),
            { minLength: 1, maxLength: 5 }
        )
    });
}

/**
 * Generate random RGB color object
 * @returns {fc.Arbitrary<Object>} Arbitrary RGB color
 */
export function arbitraryRGB() {
    return fc.record({
        r: fc.nat({ max: 255 }),
        g: fc.nat({ max: 255 }),
        b: fc.nat({ max: 255 })
    });
}

/**
 * Generate random HSL color object
 * @returns {fc.Arbitrary<Object>} Arbitrary HSL color
 */
export function arbitraryHSL() {
    return fc.record({
        h: fc.nat({ max: 360 }),
        s: fc.nat({ max: 100 }),
        l: fc.nat({ max: 100 })
    });
}

/**
 * Generate random valid SVG element
 * @returns {fc.Arbitrary<string>} Arbitrary SVG element type
 */
export function arbitrarySVGElement() {
    return fc.constantFrom('path', 'circle', 'rect', 'polygon', 'ellipse');
}

/**
 * Generate random SVG path data
 * @returns {fc.Arbitrary<string>} Arbitrary SVG path
 */
export function arbitrarySVGPath() {
    return fc.array(
        fc.record({
            command: fc.constantFrom('M', 'L', 'C', 'Q', 'Z'),
            x: fc.integer({ min: 0, max: 500 }),
            y: fc.integer({ min: 0, max: 500 })
        }),
        { minLength: 3, maxLength: 10 }
    ).map(commands => 
        commands.map(cmd => `${cmd.command} ${cmd.x} ${cmd.y}`).join(' ')
    );
}

/**
 * Generate random viewport dimensions
 * @returns {fc.Arbitrary<Object>} Arbitrary viewport size
 */
export function arbitraryViewport() {
    return fc.record({
        width: fc.integer({ min: 320, max: 1920 }),
        height: fc.integer({ min: 568, max: 1080 })
    });
}

/**
 * Generate random touch/mouse event coordinates
 * @returns {fc.Arbitrary<Object>} Arbitrary event coordinates
 */
export function arbitraryEventCoordinates() {
    return fc.record({
        clientX: fc.integer({ min: 0, max: 1920 }),
        clientY: fc.integer({ min: 0, max: 1080 }),
        pageX: fc.integer({ min: 0, max: 1920 }),
        pageY: fc.integer({ min: 0, max: 1080 })
    });
}

/**
 * Generate random application state
 * @returns {fc.Arbitrary<Object>} Arbitrary app state
 */
export function arbitraryAppState() {
    return fc.record({
        currentView: fc.constantFrom('gallery', 'coloring'),
        selectedDrawing: fc.option(arbitraryDrawing(), { nil: null }),
        selectedColor: arbitraryColor(),
        appliedColors: fc.dictionary(
            arbitraryAreaId(),
            arbitraryColor()
        )
    });
}

/**
 * Generate random user interaction sequence
 * @returns {fc.Arbitrary<Array>} Arbitrary interaction sequence
 */
export function arbitraryInteractionSequence() {
    return fc.array(
        fc.record({
            type: fc.constantFrom('click', 'hover', 'touch', 'keypress'),
            target: arbitraryAreaId(),
            timestamp: fc.nat({ max: 10000 })
        }),
        { minLength: 1, maxLength: 20 }
    );
}

/**
 * Generate random error object
 * @returns {fc.Arbitrary<Object>} Arbitrary error
 */
export function arbitraryError() {
    return fc.record({
        message: fc.string({ minLength: 5, maxLength: 100 }),
        type: fc.constantFrom('NetworkError', 'ParseError', 'ValidationError', 'RenderError'),
        code: fc.option(fc.nat({ max: 599 }), { nil: null })
    });
}

/**
 * Generate random font size (minimum 16px for accessibility)
 * @returns {fc.Arbitrary<number>} Arbitrary font size
 */
export function arbitraryFontSize() {
    return fc.integer({ min: 16, max: 72 });
}

/**
 * Generate random interactive element size (minimum 44x44px)
 * @returns {fc.Arbitrary<Object>} Arbitrary element size
 */
export function arbitraryInteractiveSize() {
    return fc.record({
        width: fc.integer({ min: 44, max: 200 }),
        height: fc.integer({ min: 44, max: 200 })
    });
}

/**
 * Generate random stroke width (minimum 2px)
 * @returns {fc.Arbitrary<number>} Arbitrary stroke width
 */
export function arbitraryStrokeWidth() {
    return fc.integer({ min: 2, max: 10 });
}

/**
 * Generate random valid URL
 * @returns {fc.Arbitrary<string>} Arbitrary URL
 */
export function arbitraryURL() {
    return fc.webUrl();
}

/**
 * Generate random timestamp
 * @returns {fc.Arbitrary<number>} Arbitrary timestamp
 */
export function arbitraryTimestamp() {
    return fc.nat({ max: Date.now() });
}

/**
 * Generate random user preferences
 * @returns {fc.Arbitrary<Object>} Arbitrary user preferences
 */
export function arbitraryUserPreferences() {
    return fc.record({
        theme: fc.constantFrom('light', 'dark', 'auto'),
        language: fc.constantFrom('pt-BR', 'en-US', 'es-ES'),
        soundEnabled: fc.boolean(),
        animationsEnabled: fc.boolean()
    });
}

// Export all generators as a collection
export const generators = {
    color: arbitraryColor,
    areaId: arbitraryAreaId,
    category: arbitraryCategory,
    colorableArea: arbitraryColorableArea,
    drawing: arbitraryDrawing,
    drawingInCategory: arbitraryDrawingInCategory,
    catalog: arbitraryCatalog,
    rgb: arbitraryRGB,
    hsl: arbitraryHSL,
    svgElement: arbitrarySVGElement,
    svgPath: arbitrarySVGPath,
    viewport: arbitraryViewport,
    eventCoordinates: arbitraryEventCoordinates,
    appState: arbitraryAppState,
    interactionSequence: arbitraryInteractionSequence,
    error: arbitraryError,
    fontSize: arbitraryFontSize,
    interactiveSize: arbitraryInteractiveSize,
    strokeWidth: arbitraryStrokeWidth,
    url: arbitraryURL,
    timestamp: arbitraryTimestamp,
    userPreferences: arbitraryUserPreferences
};

export default generators;
