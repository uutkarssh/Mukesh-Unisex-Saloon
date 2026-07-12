// GET /api/reviews — list approved reviews (public)

import { NextResponse } from 'next/server'
import { findApprovedReviews } from '@/lib/queries'

export async function GET() {
  try {
    const reviews = await findApprovedReviews()
    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('reviews error', err)
    return NextResponse.json({ error: 'Failed to load reviews.' }, { status: 500 })
  }
}
