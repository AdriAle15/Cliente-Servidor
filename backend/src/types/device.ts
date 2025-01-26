export type DeviceType = 'led';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  status: 'active' | 'inactive';
  variable: string;
} 