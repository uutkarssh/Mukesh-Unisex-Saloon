// PATCH /api/offers/[id] — update offer (developer only)
// DELETE /api/offers/[id] — delete offer (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { updateOffer, deleteOffer } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    for (const k of ['title', 'description', 'badge', 'discount'] as const) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.validUntil !== undefined) {
      data.validUntil = body.validUntil ? new Date(body.validUntil).toISOString() : null
    }
    if (body.active !== undefined) data.active = !!body.active

    await updateOffer(id, data)
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update offer error', err)
    return NextResponse.json({ error: 'Failed to update offer.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    await deleteOffer(id)
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete offer error', err)
    return NextResponse.json({ error: 'Failed to delete offer.' }, { status: 500 })
  }
}
