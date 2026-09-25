import crypto from 'crypto';
import { getFrappeDb } from '@/lib/frappe-db';

let cachedConfig = null;
let cacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds in-memory cache

function fernetDecrypt(tokenB64, keyB64) {
  try {
    const key = Buffer.from(keyB64, 'base64');
    const encKey = key.subarray(16, 32);
    const token = Buffer.from(tokenB64, 'base64');
    const iv = token.subarray(9, 25);
    const ciphertext = token.subarray(25, token.length - 32);

    const decipher = crypto.createDecipheriv('aes-128-cbc', encKey, iv);
    // Node.js crypto handles PKCS7 padding automatically
    let dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return dec.toString('utf8');
  } catch (e) {
    console.error('[Google OAuth] Fernet decryption error:', e.message);
    return null;
  }
}

export async function getGoogleOAuthConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL_MS && cachedConfig.clientId && cachedConfig.clientSecret) {
    return cachedConfig;
  }

  let clientId = '';
  let clientSecret = '';

  // 1. Authoritative source: Query TiDB directly for registered client credentials
  try {
    const pool = getFrappeDb();
    const [keyRows] = await pool.query(
      "SELECT client_id FROM `tabSocial Login Key` WHERE name = 'google' LIMIT 1"
    );
    if (keyRows && keyRows.length > 0 && keyRows[0].client_id) {
      clientId = keyRows[0].client_id.trim();
    }

    const [authRows] = await pool.query(
      "SELECT password FROM `__Auth` WHERE doctype = 'Social Login Key' AND name = 'google' AND fieldname = 'client_secret' LIMIT 1"
    );
    if (authRows && authRows.length > 0 && authRows[0].password) {
      const encKey = process.env.ENCRYPTION_KEY || '8kAnz-VWclIhMghrU8g_39K2setlLtLR_9PJL1BjRxY=';
      const decrypted = fernetDecrypt(authRows[0].password, encKey);
      if (decrypted) {
        clientSecret = decrypted.trim();
      }
    }
  } catch (dbErr) {
    console.warn('[Google OAuth Config] Database query notice:', dbErr.message);
  }

  // 2. Fall back to environment variables if database didn't provide credentials
  if (!clientId) {
    clientId = (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim().replace(/^["']|["']$/g, '');
  }
  if (!clientSecret) {
    clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');
  }

  cachedConfig = { clientId, clientSecret };
  cacheTime = now;
  return cachedConfig;
}

export async function getAlternativeClientSecret() {
  // Return the environment variable secret if it differs from the database secret
  const envSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim().replace(/^["']|["']$/g, '');
  return envSecret || null;
}
