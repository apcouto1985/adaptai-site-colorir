/**
 * Arquivo de inicialização da aplicação
 * Verifica compatibilidade do navegador antes de iniciar
 */
import { initCompatibilityCheck } from './utils/browserCompatibility.js';
import { errorLogger } from './utils/errorHandling.js';

/**
 * Inicializa a aplicação após verificar compatibilidade
 */
function initializeApp() {
  try {
    // Obter container principal
    const appContainer = document.getElementById('app') || document.body;

    // Verificar compatibilidade do navegador
    const compatibility = initCompatibilityCheck(appContainer);

    if (!compatibility.compatible) {
      // Mensagem de incompatibilidade já foi exibida por initCompatibilityCheck
      console.error('Navegador incompatível:', compatibility.issues);
      return;
    }

    // Logar warnings se houver
    if (compatibility.warnings && compatibility.warnings.length > 0) {
      console.info('[Init] Avisos de compatibilidade:', compatibility.warnings);
    }

    // Navegador compatível - inicializar aplicação
    console.log('✓ Navegador compatível - inicializando aplicação');
    console.log('Funcionalidades suportadas:', compatibility.features);

    // TODO: Inicializar aplicação principal aqui
    // import('./main.js').then(module => {
    //   module.default.init();
    // });
  } catch (error) {
    console.error('Erro fatal ao inicializar aplicação:', error);
    errorLogger.log(error, { phase: 'initialization' });
    
    // Exibir mensagem de erro genérica
    const appContainer = document.getElementById('app') || document.body;
    appContainer.innerHTML = `
      <div style="padding: 32px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Erro ao Inicializar</h1>
        <p style="font-size: 16px; color: #666;">
          Ocorreu um erro ao inicializar a aplicação. Por favor, recarregue a página.
        </p>
        <button 
          onclick="location.reload()" 
          style="margin-top: 24px; padding: 12px 24px; font-size: 16px; cursor: pointer; min-width: 44px; min-height: 44px;"
        >
          Recarregar Página
        </button>
      </div>
    `;
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export default { initializeApp };
