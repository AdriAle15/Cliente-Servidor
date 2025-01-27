import React, { useEffect, useState } from 'react';
import { Device } from '../types/device';
import { websocketService } from '../services/websocketService';

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onEdit, onDelete }) => {
  const [ledState, setLedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Asegurarnos de que la IP no tenga el protocolo
    const cleanIp = device.ip.replace('http://', '');
    websocketService.connect(cleanIp);
    
    websocketService.setCallback(device.variable, (data) => {
      if (data.type === 'ledState') {
        setLedState(data.state === 'on');
      }
    });

    return () => {
      websocketService.removeCallback(device.variable);
    };
  }, [device.ip, device.variable]);

  const toggleLed = async () => {
    try {
      setIsLoading(true);
      const newState = !ledState;
      
      await websocketService.sendMessage(JSON.stringify({
        type: 'led',
        variable: device.variable,
        state: newState ? 'on' : 'off'
      }));
    } catch (error) {
      console.error('Error al cambiar estado del LED:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{device.name}</h3>
        <div className="space-x-2">
          <button
            onClick={() => onEdit(device)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(device.id)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-600">IP: {device.ip}</p>
        <p className="text-gray-600">Variable: {device.variable}</p>
        <button
          onClick={toggleLed}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            ledState
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-500 hover:bg-gray-600'
          } text-white font-medium ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Loading...' : ledState ? 'Turn Off' : 'Turn On'}
        </button>
      </div>
    </div>
  );
};