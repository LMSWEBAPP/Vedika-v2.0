import crypto from 'crypto';
import mysql from 'mysql2/promise';

let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

function fernetDecrypt(tokenB64, keyB64) {
  try {
    const key = Buffer.from(keyB64, 'base64');
    const encKey = key.subarray(16, 32);
    const token = Buffer.from(tokenB64, 'base64');
    const iv = token.subarray(9, 25);
    const ciphertext = token.subarray(25, token.length - 32);

    const decipher = crypto.createDecipheriv('aes-128-cbc', encKey, iv);
    let dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const pad = dec[dec.length - 1];
    return dec.subarray(0, dec.length - pad).toString('utf8');
  } catch (e) {
    return null;
  }
}

export async function getGoogleOAuthConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL_MS && cachedConfig.clientId && cachedConfig.clientSecret) {
    return cachedConfig;
  }

  let clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
  let clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');

  // If credentials are not present in process.env, securely fetch from database
  if (!clientId || !clientSecret) {
    try {
      if (process.env.DB_HOST && process.env.DB_USER) {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 4000,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'test',
          ssl: { rejectUnauthorized: false }
        });

        if (!clientId) {
          const [keyRows] = await connection.execute(
            "SELECT client_id FROM `tabSocial Login Key` WHERE name = 'google' LIMIT 1"
          );
          if (keyRows.length > 0 && keyRows[0].client_id) {
            clientId = keyRows[0].client_id;
          }
        }

        if (!clientSecret) {
          const [authRows] = await connection.execute(
            "SELECT password FROM `__Auth` WHERE doctype = 'Social Login Key' AND name = 'google' AND fieldname = 'client_secret' LIMIT 1"
          );
          if (authRows.length > 0 && authRows[0].password) {
            const encKey = process.env.ENCRYPTION_KEY || '8kAnz-VWclIhMghrU8g_39K2setlLtLR_9PJL1BjRxY=';
            clientSecret = fernetDecrypt(authRows[0].password, encKey);
          }
        }

        await connection.end();
      }
    } catch (err) {
      console.warn('[Google OAuth Config] Failed to load credentials from database:', err.message);
    }
  }

  cachedConfig = { clientId, clientSecret };
  cacheTime = now;
  return cachedConfig;
}

export async function getGoogleClientSecretFallback() {
  try {
    if (process.env.DB_HOST && process.env.DB_USER) {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 4000,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'test',
        ssl: { rejectUnauthorized: false }
      });

      const [authRows] = await connection.execute(
        "SELECT password FROM `__Auth` WHERE doctype = 'Social Login Key' AND name = 'google' AND fieldname = 'client_secret' LIMIT 1"
      );
      await connection.end();

      if (authRows.length > 0 && authRows[0].password) {
        const encKey = process.env.ENCRYPTION_KEY || '8kAnz-VWclIhMghrU8g_39K2setlLtLR_9PJL1BjRxY=';
        return fernetDecrypt(authRows[0].password, encKey);
      }
    }
  } catch (err) {
    console.warn('[Google OAuth Fallback] Failed to fetch secret from database:', err.message);
  }
  return null;
}
