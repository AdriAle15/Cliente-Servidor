import React, { useEffect, useState } from 'react';
import { Device } from '../types/device';
import { Lightbulb } from 'lucide-react';
import { websocketService } from '../services/websocketService';

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onEdit, onDelete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [ledState, setLedState] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const connectToDevice = async () => {
      try {
        await websocketService.connect(device.ip);
        if (mounted) {
          setIsConnected(true);
          
          websocketService.setOnMessageCallback((data) => {
            if (mounted && data.type === 'ledState' && data.variable === device.variable) {
              setLedState(data.state === 'on');
            }
          });
        }
      } catch (error) {
        console.error('Error al conectar con el dispositivo:', error);
        if (mounted) {
          setIsConnected(false);
        }
      }
    };

    connectToDevice();

    return () => {
      mounted = false;
      websocketService.disconnect();
    };
  }, [device.ip, device.variable]);

  const toggleLed = () => {
    if (isConnected) {
      const newState = !ledState;
      websocketService.sendMessage(JSON.stringify({
        type: 'led',
        variable: device.variable,
        state: newState ? 'on' : 'off'
      }));
      setLedState(newState);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100">
            <Lightbulb className={`w-6 h-6 ${ledState ? 'text-yellow-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500">{device.ip}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          className={`w-full py-3 px-4 ${
            ledState 
              ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          } font-medium rounded-lg transition-colors`}
          onClick={toggleLed}
          disabled={!isConnected}
        >
          {ledState ? 'Apagar LED' : 'Encender LED'}
        </button>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => onEdit(device)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(device.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};