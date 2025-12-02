/**
 * Serviço de salvamento e carregamento de desenhos
 * Gerencia persistência de desenhos coloridos no localStorage
 */

class SaveLoadService {
  constructor() {
    this.storageKey = 'colorir-saved-drawings';
    this.maxSavedDrawings = 50; // Limite de desenhos salvos
  }

  /**
   * Salva um desenho colorido
   * @param {Object} drawingData - Dados do desenho
   * @param {string} drawingData.drawingId - ID do desenho original
   * @param {string} drawingData.drawingName - Nome do desenho
   * @param {Object} drawingData.coloredAreas - Áreas coloridas {areaId: color}
   * @param {string} drawingData.svgContent - Conteúdo SVG colorido
   * @param {string} [customName] - Nome personalizado para o salvamento
   * @returns {Object} Resultado da operação
   */
  saveDrawing(drawingData, customName = null) {
    try {
      const savedDrawings = this.getSavedDrawings();
      
      const saveData = {
        id: this.generateSaveId(),
        drawingId: drawingData.drawingId,
        drawingName: drawingData.drawingName,
        customName: customName || `${drawingData.drawingName} - ${new Date().toLocaleDateString()}`,
        coloredAreas: { ...drawingData.coloredAreas },
        svgContent: drawingData.svgContent,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Verificar se já existe um salvamento com o mesmo nome
      const existingIndex = savedDrawings.findIndex(saved => 
        saved.customName === saveData.customName
      );

      if (existingIndex !== -1) {
        // Atualizar salvamento existente
        savedDrawings[existingIndex] = saveData;
      } else {
        // Adicionar novo salvamento
        savedDrawings.unshift(saveData);
        
        // Manter limite de salvamentos
        if (savedDrawings.length > this.maxSavedDrawings) {
          savedDrawings.splice(this.maxSavedDrawings);
        }
      }

      this.setSavedDrawings(savedDrawings);

      return {
        success: true,
        saveId: saveData.id,
        message: existingIndex !== -1 ? 'Desenho atualizado com sucesso!' : 'Desenho salvo com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao salvar desenho:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao salvar desenho. Tente novamente.'
      };
    }
  }

  /**
   * Carrega um desenho salvo
   * @param {string} saveId - ID do salvamento
   * @returns {Object|null} Dados do desenho ou null se não encontrado
   */
  loadDrawing(saveId) {
    try {
      const savedDrawings = this.getSavedDrawings();
      const drawing = savedDrawings.find(saved => saved.id === saveId);
      
      if (!drawing) {
        return {
          success: false,
          error: 'Desenho não encontrado'
        };
      }

      return {
        success: true,
        data: drawing
      };
    } catch (error) {
      console.error('Erro ao carregar desenho:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém lista de desenhos salvos
   * @param {string} [drawingId] - Filtrar por ID do desenho original
   * @returns {Array} Lista de desenhos salvos
   */
  getSavedDrawingsList(drawingId = null) {
    try {
      const savedDrawings = this.getSavedDrawings();
      
      let filtered = savedDrawings;
      if (drawingId) {
        filtered = savedDrawings.filter(saved => saved.drawingId === drawingId);
      }

      return filtered.map(saved => ({
        id: saved.id,
        drawingId: saved.drawingId,
        drawingName: saved.drawingName,
        customName: saved.customName,
        savedAt: saved.savedAt,
        preview: this.generatePreview(saved)
      }));
    } catch (error) {
      console.error('Erro ao obter lista de desenhos salvos:', error);
      return [];
    }
  }

  /**
   * Remove um desenho salvo
   * @param {string} saveId - ID do salvamento
   * @returns {Object} Resultado da operação
   */
  deleteDrawing(saveId) {
    try {
      const savedDrawings = this.getSavedDrawings();
      const index = savedDrawings.findIndex(saved => saved.id === saveId);
      
      if (index === -1) {
        return {
          success: false,
          message: 'Desenho não encontrado'
        };
      }

      savedDrawings.splice(index, 1);
      this.setSavedDrawings(savedDrawings);

      return {
        success: true,
        message: 'Desenho removido com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao remover desenho:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao remover desenho'
      };
    }
  }

  /**
   * Exporta desenho como arquivo JSON
   * @param {string} saveId - ID do salvamento
   * @returns {Object} Resultado da operação
   */
  exportDrawing(saveId) {
    try {
      const result = this.loadDrawing(saveId);
      if (!result.success) {
        return result;
      }

      const exportData = {
        ...result.data,
        exportedAt: new Date().toISOString(),
        appVersion: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const filename = `${exportData.customName.replace(/[^a-z0-9]/gi, '_')}.json`;

      return {
        success: true,
        blob,
        url,
        filename,
        message: 'Desenho exportado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao exportar desenho:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao exportar desenho'
      };
    }
  }

  /**
   * Importa desenho de arquivo JSON
   * @param {File} file - Arquivo JSON
   * @returns {Promise<Object>} Resultado da operação
   */
  async importDrawing(file) {
    try {
      if (!file || file.type !== 'application/json') {
        return {
          success: false,
          message: 'Arquivo deve ser um JSON válido'
        };
      }

      const text = await file.text();
      const importData = JSON.parse(text);

      // Validar estrutura do arquivo
      if (!this.validateImportData(importData)) {
        return {
          success: false,
          message: 'Arquivo não é um desenho válido'
        };
      }

      // Gerar novo ID para evitar conflitos
      const saveData = {
        ...importData,
        id: this.generateSaveId(),
        customName: `${importData.customName} (Importado)`,
        savedAt: new Date().toISOString()
      };

      const savedDrawings = this.getSavedDrawings();
      savedDrawings.unshift(saveData);
      
      // Manter limite
      if (savedDrawings.length > this.maxSavedDrawings) {
        savedDrawings.splice(this.maxSavedDrawings);
      }

      this.setSavedDrawings(savedDrawings);

      return {
        success: true,
        saveId: saveData.id,
        message: 'Desenho importado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao importar desenho:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao importar desenho. Verifique o arquivo.'
      };
    }
  }

  /**
   * Limpa todos os desenhos salvos
   * @returns {Object} Resultado da operação
   */
  clearAllSavedDrawings() {
    try {
      localStorage.removeItem(this.storageKey);
      return {
        success: true,
        message: 'Todos os desenhos foram removidos'
      };
    } catch (error) {
      console.error('Erro ao limpar desenhos salvos:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao limpar desenhos salvos'
      };
    }
  }

  /**
   * Obtém estatísticas de uso
   * @returns {Object} Estatísticas
   */
  getStorageStats() {
    try {
      const savedDrawings = this.getSavedDrawings();
      const storageData = localStorage.getItem(this.storageKey) || '';
      
      return {
        totalDrawings: savedDrawings.length,
        storageUsed: new Blob([storageData]).size,
        maxDrawings: this.maxSavedDrawings,
        oldestSave: savedDrawings.length > 0 ? savedDrawings[savedDrawings.length - 1].savedAt : null,
        newestSave: savedDrawings.length > 0 ? savedDrawings[0].savedAt : null
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalDrawings: 0,
        storageUsed: 0,
        maxDrawings: this.maxSavedDrawings,
        oldestSave: null,
        newestSave: null
      };
    }
  }

  // Métodos privados

  /**
   * Obtém desenhos salvos do localStorage
   * @private
   */
  getSavedDrawings() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao ler localStorage:', error);
      return [];
    }
  }

  /**
   * Salva desenhos no localStorage
   * @private
   */
  setSavedDrawings(drawings) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(drawings));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      throw new Error('Erro ao salvar dados. Verifique o espaço disponível.');
    }
  }

  /**
   * Gera ID único para salvamento
   * @private
   */
  generateSaveId() {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gera preview do desenho salvo
   * @private
   */
  generatePreview(savedDrawing) {
    const coloredCount = Object.keys(savedDrawing.coloredAreas).length;
    const colors = [...new Set(Object.values(savedDrawing.coloredAreas))];
    
    return {
      coloredAreas: coloredCount,
      uniqueColors: colors.length,
      primaryColors: colors.slice(0, 3)
    };
  }

  /**
   * Valida dados de importação
   * @private
   */
  validateImportData(data) {
    const requiredFields = ['drawingId', 'drawingName', 'coloredAreas', 'svgContent'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }
}

// Instância singleton
const saveLoadService = new SaveLoadService();

export default saveLoadService;
export { SaveLoadService };
