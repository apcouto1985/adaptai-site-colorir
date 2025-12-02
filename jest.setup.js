// Setup file for Jest
// Configurações adicionais podem ser adicionadas aqui
import { TextEncoder, TextDecoder } from 'util';

// Adicionar TextEncoder e TextDecoder ao ambiente global
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill para fetch no ambiente de testes Node.js
global.fetch = async (url) => {
  // Mock simples do fetch para testes
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect id="area-1" x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="2"/>
      <circle id="area-2" cx="150" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/>
    </svg>
  `;
  
  return {
    ok: true,
    text: async () => svgContent,
    json: async () => ({}),
  };
};

// Salvar o DOMParser original do JSDOM
const OriginalDOMParser = global.DOMParser;

// Sobrescrever o DOMParser para retornar elementos compatíveis com JSDOM
global.DOMParser = class DOMParser extends OriginalDOMParser {
  parseFromString(str, type) {
    // Usar o DOMParser original do JSDOM
    const doc = super.parseFromString(str, type);
    
    // Garantir que o documentElement seja tratado como SVGElement
    if (doc.documentElement && doc.documentElement.tagName === 'svg') {
      // Marcar como SVGElement para o instanceof funcionar
      Object.defineProperty(doc.documentElement, Symbol.toStringTag, {
        value: 'SVGSVGElement',
        configurable: true
      });
    }
    
    return doc;
  }
};
