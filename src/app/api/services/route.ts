// GET  /api/services — list services (public; active only by default, ?all=1 for admin, ?category=)
// POST /api/services — create service (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { findServices, createService } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeInactive = searchParams.get('all') === '1'
    const category = searchParams.get('category')
    const services = await findServices({
      activeOnly: !includeInactive,
      category: category || null,
    })
    return NextResponse.json({ services })
  } catch (err) {
    console.error('services list error', err)
    return NextResponse.json({ error: 'Failed to load services.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const body = await req.json()
    const { name, category, price, duration, description, image, popular, order } = body
    if (!name || !category || !description || price == null || duration == null) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    const service = await createService({
      name,
      category,
      price: Number(price),
      duration: Number(duration),
      description,
      image: image || null,
      popular: !!popular,
      order: Number(order) || 0,
    })
    invalidateSiteContentCache()
    return NextResponse.json({ service })
  } catch (err) {
    console.error('create service error', err)
    return NextResponse.json({ error: 'Failed to create service.' }, { status: 500 })
  }
}
