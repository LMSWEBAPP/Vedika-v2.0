/**
 * mascotBridge.js
 * Bi-directional WebSocket bridge between Vedika WebApp and 24/7 Desktop Mascot (ws://127.0.0.1:8765)
 */

class MascotBridge {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.listeners = new Set();
    this.navListeners = new Set();
    this.statusListeners = new Set();
    this.pendingQueue = [];
    this.hasLoggedOffline = false;

    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  connect() {
    if (typeof window === 'undefined') return;

    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      this.ws = new WebSocket('ws://127.0.0.1:8765');

      this.ws.onopen = () => {
        this.isConnected = true;
        this.hasLoggedOffline = false;
        console.log('[MascotBridge] Connected to 24/7 Desktop Mascot bridge (ws://127.0.0.1:8765)');
        this._notifyStatus(true);

        // Flush any pending messages
        while (this.pendingQueue.length > 0) {
          const item = this.pendingQueue.shift();
          this.send(item);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data);
        } catch (e) {
          // ignore malformed payloads
        }
      };

      this.ws.onerror = () => {
        // Quiet error handling: pet is simply offline or not started yet
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.ws = null;
        if (wasConnected) {
          console.log('[MascotBridge] Mascot connection closed.');
          this._notifyStatus(false);
        }
        this._scheduleReconnect();
      };
    } catch (err) {
      this.isConnected = false;
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3500);
  }

  _handleMessage(msg) {
    const type = msg.type || msg.event;
    const payload = msg.payload || {};

    if (type === 'NAVIGATE_WEBAPP' && payload.route) {
      console.log('[MascotBridge] Mascot requested WebApp navigation to:', payload.route);
      this.navListeners.forEach((fn) => {
        try { fn(payload.route); } catch (e) { console.error(e); }
      });
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
    const msgStr = typeof data === 'string' ? data : JSON.stringify(data);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msgStr);
      return true;
    }
    // Queue message if connecting
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      if (this.pendingQueue.length < 20) {
        this.pendingQueue.push(data);
      }
    }
    return false;
  }

  /**
   * Dispatches Ask Vedika Video Moment to the Desktop Mascot
   */
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
    const payload = {
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
    };
    return this.send(payload);
  }

  /**
   * Dispatches active activity update to trigger mascot animations (e.g. 'chemistry_lab', 'dsa_puzzle')
   */
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
    // Immediately invoke with current state
    try { callback(this.isConnected); } catch (e) {}
    return () => this.statusListeners.delete(callback);
  }

  isMascotConnected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
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
