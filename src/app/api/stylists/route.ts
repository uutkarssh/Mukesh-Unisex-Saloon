// GET  /api/stylists — list stylists (public; active only by default, ?all=1 for admin)
// POST /api/stylists — create stylist (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { findStylists, createStylist } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('all') === '1'
    const stylists = await findStylists({ activeOnly: !includeInactive })
    return NextResponse.json({ stylists })
  } catch (err) {
    console.error('stylists list error', err)
    return NextResponse.json({ error: 'Failed to load stylists.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const body = await req.json()
    const { name, specialty, experience, bio, image, order } = body
    if (!name || !specialty) {
      return NextResponse.json({ error: 'Name and specialty required.' }, { status: 400 })
    }
    const stylist = await createStylist({
      name,
      specialty,
      experience: Number(experience) || 0,
      bio: bio || null,
      image: image || null,
      order: Number(order) || 0,
    })
    invalidateSiteContentCache()
    return NextResponse.json({ stylist })
  } catch (err) {
    console.error('create stylist error', err)
    return NextResponse.json({ error: 'Failed to create stylist.' }, { status: 500 })
  }
}
