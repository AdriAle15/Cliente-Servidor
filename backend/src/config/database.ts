import { Pool } from 'pg';

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cliente', //Crear la base de datos cliente
  password: 'passwrod', //Cambiar por el password de la base de datos
  port: 5432,
}); 