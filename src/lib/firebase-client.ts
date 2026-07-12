// Firebase client SDK — used in the browser for admin authentication.
//
// Why Firebase Auth instead of a plain cookie session:
//   The salon preview is embedded inside a cross-origin iframe (chat.z.ai).
//   Browsers block third-party cookies in that context, so a normal
//   SameSite=Lax/None session cookie can't be relied on. Firebase Auth
//   persists the signed-in user in localStorage / IndexedDB (first-party
//   storage that works inside iframes) and exposes the user via
//   onAuthStateChanged, so the admin stays logged in across reloads.
//
// The server still authorises actions: after Firebase sign-in the client
// sends the Firebase ID token to /api/auth/firebase, which verifies it with
// the Admin SDK and looks up the email in the AdminUser table to get the
// role. The ID token is also sent as a Bearer header on every admin API
// request as a cookie-independent auth channel.
//
// NOTE: Firebase init is wrapped in try/catch because Firebase v12 + Turbopack
// can emit a harmless "INTERNAL ASSERTION FAILED" warning. If init fails, the
// legacy session-token path (localStorage + Bearer header) still handles auth
// and persistence — so the app works regardless.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyBKiCGqtM7RdnXIgw5uAGK4NUIjstayr3Q',
  authDomain: 'gadgets-oz.firebaseapp.com',
  projectId: 'gadgets-oz',
  storageBucket: 'gadgets-oz.firebasestorage.app',
  messagingSenderId: '644886027305',
  appId: '1:644886027305:web:c6e10bd489aa5313765038',
  measurementId: 'G-202WJ1BQ0Z',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let initFailed = false

export function getFirebaseAuth(): Auth | null {
  if (initFailed) return null
  if (!auth) {
    try {
      if (!app) app = initializeApp(firebaseConfig)
      auth = getAuth(app)
      // Persist across sessions — 'local' keeps the user signed in across
      // browser restarts until they sign out.
      auth.setPersistence('local' as never).catch(() => {
        // Persistence setting can fail in private-browsing; sign-in still works.
      })
    } catch (e) {
      // Firebase v12 + Turbopack can throw a harmless assertion error.
      // The legacy session-token path covers auth + persistence, so this
      // is non-fatal.
      initFailed = true
      return null
    }
  }
  return auth
}

export async function firebaseSignIn(email: string, password: string): Promise<User> {
  const a = getFirebaseAuth()
  if (!a) throw new Error('Firebase Auth unavailable.')
  const cred = await signInWithEmailAndPassword(a, email, password)
  return cred.user
}

export async function firebaseSignOut(): Promise<void> {
  const a = getFirebaseAuth()
  if (!a) return
  try { await signOut(a) } catch { /* ignore */ }
}

// Subscribe to Firebase auth-state changes. Returns a no-op unsubscribe
// if Firebase isn't available (the legacy path handles persistence then).
export function onFirebaseAuthChange(cb: (user: User | null) => void): () => void {
  const a = getFirebaseAuth()
  if (!a) return () => {}
  try {
    return onAuthStateChanged(a, cb)
  } catch {
    return () => {}
  }
}

// Get a fresh ID token for the current Firebase user (used as Bearer header).
export async function getFirebaseIdToken(): Promise<string | null> {
  const a = getFirebaseAuth()
  if (!a) return null
  const user = a.currentUser
  if (!user) return null
  try {
    return await user.getIdToken()
  } catch {
    return null
  }
}
