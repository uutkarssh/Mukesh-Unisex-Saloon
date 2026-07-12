// POST /api/auth/firebase
// Body: { idToken }
// Verifies the Firebase ID token with the Admin SDK, looks up the email in
// the AdminUser table, and sets the signed session cookie (for same-origin
// requests). The client also keeps the Firebase user in localStorage and
// sends the ID token as a Bearer header on admin requests, so auth works
// even when cookies are blocked (cross-origin iframe).
//
// This is what makes admin login "remembered": Firebase persists the user
// in localStorage, and on the next page load onAuthStateChanged fires →
// the client calls this endpoint again → session is restored.

import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { findAdminByEmail } from '@/lib/queries'
import { setSessionCookie, mintSessionToken } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken is required.' }, { status: 400 })
    }

    let decoded
    try {
      decoded = await verifyFirebaseToken(idToken)
    } catch {
      return NextResponse.json({ error: 'Invalid or expired Firebase token.' }, { status: 401 })
    }

    if (!decoded.email) {
      return NextResponse.json({ error: 'Firebase user has no email.' }, { status: 400 })
    }

    const admin = await findAdminByEmail(decoded.email)
    if (!admin || !admin.active) {
      return NextResponse.json(
        { error: 'This email is not authorised as salon staff.' },
        { status: 403 },
      )
    }

    const sessionData = {
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    }
    // Set the cookie too (works same-origin; silently ignored by the browser
    // if third-party cookies are blocked — the Bearer header covers that case).
    await setSessionCookie(sessionData)

    return NextResponse.json({ ok: true, user: sessionData, sessionToken: mintSessionToken(sessionData) })
  } catch (err) {
    console.error('firebase auth error', err)
    return NextResponse.json({ error: 'Firebase authentication failed.' }, { status: 500 })
  }
}
