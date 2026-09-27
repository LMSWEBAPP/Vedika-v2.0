let cachedToken = null;
let cachedTokenPromise = null;
let tokenExpiryTime = 0;

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    if (typeof window !== 'undefined') {
      const decoded = atob(base64);
      return JSON.parse(decoded);
    } else if (typeof Buffer !== 'undefined') {
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Returns the cached JWT token, or fetches a new one if missing or near expiry.
 * Implements a single-flight promise pattern to avoid parallel duplicate fetches.
 */
export async function getJwtToken() {
  const bufferTime = 5 * 60 * 1000; // Refetch if within 5 minutes of expiry
  const now = Date.now();

  // 1. If in-memory cached token is valid and not near expiry, return directly
  if (cachedToken && now < tokenExpiryTime - bufferTime) {
    return cachedToken;
  }

  // 2. Check browser localStorage where user login/session stores tokens
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('vedika_jwt');
    if (localToken) {
      const payload = decodeJwtPayload(localToken);
      if (payload && (!payload.exp || (payload.exp * 1000) > now + bufferTime)) {
        cachedToken = localToken;
        tokenExpiryTime = payload.exp ? payload.exp * 1000 : (now + 86400 * 1000);
        return cachedToken;
      }
    }
  }

  // 3. If a fetch is already in flight, reuse its promise
  if (cachedTokenPromise) {
    return cachedTokenPromise;
  }

  // 4. Start a new fetch and store the promise
  cachedTokenPromise = (async () => {
    try {
      console.warn("[JWT Cache] Fetching a fresh JWT token from API...");
      let res = await fetch('/api/auth/jwt');
      
      // If unauthorized, retry with guest fallback for public educational simulators
      if (!res.ok && res.status === 401) {
        res = await fetch('/api/auth/jwt?guest=true');
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch JWT: ${res.status}`);
      }

      const data = await res.json();
      if (!data.token) {
        throw new Error("No token returned in API response.");
      }

      cachedToken = data.token;
      const payload = decodeJwtPayload(cachedToken);
      if (payload && payload.exp) {
        tokenExpiryTime = payload.exp * 1000;
      } else {
        tokenExpiryTime = Date.now() + 86400 * 1000;
      }

      return cachedToken;
    } catch (error) {
      console.error("[JWT Cache] Token retrieval error:", error);
      // Fallback: Return any available local token even if near expiry
      if (typeof window !== 'undefined') {
        const fallback = localStorage.getItem('token') || localStorage.getItem('jwt');
        if (fallback) return fallback;
      }
      cachedToken = null;
      throw error;
    } finally {
      cachedTokenPromise = null;
    }
  })();

  return cachedTokenPromise;
}

/**
 * Explicitly clears the cached token (useful on logout)
 */
export function clearCachedToken() {
  cachedToken = null;
  cachedTokenPromise = null;
  tokenExpiryTime = 0;
}
