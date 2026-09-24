import mysql from 'mysql2/promise';

let frappePool;

export function getFrappeDb() {
  if (!frappePool) {
    frappePool = mysql.createPool({
      host: process.env.DB_HOST || 'gateway01.us-west-2.prod.aws.tidbcloud.com',
      port: parseInt(process.env.DB_PORT || '4000', 10),
      user: process.env.DB_USER || '3tPkbUAtasxu8zH.root',
      password: process.env.DB_PASSWORD || 'ElmHVuJsfSTgFEC0',
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
