// POST /api/auth/login
// Body: { email, password }
// Verifies credentials against the AdminUser table (legacy email/password).
// Sets the signed session cookie AND returns a sessionToken for the client
// to store in localStorage — so the login persists across reloads even
// inside a cross-origin iframe where cookies are blocked.

import { NextRequest, NextResponse } from 'next/server'
import { findAdminByEmail } from '@/lib/queries'
import { verifyPassword } from '@/lib/password'
import { setSessionCookie, mintSessionToken } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await findAdminByEmail(email)
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const sessionData = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    // Set the cookie (works same-origin; ignored if third-party cookies blocked).
    await setSessionCookie(sessionData)
    // Mint a token for localStorage (works in iframes — sent as Bearer header).
    const sessionToken = mintSessionToken(sessionData)

    return NextResponse.json({
      ok: true,
      user: sessionData,
      sessionToken,
    })
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 })
  }
}
