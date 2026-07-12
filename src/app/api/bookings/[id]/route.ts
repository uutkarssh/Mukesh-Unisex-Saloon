// PATCH  /api/bookings/[id] — update status/notes (any admin role)
// DELETE /api/bookings/[id] — PERMANENTLY delete the booking from the database (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateBooking } from '@/lib/queries'
import { requireAuth, requireRole } from '@/lib/session'

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

// PERMANENTLY delete a booking row from the database.
// Developer only — barbers can't delete (they can only mark done/no-show/cancel).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const { id } = await params
    await db.execute({ sql: 'DELETE FROM Booking WHERE id = ?', args: [id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete booking error', err)
    return NextResponse.json({ error: 'Failed to delete booking.' }, { status: 500 })
  }
  }
