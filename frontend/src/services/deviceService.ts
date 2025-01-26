import { Device } from '../types/device';
import { API_URL } from '../config/api';

export const deviceService = {
  async getAllDevices(): Promise<Device[]> {
    const response = await fetch(`${API_URL}/devices`);
    if (!response.ok) throw new Error('Error al obtener los dispositivos');
    return response.json();
  },

  async createDevice(device: Omit<Device, 'id'>): Promise<Device> {
    const response = await fetch(`${API_URL}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: device.name,
        type: device.type,
        ip: device.ip,
        status: device.status,
        variable: device.variable
      }),
    });
    if (!response.ok) throw new Error('Error al crear el dispositivo');
    return response.json();
  },

  async updateDevice(id: string, device: Partial<Device>): Promise<Device> {
    const response = await fetch(`${API_URL}/devices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: device.name,
        type: device.type,
        ip: device.ip,
        status: device.status,
        variable: device.variable
      }),
    });
    if (!response.ok) throw new Error('Error al actualizar el dispositivo');
    return response.json();
  },

  async deleteDevice(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/devices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el dispositivo');
  },
}; 