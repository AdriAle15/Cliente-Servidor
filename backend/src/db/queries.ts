export const QUERIES = {
  CREATE_UUID_EXTENSION: `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
  `,

  DROP_DEVICES_TABLE: `
    DROP TABLE IF EXISTS devices
  `,

  CREATE_DEVICES_TABLE: `
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      ip VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      variable VARCHAR(50) NOT NULL
    )
  `,
  
  GET_ALL_DEVICES: 'SELECT * FROM devices',
  GET_DEVICE_BY_ID: 'SELECT * FROM devices WHERE id = $1',
  CREATE_DEVICE: `
    INSERT INTO devices (name, type, ip, status, variable) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *
  `,
  UPDATE_DEVICE: 'UPDATE devices SET name = $2, type = $3, ip = $4, status = $5, variable = $6 WHERE id = $1 RETURNING *',
  DELETE_DEVICE: 'DELETE FROM devices WHERE id = $1',
}; 