// DELETE /api/time-blocks/[id] — delete (any admin role)

import { NextRequest, NextResponse } from 'next/server'
import { deleteTimeBlock } from '@/lib/queries'
import { requireAuth } from '@/lib/session'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })

    const { id } = await params
    await deleteTimeBlock(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete time-block error', err)
    return NextResponse.json({ error: 'Failed to delete time block.' }, { status: 500 })
  }
}
