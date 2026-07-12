// Client-side admin auth manager.
//
// Two persistence channels, both iframe-safe:
//
//   1. Firebase Auth — persists the Firebase user in localStorage via
//      onAuthStateChanged. The Firebase ID token is sent as a Bearer header.
//
//   2. Signed session token in localStorage — after a successful legacy
//      (email/password) login, the server returns a sessionToken which we
//      store in localStorage and send as a Bearer header. This works even
//      when third-party cookies are blocked (cross-origin iframe).
//
// `authedFetch` attaches the best available token (Firebase ID token if
// logged in via Firebase, otherwise the signed session token) to every
// admin API request.

'use client'

import { getFirebaseAuth, onFirebaseAuthChange, firebaseSignOut, getFirebaseIdToken, firebaseSignIn } from './firebase-client'
import type { SessionData } from './session'

export type AdminUser = SessionData

const SESSION_TOKEN_KEY = 'mukesh-salon-session-token'

let currentUser: AdminUser | null = null
let listeners: Array<(u: AdminUser | null) => void> = []
let initialised = false

function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    return null
  }
}

function setSessionToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token)
    else localStorage.removeItem(SESSION_TOKEN_KEY)
  } catch {
    // localStorage may be unavailable in some private-browsing modes.
  }
}

// Initialise Firebase auth listener once. If Firebase remembers a user,
// exchange their ID token for a server session. If not, try the stored
// session token (legacy login).
function ensureInit() {
  if (initialised) return
  initialised = true

  // First: try restoring from the stored session token (fast, no Firebase needed).
  const storedToken = getSessionToken()
  if (storedToken) {
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          currentUser = d.user
          notify()
        } else {
          // Token invalid — clear it.
          setSessionToken(null)
        }
      })
      .catch(() => {})
  }

  // Also listen for Firebase auth state (covers Firebase logins).
  try {
    const auth = getFirebaseAuth()
    onFirebaseAuthChange(async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken()
          const r = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })
          if (r.ok) {
            const d = await r.json()
            if (d.user) {
              currentUser = d.user
              if (d.sessionToken) setSessionToken(d.sessionToken)
              notify()
              return
            }
          }
        } catch {
          /* fall through */
        }
      }
      // If no Firebase user but we have a stored session token, the earlier
      // fetch already handled it. If neither, ensure currentUser is null.
      if (!fbUser && !getSessionToken()) {
        currentUser = null
        notify()
      }
    })
  } catch {
    // Firebase init failed — the stored token path above is the fallback.
  }
}

function notify() {
  for (const l of listeners) {
    try { l(currentUser) } catch { /* ignore */ }
  }
}

export function subscribeAdminUser(cb: (u: AdminUser | null) => void): () => void {
  ensureInit()
  listeners.push(cb)
  try { cb(currentUser) } catch { /* ignore */ }
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

export function getCurrentAdminUser(): AdminUser | null {
  return currentUser
}

// Sign in with Firebase email/password.
export async function adminSignIn(email: string, password: string): Promise<AdminUser> {
  const fbUser = await firebaseSignIn(email, password)
  const idToken = await fbUser.getIdToken()
  const r = await fetch('/api/auth/firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  const d = await r.json()
  if (!r.ok) {
    await firebaseSignOut().catch(() => {})
    throw new Error(d.error || 'Not authorised as salon staff.')
  }
  currentUser = d.user
  if (d.sessionToken) setSessionToken(d.sessionToken)
  notify()
  return d.user as AdminUser
}

// Legacy fallback: sign in with email/password against the DB (no Firebase).
// The server returns a sessionToken which we store in localStorage — this
// persists across reloads even in iframes where cookies are blocked.
export async function adminSignInLegacy(email: string, password: string): Promise<AdminUser> {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error || 'Login failed')
  currentUser = d.user
  if (d.sessionToken) setSessionToken(d.sessionToken)
  notify()
  return d.user as AdminUser
}

export async function adminSignOut(): Promise<void> {
  try { await firebaseSignOut() } catch { /* ignore */ }
  setSessionToken(null)
  try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
  currentUser = null
  notify()
}

// fetch() wrapper that attaches the best available auth token as a Bearer
// header. Uses the Firebase ID token if available, otherwise the stored
// signed session token. This makes admin API calls work even when the
// session cookie is blocked (cross-origin iframe).
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let token: string | null = null
  // Prefer Firebase ID token (fresher, role-checked server-side).
  try { token = await getFirebaseIdToken() } catch { /* ignore */ }
  // Fall back to the stored signed session token.
  if (!token) token = getSessionToken()

  const headers = new Headers(init.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}
