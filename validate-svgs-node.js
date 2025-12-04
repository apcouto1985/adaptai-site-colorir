/**
 * Script Node.js para validar todos os SVGs existentes
 * Versão adaptada para rodar fora do navegador
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho base para os desenhos
const DRAWINGS_BASE_PATH = path.join(__dirname, 'assets/drawings');

/**
 * Verifica se um elemento é decorativo
 * @param {Element} element - Elemento a verificar
 * @returns {boolean} True se decorativo
 */
function isDecorativeElement(element) {
  // Verificar pointer-events="none"
  const pointerEvents = element.getAttribute('pointer-events');
  if (pointerEvents === 'none') {
    return true;
  }
  
  // Verificar cores decorativas (cinza, preto)
  const fill = element.getAttribute('fill');
  const decorativeColors = ['#B5B5B5', '#222221', '#000000', 'black', 'gray'];
  if (fill && decorativeColors.includes(fill.toUpperCase())) {
    return true;
  }
  
  return false;
}

/**
 * Valida a estrutura de um SVG
 * @param {Document} svgDoc - Documento SVG
 * @returns {Object} Resultado da validação
 */
function validateSVGStructure(svgDoc) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    colorableAreas: [],
    decorativeElements: []
  };
  
  const svg = svgDoc.querySelector('svg');
  if (!svg) {
    result.valid = false;
    result.errors.push('Elemento <svg> não encontrado');
    return result;
  }
  
  // Verificar IDs únicos
  const ids = new Map();
  const elements = svg.querySelectorAll('[id^="area-"]');
  
  elements.forEach(element => {
    const id = element.getAttribute('id');
    
    if (ids.has(id)) {
      result.errors.push(`ID duplicado encontrado: ${id}`);
      result.valid = false;
    } else {
      ids.set(id, element);
    }
    
    // Classificar elemento
    if (isDecorativeElement(element)) {
      result.decorativeElements.push(id);
      
      // Verificar se elemento decorativo tem pointer-events="none"
      if (element.getAttribute('pointer-events') !== 'none') {
        result.warnings.push(`Elemento decorativo ${id} não tem pointer-events="none"`);
      }
    } else {
      result.colorableAreas.push(id);
    }
  });
  
  // Verificar se há áreas coloríveis
  if (result.colorableAreas.length === 0) {
    result.warnings.push('Nenhuma área colorível encontrada');
  }
  
  return result;
}

/**
 * Valida um arquivo SVG
 * @param {string} svgPath - Caminho do arquivo SVG
 * @returns {Object} Resultado da validação
 */
function validateFile(svgPath) {
  try {
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    const dom = new JSDOM(svgContent, { contentType: 'image/svg+xml' });
    return validateSVGStructure(dom.window.document);
  } catch (error) {
    return {
      valid: false,
      errors: [`Erro ao carregar SVG: ${error.message}`],
      warnings: [],
      colorableAreas: [],
      decorativeElements: []
    };
  }
}

/**
 * Encontra todos os arquivos SVG recursivamente
 * @param {string} dir - Diretório para buscar
 * @returns {string[]} Array de caminhos de arquivos SVG
 */
function findAllSVGs(dir) {
  const svgFiles = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursivamente buscar em subdiretórios
        svgFiles.push(...findAllSVGs(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.svg')) {
        svgFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error.message);
  }
  
  return svgFiles;
}

/**
 * Valida todos os SVGs e gera relatório
 */
function validateAllSVGs() {
  console.log('='.repeat(80));
  console.log('RELATÓRIO DE VALIDAÇÃO DE SVGs');
  console.log('='.repeat(80));
  console.log();
  
  // Encontrar todos os SVGs
  const svgFiles = findAllSVGs(DRAWINGS_BASE_PATH);
  console.log(`Encontrados ${svgFiles.length} arquivos SVG para validar\n`);
  
  if (svgFiles.length === 0) {
    console.log('Nenhum arquivo SVG encontrado!');
    return;
  }
  
  const results = {
    total: svgFiles.length,
    valid: 0,
    invalid: 0,
    withWarnings: 0,
    details: []
  };
  
  // Validar cada SVG
  for (const svgPath of svgFiles) {
    const relativePath = path.relative(DRAWINGS_BASE_PATH, svgPath);
    console.log(`Validando: ${relativePath}`);
    
    try {
      const validation = validateFile(svgPath);
      
      const detail = {
        path: relativePath,
        fullPath: svgPath,
        valid: validation.valid,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        colorableAreas: validation.colorableAreas || [],
        decorativeElements: validation.decorativeElements || []
      };
      
      results.details.push(detail);
      
      if (validation.valid) {
        results.valid++;
        console.log(`  ✓ Válido`);
      } else {
        results.invalid++;
        console.log(`  ✗ Inválido`);
      }
      
      if (validation.warnings && validation.warnings.length > 0) {
        results.withWarnings++;
      }
      
      // Mostrar estatísticas
      console.log(`    Áreas coloríveis: ${detail.colorableAreas.length}`);
      console.log(`    Elementos decorativos: ${detail.decorativeElements.length}`);
      
      // Mostrar erros
      if (detail.errors.length > 0) {
        console.log(`    Erros:`);
        detail.errors.forEach(error => console.log(`      - ${error}`));
      }
      
      // Mostrar warnings
      if (detail.warnings.length > 0) {
        console.log(`    Avisos:`);
        detail.warnings.forEach(warning => console.log(`      - ${warning}`));
      }
      
      console.log();
      
    } catch (error) {
      console.error(`  ✗ Erro ao validar: ${error.message}`);
      results.invalid++;
      results.details.push({
        path: relativePath,
        fullPath: svgPath,
        valid: false,
        errors: [`Erro ao validar: ${error.message}`],
        warnings: [],
        colorableAreas: [],
        decorativeElements: []
      });
      console.log();
    }
  }
  
  // Resumo
  console.log('='.repeat(80));
  console.log('RESUMO DA VALIDAÇÃO');
  console.log('='.repeat(80));
  console.log(`Total de arquivos: ${results.total}`);
  console.log(`Válidos: ${results.valid} (${((results.valid / results.total) * 100).toFixed(1)}%)`);
  console.log(`Inválidos: ${results.invalid} (${((results.invalid / results.total) * 100).toFixed(1)}%)`);
  console.log(`Com avisos: ${results.withWarnings}`);
  console.log();
  
  // Problemas encontrados
  const problemFiles = results.details.filter(d => !d.valid || d.warnings.length > 0);
  
  if (problemFiles.length > 0) {
    console.log('='.repeat(80));
    console.log('ARQUIVOS COM PROBLEMAS');
    console.log('='.repeat(80));
    
    problemFiles.forEach(file => {
      console.log(`\n${file.path}:`);
      
      if (file.errors.length > 0) {
        console.log('  Erros:');
        file.errors.forEach(error => console.log(`    - ${error}`));
      }
      
      if (file.warnings.length > 0) {
        console.log('  Avisos:');
        file.warnings.forEach(warning => console.log(`    - ${warning}`));
      }
    });
    console.log();
  }
  
  // Salvar relatório em JSON
  const reportPath = path.join(__dirname, 'svg-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Relatório detalhado salvo em: ${path.relative(process.cwd(), reportPath)}`);
  console.log();
  
  return results;
}

// Executar validação
validateAllSVGs();
