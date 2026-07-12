// GET  /api/gallery — list gallery items (public, optional ?category=)
// POST /api/gallery — create (developer only)

import { NextRequest, NextResponse } from 'next/server'
import { findGallery, createGallery } from '@/lib/queries'
import { requireRole } from '@/lib/session'
import { invalidateSiteContentCache } from '@/lib/cache'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const items = await findGallery({ category: category || null })
    return NextResponse.json({ items })
  } catch (err) {
    console.error('gallery list error', err)
    return NextResponse.json({ error: 'Failed to load gallery.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const body = await req.json()
    const { title, category, imageUrl, description, featured } = body
    if (!title || !category || !imageUrl) {
      return NextResponse.json({ error: 'Title, category and imageUrl required.' }, { status: 400 })
    }
    const item = await createGallery({
      title,
      category,
      imageUrl,
      description: description || null,
      featured: !!featured,
    })
    invalidateSiteContentCache()
    return NextResponse.json({ item })
  } catch (err) {
    console.error('create gallery error', err)
    return NextResponse.json({ error: 'Failed to create gallery item.' }, { status: 500 })
  }
}
