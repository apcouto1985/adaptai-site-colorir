#!/usr/bin/env node

/**
 * SVG Adapter CLI - Ferramenta de adaptação automática de SVGs para AdaptAI
 * 
 * Esta ferramenta transforma SVGs arbitrários da internet para o formato
 * compatível com o site de colorir AdaptAI, aplicando:
 * - IDs únicos no formato "area-N"
 * - Marcação de elementos decorativos com pointer-events="none"
 * - Ajuste de stroke-width para mínimo 2px
 * - Limpeza de fill em áreas coloríveis
 * 
 * Uso:
 *   node js/utils/svg-adapter.js <input.svg> [output.svg] [--validate] [--interactive]
 *   npm run svg-adapter <input.svg> [output.svg] [--validate] [--interactive]
 */

import { SVGAdapterCLI } from './svg-adapter/SVGAdapterCLI.js';

// Ponto de entrada principal
const cli = new SVGAdapterCLI();
cli.run(process.argv.slice(2));
