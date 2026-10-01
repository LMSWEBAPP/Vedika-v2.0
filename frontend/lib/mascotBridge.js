/**
 * mascotBridge.js
 * Dual-Transport Bridge between Vedika WebApp and 24/7 Desktop Mascot:
 * 1. High-speed local WebSocket (ws://127.0.0.1:8765) for local development
 * 2. Instant Same-Origin HTTP Relay (/api/mascot/bridge) for 100% reliable single-tab navigation on production HTTPS
 */

class MascotBridge {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.pollTimer = null;
    this.listeners = new Set();
    this.navListeners = new Set();
    this.statusListeners = new Set();
    this.pendingQueue = [];
    this.tabId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('vedika_mascot_tab_id') || Math.random().toString(36).substring(2, 9))
      : 'server';

    if (typeof window !== 'undefined') {
      try { sessionStorage.setItem('vedika_mascot_tab_id', this.tabId); } catch (e) {}
      window.addEventListener('beforeunload', () => {
        try {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'TAB_UNLOADING',
              payload: { tabId: this.tabId, path: window.location.pathname }
            }));
          }
        } catch (e) {}
      });
      this.init();
    }
  }

  init() {
    if (typeof window === 'undefined') return;
    // 1. Try local WebSocket first
    this.connectWebSocket();
    // 2. Always run the Same-Origin HTTP Relay loop to guarantee single-tab navigation across HTTPS
    this.startHttpRelay();
  }

  connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      this.ws = new WebSocket('ws://127.0.0.1:8765');

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[MascotBridge] Local WebSocket connected (ws://127.0.0.1:8765)');
        this._notifyStatus(true);
        // Announce active tab presence and current path
        try {
          this.ws.send(JSON.stringify({
            type: 'WEBAPP_STATE_UPDATE',
            payload: {
              activity: 'connected',
              page: window.location.pathname + window.location.search,
              tabId: this.tabId
            }
          }));
        } catch (e) {}
        this._flushPendingQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data);
        } catch (e) {}
      };

      this.ws.onerror = () => {
        // Quiet: On HTTPS production Chrome, this fails gracefully and HTTP relay takes over instantly
        if (!this.isHttpRelayActive) {
          this.isConnected = false;
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.isHttpRelayActive) {
          this.isConnected = false;
          this._notifyStatus(false);
        }
        this._scheduleWsReconnect();
      };
    } catch (err) {
      this._scheduleWsReconnect();
    }
  }

  _scheduleWsReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, 1500);
  }

  startHttpRelay() {
    if (typeof window === 'undefined') return;

    const poll = async () => {
      try {
        const currentPath = window.location.pathname + window.location.search;
        const res = await fetch(`/api/mascot/bridge?role=browser&tabId=${this.tabId}&path=${encodeURIComponent(currentPath)}`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          this.isHttpRelayActive = true;
          if (!this.isConnected) {
            this.isConnected = true;
            this._notifyStatus(true);
          }

          if (data && data.command) {
            console.log('[MascotBridge] Received command via HTTP Relay:', data.command);
            this._handleMessage(data.command);
          }

          this._flushPendingQueue();
        }
      } catch (e) {
        // Transient network blip
      } finally {
        this.pollTimer = setTimeout(poll, 700);
      }
    };

    poll();

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          if (this.pollTimer) clearTimeout(this.pollTimer);
          poll();
        }
      });
    }
  }

  _flushPendingQueue() {
    while (this.pendingQueue.length > 0) {
      const item = this.pendingQueue.shift();
      this.send(item);
    }
  }

  _handleMessage(msg) {
    if (!msg) return;
    const type = msg.type || msg.event;
    const payload = msg.payload || {};

    if (type === 'NAVIGATE_WEBAPP' && payload.route) {
      const targetRoute = payload.route;
      console.log('[MascotBridge] Navigating active tab to:', targetRoute);

      // Confirm receipt back to mascot immediately
      this.send({
        type: 'NAVIGATE_ACK',
        payload: {
          route: targetRoute,
          currentPath: typeof window !== 'undefined' ? window.location.pathname : ''
        }
      });

      // 1. Notify Next.js router listener in LayoutWrapper
      if (this.navListeners.size > 0) {
        this.navListeners.forEach((fn) => {
          try { fn(targetRoute); } catch (e) { console.error('[MascotBridge] navListener error:', e); }
        });
      }

      // 2. Guaranteed In-Tab Fallback:
      // If Next.js router.push does not switch the page within 200ms (e.g. frozen worker, pending state, dynamic chunk lag),
      // force browser window.location in the active tab without opening a new window!
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const currentFull = window.location.pathname + window.location.search;
          const targetPathOnly = targetRoute.split('?')[0];
          if (window.location.pathname !== targetPathOnly && currentFull !== targetRoute) {
            console.log('[MascotBridge] Soft router transition pending. Enforcing in-tab location.href:', targetRoute);
            window.location.href = targetRoute;
          }
        }
      }, 200);
    }

    this.listeners.forEach((fn) => {
      try { fn(msg); } catch (e) { console.error(e); }
    });
  }

  _notifyStatus(status) {
    this.statusListeners.forEach((fn) => {
      try { fn(status); } catch (e) { console.error(e); }
    });
  }

  send(data) {
    const payloadObj = typeof data === 'string' ? JSON.parse(data) : data;

    // 1. Try local WebSocket first if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payloadObj));
        return true;
      } catch (e) {}
    }

    // 2. Dispatch via HTTP Relay
    try {
      fetch('/api/mascot/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'browser',
          tabId: this.tabId,
          type: payloadObj.type,
          payload: payloadObj.payload || payloadObj
        })
      }).catch(() => {});
      return true;
    } catch (e) {
      if (this.pendingQueue.length < 20) {
        this.pendingQueue.push(payloadObj);
      }
      return false;
    }
  }

  sendVideoMoment({
    videoId,
    timestampSeconds = 0,
    timestampFormatted = '00:00',
    lessonTitle = '',
    chapterTitle = '',
    courseTitle = '',
    overview = '',
    transcriptSnippet = '',
    conceptSummary = ''
  }) {
    return this.send({
      type: 'ASK_VEDIKA_VIDEO_MOMENT',
      payload: {
        videoId,
        timestampSeconds,
        timestampFormatted,
        lessonTitle,
        chapterTitle,
        courseTitle,
        topic: chapterTitle || lessonTitle || 'Lesson Concept',
        overview,
        conceptSummary,
        transcriptSnippet,
        activity: 'video_lesson'
      }
    });
  }

  sendActivityUpdate(activity, metadata = {}) {
    return this.send({
      type: 'WEBAPP_STATE_UPDATE',
      payload: {
        activity,
        ...metadata
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onNavigate(callback) {
    this.navListeners.add(callback);
    return () => this.navListeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    try { callback(this.isConnected); } catch (e) {}
    return () => this.statusListeners.delete(callback);
  }

  isMascotConnected() {
    return this.isConnected;
  }
}

// Global browser singleton
let instance = null;

export function getMascotBridge() {
  if (typeof window === 'undefined') {
    return {
      isMascotConnected: () => false,
      sendVideoMoment: () => false,
      sendActivityUpdate: () => false,
      subscribe: () => () => {},
      onNavigate: () => () => {},
      onStatusChange: () => () => {}
    };
  }

  if (!instance) {
    instance = new MascotBridge();
  }
  return instance;
}

export default getMascotBridge;
