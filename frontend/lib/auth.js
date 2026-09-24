import crypto from 'crypto';

/**
 * Retrieves the cryptographic secret for JWT signing and verification.
 * In production, fails closed if no secret is explicitly configured.
 * In development, generates a per-process ephemeral key to prevent hardcoded forgery.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security Critical] JWT_SECRET / ENCRYPTION_KEY environment variable is missing in production.');
      return null;
    }
    if (!global.__DEV_EPHEMERAL_JWT_SECRET__) {
      global.__DEV_EPHEMERAL_JWT_SECRET__ = crypto.randomBytes(32).toString('hex');
      console.warn('[Security Warning] JWT_SECRET not found in env. Generated ephemeral session secret for local process.');
    }
    return global.__DEV_EPHEMERAL_JWT_SECRET__;
  }
  return secret;
}

/**
 * Signs a payload into a signed JWT string using HMAC-SHA256.
 */
export function signJwt(payload, { expiresIn = 3600 } = {}) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('JWT Secret is not configured.');
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: payload.exp || (now + expiresIn)
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const msg = `${headerB64}.${payloadB64}`;

  const signatureB64 = crypto.createHmac('sha256', secret)
    .update(msg, 'utf8')
    .digest('base64url');

  return `${msg}.${signatureB64}`;
}

/**
 * Verifies a JWT token signature and expiration.
 */
export function verifyJwt(token) {
  if (!token) return null;
  
  // Strip Bearer prefix if present
  const jwtToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  const parts = jwtToken.split('.');
  if (parts.length !== 3) return null;
  
  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Parse payload
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadStr);
    
    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    
    // Compute expected signature
    const msg = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(msg, 'utf8')
      .digest('base64url');
      
    // Compare signatures using timing-safe comparison
    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSig);
    
    if (sigBuf.length !== expBuf.length) {
      return null;
    }
    
    const valid = crypto.timingSafeEqual(sigBuf, expBuf);
    return valid ? payload : null;
  } catch (e) {
    console.error("[Auth] JWT validation exception:", e.message);
    return null;
  }
}

/**
 * Determines whether a user payload or object represents an Administrator.
 */
export function isAdminUser(userOrPayload) {
  if (!userOrPayload) return false;
  const role = (userOrPayload.role || '').toLowerCase();
  const userId = (userOrPayload.user_id || userOrPayload.username || '').toLowerCase();
  const email = (userOrPayload.email || '').toLowerCase();

  return (
    role === 'administrator' ||
    role === 'admin' ||
    role === 'system manager' ||
    userId === 'administrator' ||
    userId === 'admin@lms.com' ||
    email === 'admin@lms.com' ||
    (email.startsWith('admin@') && !email.includes('student'))
  );
}
