// PATCH /api/stylists/[id] — update (developer only)
// DELETE /api/stylists/[id] — soft-delete (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { updateStylist } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    for (const k of ['name', 'specialty', 'bio', 'image']) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.experience !== undefined) data.experience = Number(body.experience)
    if (body.active !== undefined) data.active = !!body.active
    if (body.order !== undefined) data.order = Number(body.order)

    await updateStylist(id, data)
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update stylist error', err)
    return NextResponse.json({ error: 'Failed to update stylist.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    await updateStylist(id, { active: false })
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete stylist error', err)
    return NextResponse.json({ error: 'Failed to delete stylist.' }, { status: 500 })
  }
}
