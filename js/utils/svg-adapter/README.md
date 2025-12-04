# SVG Adapter - Ferramenta de Adaptação Automática de SVGs

Esta ferramenta adapta automaticamente arquivos SVG encontrados na internet para o formato compatível com o site de colorir AdaptAI.

## Estrutura de Componentes

```
svg-adapter/
├── SVGAdapterCLI.js       # Interface de linha de comando
├── SVGParser.js           # Parser de arquivos SVG
├── ElementClassifier.js   # Classificador de elementos (coloríveis vs decorativos)
├── TransformEngine.js     # Motor de transformação de SVG
├── ValidationEngine.js    # Motor de validação
└── SVGGenerator.js        # Gerador de arquivos SVG
```

## Uso

```bash
# Usando npm script
npm run svg-adapter input.svg output.svg --validate

# Usando node diretamente
node js/utils/svg-adapter.js input.svg output.svg --validate --interactive
```

## Opções

- `--validate`: Executa validação automática após adaptação
- `--interactive`: Modo interativo para revisão manual de classificações
- `--help`: Exibe ajuda

## Heurísticas de Classificação

A ferramenta classifica elementos automaticamente usando estas heurísticas:

1. **Colorível**: `fill="none"` + `stroke` definido
2. **Decorativo**: Área < 100px²
3. **Decorativo**: Cores decorativas (#000000, #222221, #B5B5B5, #FFFFFF)
4. **Decorativo**: `fill` com cor + `stroke` definido

## Transformações Aplicadas

### Áreas Coloríveis
- ID único no formato `area-N` (sequencial começando em 1)
- `fill="none"`
- `stroke-width` mínimo de 2px
- Remove `pointer-events` se existir

### Elementos Decorativos
- Adiciona `pointer-events="none"`
- Preserva `fill` e `stroke` originais
- Não recebe ID no formato `area-N`
