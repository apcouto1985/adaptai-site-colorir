# 🎨 Site de Colorir Interativo - AdaptAI

Aplicação web educacional projetada para ajudar crianças atípicas a desenvolverem habilidades motoras finas e familiaridade com o uso do computador através de atividades de colorir interativas.

## ✨ Características

- 🎨 **Desenhos Simples**: Organizados por categorias (Animais, Carros, Comidas)
- 🖱️ **Interface Intuitiva**: Design pensado para crianças
- ♿ **Totalmente Acessível**: Navegação por teclado, ARIA labels, contraste adequado
- 📱 **Responsivo**: Funciona em mobile, tablet e desktop
- 🎯 **Foco Educacional**: Desenvolvimento de habilidades motoras finas
- 💾 **Salvamento Local**: Salve e carregue seus desenhos coloridos
- 🎨 **Paleta de 12 Cores**: Cores vibrantes e fáceis de selecionar
- ⚡ **Performance Otimizada**: Cache de SVG, lazy loading de imagens

## 🚀 Início Rápido

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:5173 no navegador.

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`.

## 🧪 Testes

O projeto possui **146 testes** cobrindo todas as funcionalidades:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Tipos de Testes

- **Testes Unitários**: Validam componentes individuais
- **Testes de Propriedade**: Validam comportamentos em múltiplos cenários usando fast-check
- **Testes de Integração**: Validam fluxos completos da aplicação
- **Testes de Responsividade**: Garantem funcionalidade em todos os viewports

## 📁 Estrutura do Projeto

```
adaptAI/
├── index.html                 # Página principal
├── css/                       # Estilos CSS
│   ├── main.css              # Estilos globais e variáveis
│   ├── gallery.css           # Estilos da galeria
│   ├── coloring-screen.css   # Estilos da tela de colorir
│   ├── color-palette.css     # Estilos da paleta de cores
│   ├── svg-canvas.css        # Estilos do canvas SVG
│   └── error-handling.css    # Estilos de erro
├── js/                        # Código JavaScript
│   ├── main.js               # Ponto de entrada
│   ├── init.js               # Inicialização da aplicação
│   ├── components/           # Componentes UI
│   │   ├── Gallery.js        # Galeria de desenhos
│   │   ├── ColoringScreen.js # Tela de colorir
│   │   ├── ColorPalette.js   # Paleta de cores
│   │   └── SVGCanvas.js      # Canvas para desenhos SVG
│   ├── services/             # Serviços
│   │   ├── SVGManipulator.js # Manipulação de SVG
│   │   └── LoaderService.js  # Carregamento de recursos
│   ├── state/                # Gerenciamento de estado
│   │   └── ApplicationState.js
│   ├── utils/                # Utilitários
│   │   ├── errorHandling.js  # Tratamento de erros
│   │   └── generators.js     # Geradores para testes
│   └── __tests__/            # Testes
├── assets/                    # Recursos estáticos
│   ├── drawings/             # Desenhos SVG por categoria
│   │   ├── animais/
│   │   ├── carros/
│   │   └── comidas/
│   └── thumbnails/           # Miniaturas PNG
│       ├── animais/
│       ├── carros/
│       └── comidas/
└── data/                      # Dados
    └── drawings-catalog.json  # Catálogo de desenhos
```

## 🎨 Como Adicionar Novos Desenhos

### 1. Criar o Arquivo SVG

Os desenhos devem seguir estas convenções:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Áreas coloríveis devem ter IDs únicos -->
  <rect id="area-1" x="10" y="10" width="80" height="80" 
        fill="none" stroke="black" stroke-width="2"/>
  <rect id="area-2" x="110" y="10" width="80" height="80" 
        fill="none" stroke="black" stroke-width="2"/>
  
  <!-- Linhas devem ter stroke-width mínimo de 2px -->
  <path id="area-3" d="M 10 110 L 90 190" 
        fill="none" stroke="black" stroke-width="2"/>
</svg>
```

**Requisitos:**
- Cada área colorível deve ter um `id` único (formato: `area-1`, `area-2`, etc.)
- Linhas devem ter `stroke-width` mínimo de **2px** para facilitar visualização
- Use `fill="none"` para áreas não coloridas inicialmente
- Use `stroke="black"` para contornos

### 2. Criar Miniatura

Gere uma miniatura PNG (200x200px) do desenho:

```bash
# Usando Inkscape (exemplo)
inkscape --export-type=png --export-width=200 --export-height=200 \
  assets/drawings/animais/gato.svg -o assets/thumbnails/animais/gato.png
```

### 3. Atualizar o Catálogo

Adicione o desenho em `data/drawings-catalog.json`:

```json
{
  "categories": [
    {
      "id": "animais",
      "name": "Animais",
      "drawings": [
        {
          "id": "gato",
          "name": "Gato",
          "svgPath": "/assets/drawings/animais/gato.svg",
          "thumbnailPath": "/assets/thumbnails/animais/gato.png"
        }
      ]
    }
  ]
}
```

## 🏗️ Arquitetura

### Componentes Principais

#### Gallery
Exibe todos os desenhos disponíveis organizados por categorias.

```javascript
import { Gallery } from './components/Gallery.js';

const gallery = new Gallery({
  container: document.getElementById('app'),
  onDrawingSelect: (drawing) => {
    console.log('Desenho selecionado:', drawing);
  }
});
```

#### ColoringScreen
Tela principal de colorir que integra paleta de cores e canvas SVG.

```javascript
import { ColoringScreen } from './components/ColoringScreen.js';

const screen = new ColoringScreen(container, {
  drawing: {
    id: 'gato',
    name: 'Gato',
    svgPath: '/assets/drawings/animais/gato.svg'
  },
  onBack: () => {
    console.log('Voltar para galeria');
  }
});
```

#### ColorPalette
Paleta de cores com 12 cores predefinidas.

```javascript
import { ColorPalette } from './components/ColorPalette.js';

const palette = new ColorPalette({
  container: document.getElementById('palette'),
  onColorSelect: (color) => {
    console.log('Cor selecionada:', color);
  }
});
```

#### SVGCanvas
Canvas para renderizar e manipular desenhos SVG.

```javascript
import { SVGCanvas } from './components/SVGCanvas.js';

const canvas = new SVGCanvas(container);
await canvas.loadSVG('/assets/drawings/animais/gato.svg');
canvas.colorArea('area-1', '#FF0000');
```

### Serviços

#### SVGManipulator
Manipula arquivos SVG (carregar, identificar áreas, aplicar cores).

```javascript
import SVGManipulator from './services/SVGManipulator.js';

const manipulator = new SVGManipulator();
const svg = await manipulator.loadSVG('/path/to/drawing.svg');
const areas = manipulator.identifyColorableAreas(svg);
manipulator.applyColorToArea(svg, 'area-1', '#FF0000');
```

#### LoaderService
Carrega recursos (catálogo, desenhos, miniaturas).

```javascript
import LoaderService from './services/LoaderService.js';

const drawings = await LoaderService.loadDrawings();
const byCategory = await LoaderService.loadDrawingsByCategory('animais');
```

## ♿ Acessibilidade

O projeto segue as diretrizes WCAG 2.1 AA:

- ✅ **Navegação por Teclado**: Tab, Enter, Escape
- ✅ **ARIA Labels**: Todos os elementos interativos têm labels apropriados
- ✅ **Contraste**: Mínimo de 4.5:1 para texto
- ✅ **Tamanho de Elementos**: Mínimo 44x44px para touch targets
- ✅ **Tamanho de Fonte**: Mínimo 16px
- ✅ **Indicadores de Foco**: Visuais claros para navegação por teclado

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:

- 📱 **Mobile**: 320px - 767px
- 📱 **Tablet**: 768px - 1023px
- 💻 **Desktop**: 1024px+

### Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  /* Botões mostram apenas ícones */
  /* Grid de galeria: 2 colunas */
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Grid de galeria: 3 colunas */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Grid de galeria: 4 colunas */
  /* Layout otimizado para telas grandes */
}
```

## 🎯 Propriedades de Corretude

O projeto implementa **25 propriedades de corretude** testadas com property-based testing:

1. **Completude da galeria**: Todos os desenhos do catálogo são exibidos
2. **Agrupamento por categoria**: Desenhos organizados corretamente
3. **Navegação para colorir**: Seleção de desenho funciona
4. **Presença de desenho e paleta**: Elementos essenciais presentes
5. **Transformação do cursor**: Cursor muda sobre áreas coloríveis
6. **Aplicação de cor ao clicar**: Cor é aplicada corretamente
7. **Contenção de cor nos limites**: Cor não vaza para outras áreas
8. **Substituição de cor**: Cor anterior é substituída
9. **Marcação visual de cor selecionada**: Feedback visual claro
10. **Uso consistente da cor selecionada**: Mesma cor em múltiplas áreas
11. **Exclusividade de seleção de cor**: Apenas uma cor selecionada por vez
12. **Espessura mínima de linhas**: Linhas com 2px mínimo
13. **Destaque de área sob cursor**: Feedback visual ao passar mouse
14. **Estado inicial sem cor**: Desenhos começam sem cores
15. **Tamanho mínimo de elementos interativos**: 44x44px mínimo
16. **Preservação de estado ao voltar**: Estado mantido na navegação
17. **Tamanho mínimo de fonte**: 16px mínimo
18. **Manutenção de funcionalidades em layouts responsivos**: Funciona em todos os viewports
19. **Equivalência touch e mouse**: Mesma funcionalidade em touch e mouse
20. **Limpeza completa do desenho**: Botão limpar remove todas as cores
21. **Preservação de cor selecionada ao limpar**: Cor selecionada mantida
22. **Formato SVG válido**: Arquivos SVG são válidos
23. **Unicidade de IDs de áreas**: IDs únicos em cada desenho
24. **Modificação do atributo fill**: Atributo fill é modificado corretamente

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com variáveis CSS e Grid/Flexbox
- **JavaScript ES6+**: Módulos, async/await, classes
- **Vite**: Build tool e dev server
- **Jest**: Framework de testes
- **fast-check**: Property-based testing
- **JSDOM**: Testes de DOM

## 📄 Licença

Este projeto é de código aberto e está disponível para fins educacionais.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

Desenvolvido com ❤️ para ajudar crianças atípicas a desenvolverem suas habilidades.
