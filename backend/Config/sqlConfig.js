import dotenv from "dotenv";
dotenv.config();

export const sqlConfigYMDataStore = {
  user: process.env.YMDATA_USER,
  password: process.env.YMDATA_PASSWORD,
  server: process.env.YMDATA_SERVER,
  port: parseInt(process.env.YMDATA_PORT) || 1433,
  database: process.env.YMDATA_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  requestTimeout: 3000000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const sqlConfigYMCE = {
  user: process.env.YMCE_USER,
  password: process.env.YMCE_PASSWORD,
  server: process.env.YMCE_SERVER,
  database: process.env.YMCE_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  requestTimeout: 300000,
  connectionTimeout: 300000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const sqlConfigFCSystem = {
  user: process.env.FC_USER,
  password: process.env.FC_PASSWORD,
  server: process.env.FC_SERVER,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  requestTimeout: 21000000,
  connectionTimeout: 21000000,
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 60000,
  },
};
