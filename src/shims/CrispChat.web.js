/**
 * Web shim for react-native-crisp-chat-sdk
 * Uses Crisp's official JavaScript widget ($crisp) on the web.
 * Website ID: dcd331d3-58d2-4d93-aa4f-b5c8feab9d11 (from app.json)
 */

const CRISP_WEBSITE_ID = 'dcd331d3-58d2-4d93-aa4f-b5c8feab9d11';
let isInitialized = false;

const loadCrispWidget = () => {
  if (typeof window === 'undefined' || isInitialized) return;

  window.$crisp = [];
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

  const script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = true;
  document.head.appendChild(script);

  isInitialized = true;
};

const CrispChat = {
  configure: (_websiteId) => {
    loadCrispWidget();
  },

  setTokenId: (tokenId) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'session:data', [[['token_id', tokenId]]]]);
    }
  },

  setUserEmail: (email) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:email', [email]]);
    }
  },

  setUserNickname: (nickname) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:nickname', [nickname]]);
    }
  },

  setUserPhone: (phone) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:phone', [phone]]);
    }
  },

  setUserAvatar: (avatarUrl) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:avatar', [avatarUrl]]);
    }
  },

  setSessionData: (data) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      const pairs = Object.entries(data).map(([key, value]) => [key, String(value)]);
      window.$crisp.push(['set', 'session:data', [pairs]]);
    }
  },

  show: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
    }
  },

  hide: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:hide']);
    }
  },

  open: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:open']);
    }
  },

  close: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:close']);
    }
  },

  resetSession: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'session:reset']);
    }
  },

  sendMessage: (message) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]]);
    }
  },
};

export default CrispChat;
