// PATCH /api/services/[id] — update (developer only)
// DELETE /api/services/[id] — soft-delete by setting active=false (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { updateService } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    for (const k of ['name', 'category', 'description', 'image']) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.price !== undefined) data.price = Number(body.price)
    if (body.duration !== undefined) data.duration = Number(body.duration)
    if (body.popular !== undefined) data.popular = !!body.popular
    if (body.active !== undefined) data.active = !!body.active
    if (body.order !== undefined) data.order = Number(body.order)

    await updateService(id, data)
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update service error', err)
    return NextResponse.json({ error: 'Failed to update service.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    await updateService(id, { active: false })
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete service error', err)
    return NextResponse.json({ error: 'Failed to delete service.' }, { status: 500 })
  }
}
