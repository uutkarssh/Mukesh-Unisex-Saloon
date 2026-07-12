// GET  /api/bookings — list bookings (admin only; barbers see today+future, developers see all)
// POST /api/bookings — create a booking (PUBLIC, no auth; used by the booking flow)
//
// This is the core of the booking→admin visibility flow:
//   customer submits booking form → POST here → INSERT into Booking table
//   → admin panel fetches GET /api/bookings → SELECT from the SAME Booking table → renders.
// New bookings appear alongside existing seeded demo orders in the exact same shape.

import { NextRequest, NextResponse } from 'next/server'
import { findBookingsForAdmin, findServiceById, findStylistById, createBooking } from '@/lib/queries'
import { requireAuth } from '@/lib/session'
import { isSlotAvailable } from '@/lib/slots'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    let filter = (searchParams.get('filter') as 'today' | 'upcoming' | 'past' | 'all' | null) || 'all'
    const status = searchParams.get('status')

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(startOfToday)
    endOfToday.setHours(23, 59, 59, 999)

    // Barbers are restricted to today + upcoming only (never past/all)
    if (session.role === 'barber' && filter === 'all') {
      filter = 'upcoming'
    }
    if (session.role === 'barber' && filter === 'past') {
      filter = 'upcoming'
    }

    const bookings = await findBookingsForAdmin({
      filter,
      status: status || null,
      startOfTodayIso: startOfToday.toISOString(),
      endOfTodayIso: endOfToday.toISOString(),
    })

    return NextResponse.json({ bookings })
  } catch (err) {
    console.error('bookings list error', err)
    return NextResponse.json({ error: 'Failed to load bookings.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { serviceId, stylistId, startTime, customerName, customerPhone, notes } = body

    if (!serviceId || !stylistId || !startTime || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (!/^\+\d{10,15}$/.test(customerPhone)) {
      return NextResponse.json({ error: 'Phone must be in E.164 format (e.g. +919876543210).' }, { status: 400 })
    }

    const service = await findServiceById(serviceId)
    if (!service || !service.active) {
      return NextResponse.json({ error: 'Service not available.' }, { status: 400 })
    }
    const stylist = await findStylistById(stylistId)
    if (!stylist || !stylist.active) {
      return NextResponse.json({ error: 'Stylist not available.' }, { status: 400 })
    }

    const start = new Date(startTime)
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start time.' }, { status: 400 })
    }

    // Server-side re-validation of slot availability (prevents race/tampering)
    const ok = await isSlotAvailable(stylistId, service.duration, start)
    if (!ok) {
      return NextResponse.json({ error: 'This slot is no longer available. Please pick another time.' }, { status: 409 })
    }

    const end = new Date(start.getTime() + service.duration * 60 * 1000)

    // Insert into the EXISTING Booking table in the exact same shape as seeded demo orders.
    const booking = await createBooking({
      customerName,
      customerPhone,
      serviceId,
      serviceName: service.name,
      stylistId,
      stylistName: stylist.name,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMin: service.duration,
      price: service.price,
      status: 'confirmed',
      notes: notes || null,
    })

    console.log(`[BOOKING CONFIRMED] ${customerName} (${customerPhone}) — ${service.name} with ${stylist.name} at ${start.toISOString()}. Booking id: ${booking.id}`)

    return NextResponse.json({ booking })
  } catch (err) {
    console.error('create booking error', err)
    return NextResponse.json({ error: 'Failed to create booking.' }, { status: 500 })
  }
}
