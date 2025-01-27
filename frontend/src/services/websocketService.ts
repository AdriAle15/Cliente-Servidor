type WebSocketCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: Map<string, WebSocketCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentIp: string | null = null;

  connect(ip: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Si ya hay una conexión activa al mismo IP, solo registrar el callback
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentIp === ip) {
          console.log(`✅ Usando conexión WebSocket existente para ${ip}`);
          resolve();
          return;
        }

        const wsUrl = `ws://${ip}:81/ws`;
        console.log(`Intentando conectar a WebSocket: ${wsUrl}`);

        // Limpiar cualquier conexión existente
        if (this.ws) {
          console.log('Cerrando conexión WebSocket existente...');
          this.ws.close();
          this.ws = null;
        }

        // Resetear intentos de reconexión
        this.reconnectAttempts = 0;
        this.currentIp = ip;

        // Crear nueva conexión con timeout
        const connectionTimeout = setTimeout(() => {
          console.log('⏰ Timeout de conexión alcanzado');
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            reject(new Error('Timeout de conexión'));
          }
        }, 5000);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log(`✅ Conexión WebSocket establecida con ${ip}`);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log(`❌ Conexión WebSocket cerrada. Código: ${event.code}, Razón: ${event.reason || 'No especificada'}`);
          this.currentIp = null;
          this.attemptReconnect(ip);
        };

        this.ws.onerror = (error) => {
          console.error('⚠️ Error en WebSocket:', {
            error,
            readyState: this.ws?.readyState,
            url: this.ws?.url
          });
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.currentIp = null;
            reject(new Error(`No se pudo establecer conexión después de ${this.maxReconnectAttempts} intentos`));
          } else {
            this.attemptReconnect(ip);
          }
        };

        this.ws.onmessage = (event) => {
          console.log(`📩 Mensaje recibido:`, event.data);
          try {
            const data = JSON.parse(event.data);
            // Notificar a todos los callbacks registrados
            this.callbacks.forEach((callback, variable) => {
              if (data.variable === variable) {
                callback(data);
              }
            });
          } catch (e) {
            console.error('Error al procesar mensaje:', e);
          }
        };
      } catch (error) {
        console.error('Error al crear conexión WebSocket:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(ip: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Intento de reconexión ${this.reconnectAttempts} de ${this.maxReconnectAttempts}`);
      
      if (this.reconnectTimeout) {
        console.log('Limpiando timeout de reconexión anterior');
        clearTimeout(this.reconnectTimeout);
      }

      const delay = 2000 * this.reconnectAttempts;
      console.log(`⏳ Esperando ${delay}ms antes de intentar reconexión...`);
      
      this.reconnectTimeout = setTimeout(() => {
        console.log(`🔄 Iniciando reconexión a ${ip}...`);
        this.connect(ip).catch(error => {
          console.error('Error en reconexión:', error);
        });
      }, delay);
    } else {
      console.log('❌ Se alcanzó el máximo de intentos de reconexión');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      console.log('Limpiando timeout de reconexión');
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      console.log('Cerrando conexión WebSocket manualmente');
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  sendMessage(message: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 Enviando mensaje:`, message);
      this.ws.send(message);
    } else {
      console.error('❌ No se puede enviar mensaje: WebSocket no está conectado', {
        readyState: this.ws?.readyState,
        isConnected: this.isConnected()
      });
    }
  }

  setCallback(variable: string, callback: WebSocketCallback) {
    console.log(`Registrando callback para variable: ${variable}`);
    this.callbacks.set(variable, callback);
  }

  removeCallback(variable: string) {
    console.log(`Eliminando callback para variable: ${variable}`);
    this.callbacks.delete(variable);
  }

  isConnected(): boolean {
    const connected = this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    console.log(`Estado de conexión: ${connected ? '🟢 Conectado' : '🔴 Desconectado'}`, {
      readyState: this.ws?.readyState,
      wsExists: this.ws !== null
    });
    return connected;
  }
}

export const websocketService = new WebSocketService(); 