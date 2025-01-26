import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Device } from './types/device';
import { DeviceCard } from './components/DeviceCard';
import { DeviceModal } from './components/DeviceModal';
import { DeleteModal } from './components/DeleteModal';
import { deviceService } from './services/deviceService';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>();
  const [deviceToDelete, setDeviceToDelete] = useState<Device | undefined>();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await deviceService.getAllDevices();
      setDevices(devices);
    } catch (error) {
      setError('Error al cargar los dispositivos');
      console.error(error);
    }
  };

  const handleSaveDevice = async (deviceData: Partial<Device>) => {
    try {
      if (selectedDevice) {
        // Edit existing device
        const updatedDevice = await deviceService.updateDevice(selectedDevice.id, deviceData);
        setDevices(devices.map(device => 
          device.id === selectedDevice.id ? updatedDevice : device
        ));
      } else {
        // Add new device
        const newDevice = await deviceService.createDevice({
          ...deviceData,
          type: 'led',
          status: 'active',
        } as Omit<Device, 'id'>);
        setDevices([...devices, newDevice]);
      }
      setSelectedDevice(undefined);
    } catch (error) {
      setError('Error al guardar el dispositivo');
      console.error(error);
    }
  };

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device);
    setIsDeviceModalOpen(true);
  };

  const handleDeleteDevice = (id: string) => {
    const device = devices.find(d => d.id === id);
    setDeviceToDelete(device);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deviceToDelete) {
      try {
        await deviceService.deleteDevice(deviceToDelete.id);
        setDevices(devices.filter(device => device.id !== deviceToDelete.id));
        setDeviceToDelete(undefined);
      } catch (error) {
        setError('Error al eliminar el dispositivo');
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control IoT</h1>
            <p className="text-gray-600">Gestiona tus dispositivos conectados</p>
          </div>
          <button
            onClick={() => {
              setSelectedDevice(undefined);
              setIsDeviceModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Dispositivo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
            />
          ))}
        </div>
      </div>

      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => {
          setIsDeviceModalOpen(false);
          setSelectedDevice(undefined);
        }}
        onSave={handleSaveDevice}
        device={selectedDevice}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeviceToDelete(undefined);
        }}
        onConfirm={confirmDelete}
        deviceName={deviceToDelete?.name || ''}
      />
    </div>
  );
}

export default App;