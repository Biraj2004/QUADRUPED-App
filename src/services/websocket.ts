type StatusCallback = (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
type MessageCallback = (data: Record<string, unknown>) => void;

class RobotWebSocket {
  private ws: WebSocket | null = null;
  private url: string = '';
  private onStatusChange: StatusCallback | null = null;
  private onMessage: MessageCallback | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  setCallbacks(onStatus: StatusCallback, onMsg: MessageCallback) {
    this.onStatusChange = onStatus;
    this.onMessage = onMsg;
  }

  connect(ip: string, port = 80) {
    // Note: ESP32 server can run on port 80 or 81.
    this.url = `ws://${ip}:${port}/ws`;
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect() {
    this.onStatusChange?.('connecting');
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.onStatusChange?.('connected');
    };

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string);
        this.onMessage?.(data);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      this.onStatusChange?.('error');
    };

    this.ws.onclose = () => {
      this.onStatusChange?.('disconnected');
      if (this.shouldReconnect) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this._connect(), 3000);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton
export const robotWS = new RobotWebSocket();
