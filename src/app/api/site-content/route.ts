// GET /api/site-content — public site content bundle.
// Returns settings, offers, reviews, services, gallery, stylists in a single round-trip.
// Cached in-memory for 60s (see lib/cache.ts) to keep page loads fast; admin
// mutation routes invalidate the cache so edits show up immediately.

import { NextResponse } from 'next/server'
import {
  getAllSettings,
  findActiveOffers,
  findApprovedReviews,
  findServices,
  findGallery,
  findStylists,
} from '@/lib/queries'
import { getCachedSiteContent, setCachedSiteContent } from '@/lib/cache'

export async function GET() {
  try {
    // Serve from cache when available (hits on repeat page loads / nav).
    const cached = getCachedSiteContent<unknown>()
    if (cached) return NextResponse.json(cached)

    const [settingsMap, offers, reviews, services, gallery, stylists] = await Promise.all([
      getAllSettings(),
      findActiveOffers(),
      findApprovedReviews(8),
      findServices({ activeOnly: true }),
      findGallery(),
      findStylists({ activeOnly: true }),
    ])

    const payload = {
      settings: settingsMap,
      offers,
      reviews,
      services,
      gallery,
      stylists,
    }

    setCachedSiteContent(payload)
    return NextResponse.json(payload)
  } catch (err) {
    console.error('site-content error', err)
    return NextResponse.json({ error: 'Failed to load site content.' }, { status: 500 })
  }
}
