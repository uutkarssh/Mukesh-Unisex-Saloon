// GET  /api/time-blocks — list time blocks (any admin role, optional ?from=&to=)
// POST /api/time-blocks — create time block (any admin role)

import { NextRequest, NextResponse } from 'next/server'
import { findTimeBlocksForAdmin, createTimeBlock, findStylists } from '@/lib/queries'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const [blocks, stylists] = await Promise.all([
      findTimeBlocksForAdmin(from, to),
      findStylists({ activeOnly: false }),
    ])
    const stylistMap = new Map(stylists.map((s) => [s.id, s.name]))
    const withNames = blocks.map((b) => ({ ...b, stylistName: stylistMap.get(b.stylistId) || 'Unknown' }))

    return NextResponse.json({ blocks: withNames })
  } catch (err) {
    console.error('time-blocks list error', err)
    return NextResponse.json({ error: 'Failed to load time blocks.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    if (!session) return NextResponse.json({ error: 'Auth required.' }, { status: 401 })

    const body = await req.json()
    const { stylistId, startTime, endTime, reason } = body
    if (!stylistId || !startTime || !endTime) {
      return NextResponse.json({ error: 'stylistId, startTime, endTime required.' }, { status: 400 })
    }
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid time.' }, { status: 400 })
    }
    if (end <= start) {
      return NextResponse.json({ error: 'End must be after start.' }, { status: 400 })
    }

    const block = await createTimeBlock({
      stylistId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      reason: reason || null,
    })
    return NextResponse.json({ block })
  } catch (err) {
    console.error('create time-block error', err)
    return NextResponse.json({ error: 'Failed to create time block.' }, { status: 500 })
  }
}
