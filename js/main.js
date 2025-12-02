/**
 * Arquivo principal da aplicação
 * Integra Gallery, ColoringScreen e ApplicationState
 */
import { Gallery } from './components/Gallery.js';
import { ColoringScreen } from './components/ColoringScreen.js';
import { ApplicationState } from './state/ApplicationState.js';
import { initCompatibilityCheck } from './utils/BrowserCompatibility.js';
import { errorLogger } from './utils/errorHandling.js';

/**
 * Classe principal da aplicação
 */
class App {
  constructor() {
    this.appContainer = null;
    this.galleryContainer = null;
    this.coloringContainer = null;
    this.gallery = null;
    this.coloringScreen = null;
    this.applicationState = null;
  }

  /**
   * Inicializa a aplicação
   */
  async init() {
    try {
      // Obter container principal
      this.appContainer = document.getElementById('app');
      
      if (!this.appContainer) {
        throw new Error('Container #app não encontrado');
      }

      // Verificar compatibilidade do navegador
      const compatibility = initCompatibilityCheck(this.appContainer);

      if (!compatibility.compatible) {
        console.error('Navegador incompatível:', compatibility.issues);
        return;
      }

      // Logar warnings se houver
      if (compatibility.warnings && compatibility.warnings.length > 0) {
        console.info('[App] Avisos de compatibilidade:', compatibility.warnings);
      }

      console.log('✓ Navegador compatível - inicializando aplicação');

      // Criar containers para galeria e tela de colorir
      this.createContainers();

      // Inicializar gerenciador de estado
      this.applicationState = new ApplicationState({
        galleryContainer: this.galleryContainer,
        coloringContainer: this.coloringContainer
      });

      // Inicializar galeria
      await this.initGallery();

      // Configurar view inicial
      this.applicationState.transitionToGallery(false);

      console.log('✓ Aplicação inicializada com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar aplicação:', error);
      errorLogger.log(error, { phase: 'app-initialization' });
      this.showFatalError(error);
    }
  }

  /**
   * Cria os containers para galeria e tela de colorir
   * @private
   */
  createContainers() {
    // Container da galeria
    this.galleryContainer = document.createElement('div');
    this.galleryContainer.id = 'gallery-container';
    this.galleryContainer.className = 'view-container';
    this.appContainer.appendChild(this.galleryContainer);

    // Container da tela de colorir
    this.coloringContainer = document.createElement('div');
    this.coloringContainer.id = 'coloring-container';
    this.coloringContainer.className = 'view-container';
    this.coloringContainer.style.display = 'none'; // Inicialmente oculto
    this.appContainer.appendChild(this.coloringContainer);
  }

  /**
   * Inicializa a galeria
   * @private
   */
  async initGallery() {
    this.gallery = new Gallery({
      container: this.galleryContainer,
      onDrawingSelect: (drawing) => this.handleDrawingSelect(drawing)
    });

    await this.gallery.init();
  }

  /**
   * Manipula seleção de desenho na galeria
   * @param {Object} drawing - Desenho selecionado
   * @private
   */
  handleDrawingSelect(drawing) {
    console.log('Desenho selecionado:', drawing.name);

    // Transicionar para tela de colorir
    this.applicationState.transitionToColoring(drawing);

    // Destruir tela de colorir anterior se existir
    if (this.coloringScreen) {
      this.coloringScreen.destroy();
    }

    // Criar nova tela de colorir
    this.coloringScreen = new ColoringScreen(this.coloringContainer, {
      drawing: drawing,
      onBack: () => this.handleBackToGallery()
    });
  }

  /**
   * Manipula retorno para galeria
   * @private
   */
  handleBackToGallery() {
    console.log('Voltando para galeria');

    // Destruir tela de colorir
    if (this.coloringScreen) {
      this.coloringScreen.destroy();
      this.coloringScreen = null;
    }

    // Transicionar para galeria preservando estado
    this.applicationState.transitionToGallery(true);
  }

  /**
   * Exibe erro fatal
   * @param {Error} error - Erro ocorrido
   * @private
   */
  showFatalError(error) {
    if (!this.appContainer) {
      this.appContainer = document.getElementById('app') || document.body;
    }

    this.appContainer.innerHTML = `
      <div class="fatal-error" style="padding: 32px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Erro ao Inicializar</h1>
        <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
          Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.
        </p>
        <button 
          onclick="location.reload()" 
          style="
            padding: 12px 24px; 
            font-size: 16px; 
            cursor: pointer; 
            min-width: 44px; 
            min-height: 44px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
          "
        >
          Recarregar Página
        </button>
        ${error.message ? `<p style="font-size: 14px; color: #999; margin-top: 16px;">Detalhes: ${error.message}</p>` : ''}
      </div>
    `;
  }
}

// Criar instância da aplicação
const app = new App();

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Exportar para uso em testes
export default app;
