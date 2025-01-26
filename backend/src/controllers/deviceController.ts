import { Request, Response } from 'express';
import { pool } from '../config/database';
import { QUERIES } from '../db/queries';
import { Device } from '../types/device';

export class DeviceController {
  async getAllDevices(req: Request, res: Response) {
    try {
      const result = await pool.query(QUERIES.GET_ALL_DEVICES);
      res.json(result.rows);
    } catch (error) {
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
      const result = await pool.query(QUERIES.CREATE_DEVICE, [name, type, ip, status, variable]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error al crear dispositivo:', error);
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
} 