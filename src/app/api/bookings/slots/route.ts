// GET /api/bookings/slots?serviceId=&stylistId=&date=YYYY-MM-DD
// Returns the available + unavailable slots for the given service/stylist/date.

import { NextRequest, NextResponse } from 'next/server'
import { findServiceById, findStylistById } from '@/lib/queries'
import { generateSlots } from '@/lib/slots'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const serviceId = searchParams.get('serviceId')
    const stylistId = searchParams.get('stylistId')
    const dateStr = searchParams.get('date')

    if (!serviceId || !stylistId || !dateStr) {
      return NextResponse.json({ error: 'serviceId, stylistId, date are required.' }, { status: 400 })
    }

    const service = await findServiceById(serviceId)
    if (!service || !service.active) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 })
    }
    const stylist = await findStylistById(stylistId)
    if (!stylist || !stylist.active) {
      return NextResponse.json({ error: 'Stylist not found.' }, { status: 404 })
    }

    // Parse the date as a local date (no timezone shift)
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)

    const slots = await generateSlots({
      stylistId,
      serviceDurationMin: service.duration,
      date,
    })

    return NextResponse.json({
      service: { id: service.id, name: service.name, duration: service.duration, price: service.price },
      stylist: { id: stylist.id, name: stylist.name },
      date: dateStr,
      slots,
    })
  } catch (err) {
    console.error('slots error', err)
    return NextResponse.json({ error: 'Failed to load slots.' }, { status: 500 })
  }
}
