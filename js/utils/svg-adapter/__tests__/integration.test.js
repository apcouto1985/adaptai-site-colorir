/**
 * Integration Tests for SVG Adapter
 * Tests the complete end-to-end flow of SVG adaptation
 */

import { SVGAdapterCLI } from '../SVGAdapterCLI.js';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

describe('SVG Adapter Integration Tests', () => {
  const testDir = path.join(process.cwd(), 'test-output');
  let cli;

  beforeEach(async () => {
    cli = new SVGAdapterCLI();
    
    // Create test directory
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('End-to-End Flow', () => {
    it('should complete full adaptation flow: load → process → save', async () => {
      // Arrange: Create test SVG
      const inputPath = path.join(testDir, 'input.svg');
      const outputPath = path.join(testDir, 'output.svg');
      
      const testSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M 10 10 L 50 50" fill="none" stroke="black" stroke-width="1"/>
  <circle cx="100" cy="100" r="30" fill="red" stroke="black"/>
</svg>`;
      
      await writeFile(inputPath, testSVG, 'utf-8');

      // Act: Run adaptation
      const result = await cli.adaptSVG(inputPath, outputPath, false, false);

      // Assert: Check result
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(outputPath);
      expect(result.colorableCount).toBeGreaterThan(0);
      expect(existsSync(outputPath)).toBe(true);

      // Verify output file content
      const outputContent = await readFile(outputPath, 'utf-8');
      expect(outputContent).toContain('<?xml');
      expect(outputContent).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should handle simple SVG with one colorable area', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'simple.svg');
      const outputPath = path.join(testDir, 'simple-adapted.svg');
      
      const simpleSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="1"/>
</svg>`;
      
      await writeFile(inputPath, simpleSVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.colorableCount).toBe(1);
      expect(result.idsAssigned).toBe(1);

      // Verify transformations
      const output = await readFile(outputPath, 'utf-8');
      expect(output).toContain('id="area-1"');
      expect(output).toContain('fill="none"');
      expect(output).toContain('stroke-width="2"');
    });

    it('should handle complex SVG with multiple elements', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'complex.svg');
      const outputPath = path.join(testDir, 'complex-adapted.svg');
      
      const complexSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <path d="M 10 10 L 50 50 L 10 50 Z" fill="none" stroke="blue" stroke-width="1"/>
  <rect x="100" y="100" width="50" height="50" fill="none" stroke="green" stroke-width="1.5"/>
  <circle cx="200" cy="200" r="40" fill="none" stroke="red" stroke-width="0.5"/>
  <ellipse cx="250" cy="50" rx="20" ry="10" fill="black"/>
</svg>`;
      
      await writeFile(inputPath, complexSVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.colorableCount).toBeGreaterThan(0);
      expect(result.decorativeCount).toBeGreaterThan(0);
      expect(result.idsAssigned).toBeGreaterThan(0);

      // Verify output structure
      const output = await readFile(outputPath, 'utf-8');
      expect(output).toContain('area-');
      expect(output).toContain('pointer-events="none"');
    });

    it('should handle SVG with validation enabled', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'validate.svg');
      const outputPath = path.join(testDir, 'validate-adapted.svg');
      
      const testSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="2"/>
</svg>`;
      
      await writeFile(inputPath, testSVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath, true);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.validation).toHaveProperty('valid');
      expect(result.validation).toHaveProperty('errors');
      expect(result.validation).toHaveProperty('warnings');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent input file', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'nonexistent.svg');
      const outputPath = path.join(testDir, 'output.svg');

      // Act & Assert
      await expect(
        cli.adaptSVG(inputPath, outputPath)
      ).rejects.toThrow('não encontrado');
    });

    it('should handle malformed SVG', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'malformed.svg');
      const outputPath = path.join(testDir, 'output.svg');
      
      const malformedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80"
</svg>`;
      
      await writeFile(inputPath, malformedSVG, 'utf-8');

      // Act & Assert
      await expect(
        cli.adaptSVG(inputPath, outputPath)
      ).rejects.toThrow();
    });

    it('should handle empty SVG file', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'empty.svg');
      const outputPath = path.join(testDir, 'output.svg');
      
      await writeFile(inputPath, '', 'utf-8');

      // Act & Assert
      await expect(
        cli.adaptSVG(inputPath, outputPath)
      ).rejects.toThrow();
    });

    it('should handle SVG with no graphic elements', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'no-elements.svg');
      const outputPath = path.join(testDir, 'output.svg');
      
      const emptySVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
</svg>`;
      
      await writeFile(inputPath, emptySVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.colorableCount).toBe(0);
      expect(result.decorativeCount).toBe(0);
    });
  });

  describe('Different SVG Complexities', () => {
    it('should handle SVG with only decorative elements', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'decorative-only.svg');
      const outputPath = path.join(testDir, 'decorative-adapted.svg');
      
      const decorativeSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="2" fill="black"/>
  <rect x="10" y="10" width="5" height="5" fill="#222221"/>
</svg>`;
      
      await writeFile(inputPath, decorativeSVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.colorableCount).toBe(0);
      expect(result.decorativeCount).toBe(2);
      
      const output = await readFile(outputPath, 'utf-8');
      expect(output).toContain('pointer-events="none"');
    });

    it('should handle SVG with mixed element types', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'mixed.svg');
      const outputPath = path.join(testDir, 'mixed-adapted.svg');
      
      const mixedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M 10 10 L 50 50" fill="none" stroke="black" stroke-width="1"/>
  <circle cx="100" cy="100" r="1" fill="black"/>
  <rect x="150" y="150" width="40" height="40" fill="none" stroke="blue" stroke-width="1"/>
  <ellipse cx="50" cy="150" rx="2" ry="2" fill="#B5B5B5"/>
</svg>`;
      
      await writeFile(inputPath, mixedSVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.colorableCount).toBeGreaterThan(0);
      expect(result.decorativeCount).toBeGreaterThan(0);
      expect(result.colorableCount + result.decorativeCount).toBe(4);
    });

    it('should preserve SVG structure and attributes', async () => {
      // Arrange
      const inputPath = path.join(testDir, 'preserve.svg');
      const outputPath = path.join(testDir, 'preserve-adapted.svg');
      
      const testSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="1"/>
</svg>`;
      
      await writeFile(inputPath, testSVG, 'utf-8');

      // Act
      const result = await cli.adaptSVG(inputPath, outputPath);

      // Assert
      expect(result.success).toBe(true);
      
      const output = await readFile(outputPath, 'utf-8');
      expect(output).toContain('viewBox="0 0 100 100"');
      expect(output).toContain('width="100"');
      expect(output).toContain('height="100"');
    });
  });
});
