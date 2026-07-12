// GET  /api/settings — get all settings (any admin)
// PATCH /api/settings — update settings (developer only). Body: { key, value } or { updates: [{key, value}] }

import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, upsertSetting } from '@/lib/queries'
import { requireAuth, requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function GET() {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })
  const settings = await getAllSettings()
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const body = await req.json()
    const updates: { key: string; value: string }[] =
      body.updates || (body.key && body.value !== undefined ? [{ key: body.key, value: String(body.value) }] : [])

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
    }

    for (const u of updates) {
      await upsertSetting(u.key, u.value)
    }

    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('settings patch error', err)
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 })
  }
}
