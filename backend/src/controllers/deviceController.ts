import { Request, Response } from 'express';
import { pool } from '../config/database';
import { QUERIES } from '../db/queries';
import { Device } from '../types/device';

export class DeviceController {
  async getAllDevices(req: Request, res: Response) {
    try {
      console.log('Obteniendo todos los dispositivos');
      const result = await pool.query(QUERIES.GET_ALL_DEVICES);
      console.log('Dispositivos encontrados:', result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
      res.status(500).json({ error: 'Error al obtener los dispositivos' });
    }
  }

  async getDeviceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query(QUERIES.GET_DEVICE_BY_ID, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Dispositivo no encontrado' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el dispositivo' });
    }
  }

  async createDevice(req: Request, res: Response) {
    try {
      const { name, type, ip, status, variable } = req.body as Omit<Device, 'id'>;
      console.log('Creando dispositivo:', { name, type, ip, status, variable });
      
      const result = await pool.query(QUERIES.CREATE_DEVICE, [name, type, ip, status, variable]);
      console.log('Dispositivo creado:', result.rows[0]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error detallado al crear dispositivo:', error);
      res.status(500).json({ error: 'Error al crear el dispositivo' });
    }
  }

  async updateDevice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, type, ip, status, variable } = req.body as Device;
      const result = await pool.query(QUERIES.UPDATE_DEVICE, [id, name, type, ip, status, variable]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Dispositivo no encontrado' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar el dispositivo' });
    }
  }

  async deleteDevice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query(QUERIES.DELETE_DEVICE, [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Dispositivo no encontrado' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el dispositivo' });
    }
  }

  async testDatabase(req: Request, res: Response) {
    try {
      // Probar conexión
      await pool.query('SELECT NOW()');
      
      // Verificar tabla
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      // Contar dispositivos
      const devices = await pool.query('SELECT COUNT(*) FROM devices');
      
      res.json({
        status: 'ok',
        tables: tables.rows,
        deviceCount: devices.rows[0].count
      });
    } catch (error) {
      console.error('Error en prueba de base de datos:', error);
      res.status(500).json({ error: 'Error en prueba de base de datos' });
    }
  }
} 