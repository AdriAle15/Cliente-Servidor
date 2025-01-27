interface LedState {
  led1: boolean;
  led2: boolean;
  led3: boolean;
}

type WebSocketCallback = (data: any) => void;

class WebSocketService {
  private callbacks: Map<string, WebSocketCallback> = new Map();
  private currentIp: string | null = null;

  async connect(ip: string): Promise<void> {
    this.currentIp = ip.replace('http://', '');
    console.log(`✅ Conectado a ${this.currentIp}`);
  }

  async sendMessage(message: string) {
    if (!this.currentIp) {
      throw new Error('No hay IP configurada');
    }

    try {
      const data = JSON.parse(message);
      if (data.type === 'led') {
        const response = await fetch(`http://${this.currentIp}/led`, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ command: `${data.variable}:${data.state}` }),
        });

        // Con modo no-cors, no podemos leer la respuesta
        // Asumimos que el comando fue exitoso y actualizamos el estado
        this.callbacks.forEach((callback, variable) => {
          if (variable === data.variable) {
            callback({
              type: 'ledState',
              variable: data.variable,
              state: data.state
            });
          }
        });
      }
    } catch (error) {
      console.error('Error al enviar comando:', error);
      throw error;
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

  disconnect() {
    this.currentIp = null;
    this.callbacks.clear();
  }

  isConnected(): boolean {
    return this.currentIp !== null;
  }
}

export const websocketService = new WebSocketService(); 