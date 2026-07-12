// GET  /api/offers — list offers. Public gets active+valid only; admin (?all=1) gets all.
// POST /api/offers — create offer (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { findActiveOffers, findAllOffers, createOffer } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === '1'
    const offers = all ? await findAllOffers() : await findActiveOffers()
    return NextResponse.json({ offers })
  } catch (err) {
    console.error('offers list error', err)
    return NextResponse.json({ error: 'Failed to load offers.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const body = await req.json()
    const { title, description, badge, discount, validUntil, active } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 })
    }
    const offer = await createOffer({
      title,
      description,
      badge: badge || null,
      discount: discount || null,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      active: active !== undefined ? !!active : true,
    })
    invalidateSiteContentCache()
    return NextResponse.json({ offer })
  } catch (err) {
    console.error('create offer error', err)
    return NextResponse.json({ error: 'Failed to create offer.' }, { status: 500 })
  }
}
