import crypto from 'crypto';

function ab64Encode(buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '.');
}

function ab64Decode(str) {
  let s = str.replace(/\./g, '+');
  while (s.length % 4 !== 0) {
    s += '=';
  }
  return Buffer.from(s, 'base64');
}

/**
 * Hashes a plaintext password into Frappe / passlib pbkdf2-sha256 format:
 * $pbkdf2-sha256$<rounds>$<salt_ab64>$<digest_ab64>
 */
export function hashPassword(password, rounds = 29000) {
  const salt = crypto.randomBytes(16);
  const digest = crypto.pbkdf2Sync(password, salt, rounds, 32, 'sha256');
  return `$pbkdf2-sha256$${rounds}$${ab64Encode(salt)}$${ab64Encode(digest)}`;
}

/**
 * Verifies a plaintext password against a Frappe / passlib pbkdf2-sha256 hash string.
 */
export function verifyPassword(password, hashStr) {
  if (!password || !hashStr || typeof hashStr !== 'string') {
    return false;
  }
  const parts = hashStr.split('$');
  if (parts.length < 5 || parts[1] !== 'pbkdf2-sha256') {
    return false;
  }
  const rounds = parseInt(parts[2], 10);
  if (isNaN(rounds) || rounds <= 0) {
    return false;
  }
  try {
    const salt = ab64Decode(parts[3]);
    const expectedDigest = ab64Decode(parts[4]);
    const actualDigest = crypto.pbkdf2Sync(password, salt, rounds, expectedDigest.length, 'sha256');
    return crypto.timingSafeEqual(expectedDigest, actualDigest);
  } catch (err) {
    console.error('[auth-passlib] Verification error:', err);
    return false;
  }
}
