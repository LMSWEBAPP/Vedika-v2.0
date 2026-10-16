import mysql from 'mysql2/promise';

let frappePool;

export function getFrappeDb() {
  if (!frappePool) {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;

    if (!host || !user || !password) {
      throw new Error(
        '[frappe-db] Missing required database environment variables (DB_HOST, DB_USER, DB_PASSWORD). Hardcoded credentials have been removed for security.'
      );
    }

    frappePool = mysql.createPool({
      host,
      port: parseInt(process.env.DB_PORT || '4000', 10),
      user,
      password,
      database: process.env.DB_NAME || 'test',
      ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      idleTimeout: 60000,
    });
  }
  return frappePool;
}

export default getFrappeDb;
