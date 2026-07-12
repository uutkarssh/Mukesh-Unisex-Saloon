// PATCH  /api/gallery/[id] — update a gallery item (developer only)
// DELETE /api/gallery/[id] — delete a gallery item (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { deleteGallery, updateGallery } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    for (const k of ['title', 'category', 'imageUrl', 'description'] as const) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.featured !== undefined) data.featured = !!body.featured

    await updateGallery(id, data)
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update gallery error', err)
    return NextResponse.json({ error: 'Failed to update gallery item.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    await deleteGallery(id)
    invalidateSiteContentCache()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete gallery error', err)
    return NextResponse.json({ error: 'Failed to delete gallery item.' }, { status: 500 })
  }
}
