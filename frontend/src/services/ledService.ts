export interface LedState {
  led1: boolean;
  led2: boolean;
  led3: boolean;
}

class LedService {
  async sendCommand(ip: string, command: string): Promise<LedState> {
    try {
      const response = await fetch(`http://${ip}/led`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        led1: data.led1,
        led2: data.led2,
        led3: data.led3,
      };
    } catch (error) {
      console.error('Error sending LED command:', error);
      throw error;
    }
  }

  async turnOn(ip: string, ledNumber: number): Promise<LedState> {
    return this.sendCommand(ip, `led${ledNumber}:on`);
  }

  async turnOff(ip: string, ledNumber: number): Promise<LedState> {
    return this.sendCommand(ip, `led${ledNumber}:off`);
  }
}

export const ledService = new LedService(); 