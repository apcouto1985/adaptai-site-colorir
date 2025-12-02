# Plano de Implementação

- [x] 1. Configurar estrutura do projeto e ambiente de desenvolvimento
  - Criar estrutura de diretórios (css/, js/, assets/, data/)
  - Configurar package.json com dependências (Jest, fast-check, Vite)
  - Configurar Jest para testes unitários e property-based testing
  - Criar arquivo index.html base
  - _Requisitos: Todos_

- [x] 2. Implementar modelos de dados e catálogo de desenhos
  - Criar interfaces TypeScript para Drawing, Category, ColorableArea
  - Criar arquivo drawings-catalog.json com estrutura de categorias
  - Implementar funções de validação de dados
  - _Requisitos: 1.1, 1.2, 1.3, 8.1, 8.2_

- [x] 2.1 Escrever testes de propriedade para modelos de dados
  - **Propriedade 23: Formato SVG válido**
  - **Valida: Requisitos 8.1**
  - **Propriedade 24: Unicidade de IDs de áreas**
  - **Valida: Requisitos 8.2**

- [x] 3. Criar serviço de manipulação SVG
  - Implementar SVGManipulator.loadSVG() para carregar arquivos SVG
  - Implementar SVGManipulator.identifyColorableAreas() para identificar áreas com IDs
  - Implementar SVGManipulator.applyColorToArea() para modificar atributo fill
  - Implementar SVGManipulator.clearAllColors() para remover cores
  - Implementar SVGManipulator.highlightArea() para destaque visual
  - _Requisitos: 8.1, 8.2, 8.3, 2.4, 4.3_

- [x] 3.1 Escrever testes de propriedade para manipulação SVG
  - **Propriedade 8: Contenção de cor nos limites**
  - **Valida: Requisitos 2.4**
  - **Propriedade 25: Modificação do atributo fill**
  - **Valida: Requisitos 8.3**
  - **Propriedade 15: Estado inicial sem cor**
  - **Valida: Requisitos 4.4**

- [x] 4. Implementar serviço de carregamento de recursos
  - Criar LoaderService.loadDrawings() para carregar catálogo
  - Criar LoaderService.loadDrawingsByCategory() para filtrar por categoria
  - Implementar tratamento de erros de carregamento
  - Implementar lazy loading de miniaturas
  - _Requisitos: 1.1, 9.1, 9.4_

- [x] 4.1 Escrever testes unitários para serviço de carregamento
  - Testar carregamento bem-sucedido de catálogo
  - Testar tratamento de erros de rede
  - Testar filtragem por categoria

- [x] 5. Criar componente de paleta de cores
  - Implementar ColorPalette com array de cores predefinidas (mínimo 12 cores)
  - Implementar renderização de grid de cores
  - Implementar seleção de cor com marcação visual
  - Implementar eventos de clique em cores
  - Garantir tamanho mínimo de 44x44px para cada cor
  - _Requisitos: 3.1, 3.2, 3.4, 5.1_

- [x] 5.1 Escrever testes de propriedade para paleta de cores
  - **Propriedade 10: Marcação visual de cor selecionada**
  - **Valida: Requisitos 3.2**
  - **Propriedade 12: Exclusividade de seleção de cor**
  - **Valida: Requisitos 3.4**

- [x] 6. Criar componente Canvas SVG
  - Implementar SVGCanvas para renderizar desenho SVG
  - Implementar detecção de cliques em áreas coloríveis
  - Implementar transformação do cursor em pincel sobre áreas
  - Implementar destaque de área sob cursor
  - Implementar aplicação de cor ao clicar
  - _Requisitos: 2.1, 2.2, 2.3, 2.5, 4.3_

- [x] 6.1 Escrever testes de propriedade para Canvas SVG
  - **Propriedade 6: Transformação do cursor**
  - **Valida: Requisitos 2.2**
  - **Propriedade 7: Aplicação de cor ao clicar**
  - **Valida: Requisitos 2.3**
  - **Propriedade 9: Substituição de cor**
  - **Valida: Requisitos 2.5**
  - **Propriedade 14: Destaque de área sob cursor**
  - **Valida: Requisitos 4.3**

- [x] 7. Implementar componente Tela de Colorir
  - Criar ColoringScreen que integra Canvas SVG e Paleta de Cores
  - Implementar gerenciamento de estado (cor selecionada, áreas coloridas)
  - Implementar botão "Voltar" para retornar à galeria
  - Implementar botão "Limpar" para remover todas as cores
  - Garantir que botões tenham tamanho mínimo de 44x44px
  - _Requisitos: 2.1, 3.3, 5.1, 5.2, 7.1_

- [x] 7.1 Escrever testes de propriedade para Tela de Colorir
  - **Propriedade 5: Presença de desenho e paleta**
  - **Valida: Requisitos 2.1**
  - **Propriedade 11: Uso consistente da cor selecionada**
  - **Valida: Requisitos 3.3**
  - **Propriedade 21: Limpeza completa do desenho**
  - **Valida: Requisitos 7.2**
  - **Propriedade 22: Preservação de cor selecionada ao limpar**
  - **Valida: Requisitos 7.4**

- [x] 8. Criar componente Galeria
  - Implementar Gallery para exibir miniaturas de desenhos
  - Implementar organização por categorias com cabeçalhos visuais
  - Implementar grid responsivo de miniaturas
  - Implementar eventos de clique para seleção de desenho
  - Implementar lazy loading de miniaturas com Intersection Observer
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 9.4_

- [x] 8.1 Escrever testes de propriedade para Galeria
  - **Propriedade 1: Completude da galeria**
  - **Valida: Requisitos 1.1**
  - **Propriedade 2: Agrupamento por categoria**
  - **Valida: Requisitos 1.2**
  - **Propriedade 3: Exibição completa de categoria**
  - **Valida: Requisitos 1.3**
  - **Propriedade 4: Navegação para colorir**
  - **Valida: Requisitos 1.4**

- [x] 9. Implementar gerenciamento de estado da aplicação
  - Criar ApplicationState para gerenciar estado global
  - Implementar transições entre views (gallery ↔ coloring)
  - Implementar preservação de estado ao navegar
  - Implementar sincronização entre componentes
  - _Requisitos: 1.4, 5.3_

- [x] 9.1 Escrever testes de propriedade para gerenciamento de estado
  - **Propriedade 17: Preservação de estado ao voltar**
  - **Valida: Requisitos 5.3**

- [x] 10. Implementar estilos CSS base e responsividade
  - Criar main.css com reset e variáveis CSS
  - Criar gallery.css com estilos da galeria
  - Criar coloring.css com estilos da tela de colorir
  - Implementar media queries para responsividade (<768px e ≥768px)
  - Garantir tamanho mínimo de fonte de 16px
  - Garantir contraste adequado (WCAG AA)
  - _Requisitos: 5.5, 6.1, 6.2_

- [x] 10.1 Escrever testes unitários para estilos responsivos
  - Testar aplicação de classes CSS em diferentes viewports
  - Testar tamanho de fonte mínimo
  - Testar tamanho de elementos interativos

- [x] 11. Implementar suporte a eventos touch
  - Adicionar event listeners para eventos touch (touchstart, touchend)
  - Garantir equivalência entre eventos touch e mouse
  - Testar em dispositivos touch ou emulador
  - _Requisitos: 6.4_

- [x] 11.1 Escrever testes de propriedade para eventos touch
  - **Propriedade 20: Equivalência touch e mouse**
  - **Valida: Requisitos 6.4**

- [x] 12. Criar desenhos SVG de exemplo
  - Criar 3-5 desenhos SVG por categoria seguindo convenções
  - Garantir que cada área tenha id único (area-1, area-2, etc.)
  - Garantir linhas com stroke-width mínimo de 2px
  - Otimizar SVGs com SVGO
  - Gerar miniaturas PNG para cada desenho
  - _Requisitos: 1.5, 4.1, 8.4_

- [x] 12.1 Escrever testes de propriedade para validação de SVG
  - **Propriedade 13: Espessura mínima de linhas**
  - **Valida: Requisitos 4.1**

- [x] 13. Implementar validações de acessibilidade
  - Adicionar atributos ARIA apropriados
  - Implementar navegação por teclado (Tab, Enter, Escape)
  - Adicionar indicadores visuais de foco
  - Garantir tamanho mínimo de elementos interativos (44x44px)
  - _Requisitos: 5.1, 5.5_

- [x] 13.1 Escrever testes de propriedade para acessibilidade
  - **Propriedade 16: Tamanho mínimo de elementos interativos**
  - **Valida: Requisitos 5.1**
  - **Propriedade 18: Tamanho mínimo de fonte**
  - **Valida: Requisitos 5.5**

- [x] 14. Implementar tratamento de erros
  - Adicionar try-catch em operações de carregamento
  - Implementar exibição de placeholders para erros
  - Implementar logging de erros no console
  - Adicionar verificação de compatibilidade do navegador
  - _Requisitos: Todos (robustez)_

- [x] 14.1 Escrever testes unitários para tratamento de erros
  - Testar comportamento com SVG inválido
  - Testar comportamento com falha de rede
  - Testar comportamento com área não colorível

- [x] 15. Implementar otimizações de performance
  - Implementar debouncing para eventos mousemove
  - Implementar caching de SVGs parseados
  - Implementar code splitting se necessário
  - Adicionar compressão de assets (minificação)
  - _Requisitos: 9.1, 9.2, 9.3_

- [x] 16. Criar geradores personalizados para testes
  - Implementar arbitraryDrawing() para gerar desenhos aleatórios
  - Implementar arbitraryColor() para gerar cores hexadecimais
  - Implementar arbitraryAreaId() para gerar IDs de área válidos
  - Implementar arbitraryCategory() para gerar categorias válidas
  - _Requisitos: Todos (qualidade de testes)_

- [x] 17. Checkpoint - Garantir que todos os testes passem
  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [x] 18. Integrar todos os componentes na aplicação principal
  - Criar main.js que inicializa a aplicação
  - Conectar Gallery e ColoringScreen
  - Implementar roteamento entre views
  - Testar fluxo completo: galeria → colorir → voltar
  - _Requisitos: Todos_

- [x] 18.1 Escrever testes de integração
  - Testar fluxo completo de navegação
  - Testar interação entre paleta e canvas
  - Testar carregamento e renderização de SVG real

- [x] 19. Implementar funcionalidades de manutenção de estado
  - Garantir que funcionalidades estejam disponíveis em todos os viewports
  - Testar responsividade em diferentes tamanhos de tela
  - _Requisitos: 6.3_

- [x] 19.1 Escrever testes de propriedade para responsividade
  - **Propriedade 19: Manutenção de funcionalidades em layouts responsivos**
  - **Valida: Requisitos 6.3**

- [x] 20. Checkpoint final - Garantir que todos os testes passem
  - Garantir que todos os testes passem, perguntar ao usuário se surgirem dúvidas.

- [x] 21. Criar documentação e exemplos
  - Documentar estrutura de arquivos SVG
  - Criar README.md com instruções de uso
  - Documentar API dos componentes principais
  - _Requisitos: Todos (manutenibilidade)_
