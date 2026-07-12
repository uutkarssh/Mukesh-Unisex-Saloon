// Session helpers.
//
// Two auth channels, so admin login works everywhere — including inside a
// cross-origin preview iframe where third-party cookies are blocked:
//
//   1. Signed session cookie (mukesh-salon-session) — works same-origin.
//      SameSite=None; Secure when the request is HTTPS, so it also works
//      inside same-site iframes.
//
//   2. Firebase ID token in the Authorization: Bearer <token> header —
//      works even when ALL cookies are blocked (cross-origin iframe).
//      The client sends a fresh Firebase ID token on every admin request;
//      we verify it with the Firebase Admin SDK and look up the email in
//      the AdminUser table to get the role.
//
// Both channels produce the same SessionData shape, so the rest of the app
// (API routes, role checks) is unchanged.

import { cookies, headers } from 'next/headers'
import { createHmac } from 'node:crypto'
import { verifyFirebaseToken } from './firebase-admin'
import { findAdminByEmail } from './queries'

const SESSION_COOKIE = 'mukesh-salon-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET || 'dev-insecure-secret'
  return createHmac('sha256', secret).update(payload).digest('hex')
}

export type SessionData = {
  userId: string
  email: string
  name: string
  role: 'developer' | 'barber'
}

async function isHttpsRequest(): Promise<boolean> {
  try {
    const h = await headers()
    const proto = (h.get('x-forwarded-proto') || '').toLowerCase()
    if (proto.includes('https')) return true
    if ((h.get('x-forwarded-ssl') || '').toLowerCase() === 'on') return true
    return false
  } catch {
    return false
  }
}

export async function setSessionCookie(data: SessionData) {
  const payload = JSON.stringify(data)
  const sig = sign(payload)
  const token = `${Buffer.from(payload).toString('base64')}.${sig}`
  const store = await cookies()
  const https = await isHttpsRequest()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: https ? 'none' : 'lax',
    secure: https,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

// Read the session from the signed cookie.
async function getSessionFromCookie(): Promise<SessionData | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  let payload: string
  try {
    payload = Buffer.from(payloadB64, 'base64').toString('utf8')
  } catch {
    return null
  }
  const expectedSig = sign(payload)
  if (sig !== expectedSig) return null
  try {
    return JSON.parse(payload) as SessionData
  } catch {
    return null
  }
}

// Verify a Firebase ID token (Bearer header) and resolve it to a local
// admin session by looking up the email in the AdminUser table.
async function getSessionFromFirebaseToken(idToken: string): Promise<SessionData | null> {
  try {
    const decoded = await verifyFirebaseToken(idToken)
    if (!decoded.email) return null
    const admin = await findAdminByEmail(decoded.email)
    if (!admin || !admin.active) return null
    return {
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    }
  } catch (err) {
    // Token invalid / expired / Admin SDK not configured — fall through.
    return null
  }
}

// Verify a signed session token (the same format used in the cookie) sent
// as a Bearer header. This lets the legacy email/password login persist
// across reloads inside a cross-origin iframe where cookies are blocked —
// the client stores the token in localStorage and sends it as a header.
function parseSessionToken(token: string): SessionData | null {
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  let payload: string
  try {
    payload = Buffer.from(payloadB64, 'base64').toString('utf8')
  } catch {
    return null
  }
  const expectedSig = sign(payload)
  if (sig !== expectedSig) return null
  try {
    return JSON.parse(payload) as SessionData
  } catch {
    return null
  }
}

// Exported so /api/auth/login can mint a token for the client to store.
export function mintSessionToken(data: SessionData): string {
  const payload = JSON.stringify(data)
  const sig = sign(payload)
  return `${Buffer.from(payload).toString('base64')}.${sig}`
}

// Resolve the current session from ANY available channel:
//   1. Signed cookie (same-origin)
//   2. Firebase ID token in Authorization header (Firebase login, iframe-safe)
//   3. Signed session token in Authorization header (legacy login, iframe-safe)
export async function getSession(): Promise<SessionData | null> {
  // 1. Cookie
  const fromCookie = await getSessionFromCookie()
  if (fromCookie) return fromCookie

  // 2 & 3. Bearer header (Firebase token OR signed session token)
  let bearer: string | null = null
  try {
    const h = await headers()
    const authHeader = h.get('authorization') || ''
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      bearer = authHeader.slice(7).trim()
    }
  } catch {
    return null
  }
  if (!bearer) return null

  // Try signed session token first (fast, no async).
  const fromSessionToken = parseSessionToken(bearer)
  if (fromSessionToken) return fromSessionToken

  // Then try Firebase ID token.
  return await getSessionFromFirebaseToken(bearer)
}

export async function requireAuth(): Promise<SessionData | null> {
  return await getSession()
}

export async function requireRole(role: 'developer' | 'barber'): Promise<SessionData | null> {
  const session = await getSession()
  if (!session) return null
  if (role === 'developer' && session.role !== 'developer') return null
  return session
}
