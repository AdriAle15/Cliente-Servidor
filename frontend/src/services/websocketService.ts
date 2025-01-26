type WebSocketCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private onMessageCallback: WebSocketCallback | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect(ip: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Limpiar cualquier conexión existente
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }

        // Resetear intentos de reconexión
        this.reconnectAttempts = 0;

        // Crear nueva conexión
        this.ws = new WebSocket(`ws://${ip}:81/ws`);

        this.ws.onopen = () => {
          console.log('Conectado al ESP32');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onclose = () => {
          console.log('Desconectado del ESP32');
          this.attemptReconnect(ip);
        };

        this.ws.onerror = (error) => {
          console.error('Error de WebSocket:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          } else {
            this.attemptReconnect(ip);
          }
        };

        this.ws.onmessage = (event) => {
          if (this.onMessageCallback) {
            try {
              const data = JSON.parse(event.data);
              this.onMessageCallback(data);
            } catch (e) {
              console.error('Error al procesar mensaje:', e);
            }
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(ip: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Intento de reconexión ${this.reconnectAttempts} de ${this.maxReconnectAttempts}`);
      
      // Limpiar timeout anterior si existe
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      // Intentar reconexión después de un delay
      this.reconnectTimeout = setTimeout(() => {
        this.connect(ip).catch(error => {
          console.error('Error en reconexión:', error);
        });
      }, 2000 * this.reconnectAttempts); // Incrementar el tiempo entre intentos
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  setOnMessageCallback(callback: WebSocketCallback) {
    this.onMessageCallback = callback;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService(); 