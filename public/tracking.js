/**
 * Track SaaS - Script de Tracking
 * 
 * Uso:
 * <script>
 *   window.TRACK_FUNNEL_ID = 'uuid-do-funnel';
 *   window.TRACK_SUPABASE_URL = 'https://seu-projeto.supabase.co'; // Opcional
 * </script>
 * <script src="https://seu-dominio.com/tracking.js"></script>
 */

(function() {
  'use strict';

  // Configuração
  const STORAGE_KEY = 'trk_session';
  
  // Obter FUNNEL_ID de múltiplas fontes
  let FUNNEL_ID = window.TRACK_FUNNEL_ID;
  
  // Tentar obter do atributo data-funnel do script
  if (!FUNNEL_ID) {
    const scriptTag = document.querySelector('script[data-funnel]');
    if (scriptTag) {
      FUNNEL_ID = scriptTag.getAttribute('data-funnel');
    }
  }
  
  // Tentar obter de variável global alternativa
  if (!FUNNEL_ID && window.TrackSaaSConfig && window.TrackSaaSConfig.funnelId) {
    FUNNEL_ID = window.TrackSaaSConfig.funnelId;
  }

  // Verificar se o funnel ID está configurado
  if (!FUNNEL_ID) {
    console.warn('TrackSaaS: TRACK_FUNNEL_ID não configurado');
    return;
  }

  /**
   * Gera um UUID usando crypto.randomUUID
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para navegadores antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Obtém ou cria sessionId
   * Armazena em localStorage.setItem('trk_session', sessionId)
   */
  function getSession() {
    try {
      let sessionId = localStorage.getItem(STORAGE_KEY);
      
      if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem(STORAGE_KEY, sessionId);
      }
      
      return sessionId;
    } catch (e) {
      console.warn('TrackSaaS: Erro ao acessar localStorage', e);
      // Fallback: gerar sessionId temporário
      return generateUUID();
    }
  }

  /**
   * Obtém IP do visitante via requisição remota
   */
  async function getVisitorIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        cache: 'no-cache'
      });
      const data = await response.json();
      return data.ip || null;
    } catch (e) {
      console.warn('TrackSaaS: Erro ao obter IP', e);
      return null;
    }
  }

  /**
   * Identifica dados do visitante
   */
  function getVisitorData() {
    return {
      ip: null, // Será preenchido assincronamente
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Obtém URL base da API
   */
  function getApiBaseUrl() {
    // Tentar obter do atributo data-api-url do script
    const scriptTag = document.querySelector('script[data-api-url]');
    if (scriptTag) {
      return scriptTag.getAttribute('data-api-url');
    }
    
    // Tentar obter de variável global
    if (window.TRACK_API_URL) {
      return window.TRACK_API_URL;
    }
    
    // Fallback: usar URL atual removendo pathname
    const currentUrl = new URL(window.location.href);
    return `${currentUrl.protocol}//${currentUrl.host}`;
  }

  /**
   * Envia evento para API Route do Next.js
   */
  async function sendEvent(endpoint, body) {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const url = `${apiBaseUrl}/api/track/${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        keepalive: true // Permite que a requisição continue mesmo após navegação
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('TrackSaaS: Erro ao enviar evento', endpoint, error);
      return null;
    }
  }

  /**
   * Inicializa tracking de pageview
   * Envia POST para /api/track/pageview ao carregar a página
   */
  async function initPageview() {
    const sessionId = getSession();
    const visitorData = getVisitorData();
    
    // Tentar obter IP (não bloqueia se falhar)
    let ip = null;
    try {
      ip = await getVisitorIP();
    } catch (e) {
      // Ignora erro
    }

    const payload = {
      funnel_id: FUNNEL_ID,
      session_id: sessionId,
      url: visitorData.url,
      userAgent: visitorData.userAgent,
      ip: ip
    };

    // Enviar para API Route
    await sendEvent('pageview', payload);
  }

  /**
   * Adiciona sessionId à URL do Telegram
   * Formato: https://t.me/NOME_DO_CANAL?s=sessionId
   */
  function addSessionToTelegramUrl(url, sessionId) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('s', sessionId);
      return urlObj.toString();
    } catch (e) {
      // Se não for uma URL válida, retornar como está
      return url;
    }
  }

  /**
   * Inicializa tracking de cliques
   * Registra clicks em elementos com atributo data-track-btn="id"
   */
  function initClickTracking() {
    // Usar event delegation para melhor performance
    document.addEventListener('click', async function(e) {
      const target = e.target.closest('[data-track-btn]');
      
      if (!target) {
        return;
      }

      const buttonId = target.getAttribute('data-track-btn');
      const sessionId = getSession();
      const url = window.location.href;

      // Enviar evento de click
      await sendEvent('click', {
        funnel_id: FUNNEL_ID,
        session_id: sessionId,
        button_id: buttonId,
        url: url
      });

      // Verificar se é um link do Telegram e adicionar sessionId automaticamente
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a');
        const href = link.getAttribute('href');
        
        if (href && href.includes('t.me/')) {
          e.preventDefault();
          const newUrl = addSessionToTelegramUrl(href, sessionId);
          window.location.href = newUrl;
          return;
        }
      }
    }, true); // Usar capture phase para pegar antes de outros handlers
  }

  // Auto-inicializar quando o script carrega
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initPageview();
      initClickTracking();
    });
  } else {
    // DOM já carregado
    initPageview();
    initClickTracking();
  }

  // Expor funções globalmente para uso manual se necessário
  window.TrackSaaS = {
    getSession: getSession,
    sendEvent: sendEvent,
    initPageview: initPageview,
    initClickTracking: initClickTracking,
    addSessionToTelegramUrl: addSessionToTelegramUrl
  };

})();
