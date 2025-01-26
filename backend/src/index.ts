import express from 'express';
import cors from 'cors';
import { deviceRoutes } from './routes/deviceRoutes';
import { pool } from './config/database';
import { QUERIES } from './db/queries';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Inicializar la base de datos
const initDatabase = async () => {
  try {
    // Crear extensión UUID
    await pool.query(QUERIES.CREATE_UUID_EXTENSION);
    console.log('Extensión UUID creada o verificada');
    
    // Eliminar tabla si existe
    await pool.query(QUERIES.DROP_DEVICES_TABLE);
    console.log('Tabla anterior eliminada si existía');
    
    // Crear tabla de dispositivos
    await pool.query(QUERIES.CREATE_DEVICES_TABLE);
    console.log('Nueva tabla de dispositivos creada');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};

initDatabase();

// Rutas
app.use('/api/devices', deviceRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 