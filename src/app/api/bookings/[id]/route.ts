// PATCH /api/bookings/[id] — update status/notes (any admin role; barbers can mark done/no-show/cancel)
// DELETE /api/bookings/[id] — cancel a booking (any admin role)

import { NextRequest, NextResponse } from 'next/server'
import { updateBooking } from '@/lib/queries'
import { requireAuth } from '@/lib/session'

const VALID_STATUSES = ['confirmed', 'done', 'no-show', 'cancelled']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { status, notes } = body

    const data: { status?: string; notes?: string | null } = {}
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      data.status = status
    }
    if (notes !== undefined) data.notes = notes

    await updateBooking(id, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('update booking error', err)
    return NextResponse.json({ error: 'Failed to update booking.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })

    const { id } = await params
    await updateBooking(id, { status: 'cancelled' })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('cancel booking error', err)
    return NextResponse.json({ error: 'Failed to cancel booking.' }, { status: 500 })
  }
}
