// GET /api/analytics — salon-wide stats (developer only)
// Returns today's bookings + revenue (with yesterday comparison), active stylists,
// bookings per day (last 7), per category, status breakdown, top services.

import { NextResponse } from 'next/server'
import {
  findBookingsInIsoRange,
  findBookingsFromIso,
  findAllBookingsForStats,
  countStylists,
  findServices,
} from '@/lib/queries'
import { requireRole } from '@/lib/session'

export async function GET() {
  try {
    const session = await requireRole('developer')
    if (!session) return NextResponse.json({ error: 'Developer access required.' }, { status: 403 })

    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(startOfToday)
    endOfToday.setHours(23, 59, 59, 999)

    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const endOfYesterday = new Date(startOfYesterday)
    endOfYesterday.setHours(23, 59, 59, 999)

    const startOf7DaysAgo = new Date(startOfToday)
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6)

    const [todayBookings, yesterdayBookings, activeStylists, totalStylists, last7Bookings, allBookingsForStats, services] = await Promise.all([
      findBookingsInIsoRange(startOfToday.toISOString(), endOfToday.toISOString(), true),
      findBookingsInIsoRange(startOfYesterday.toISOString(), endOfYesterday.toISOString(), true),
      countStylists(true),
      countStylists(false),
      findBookingsFromIso(startOf7DaysAgo.toISOString(), true),
      findAllBookingsForStats(true),
      findServices({ activeOnly: true }),
    ])

    const revenueToday = todayBookings
      .filter((b) => b.status === 'done' || b.status === 'confirmed')
      .reduce((s, b) => s + b.price, 0)
    const revenueYesterday = yesterdayBookings
      .filter((b) => b.status === 'done' || b.status === 'confirmed')
      .reduce((s, b) => s + b.price, 0)

    const pct = (today: number, yesterday: number) => {
      if (yesterday === 0) return today > 0 ? 100 : 0
      return Math.round(((today - yesterday) / yesterday) * 100)
    }

    const perDay: { date: string; count: number; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - i)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      const dayBookings = last7Bookings.filter(
        (b) => new Date(b.startTime) >= d && new Date(b.startTime) < next,
      )
      perDay.push({
        date: d.toISOString().slice(0, 10),
        count: dayBookings.length,
        revenue: dayBookings.reduce((s, b) => s + b.price, 0),
      })
    }

    // Bookings by service category
    const categoryCounts = new Map<string, number>()
    for (const b of allBookingsForStats) {
      const svc = services.find((s) => s.name === b.serviceName)
      const cat = svc?.category || 'Other'
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
    }
    const byCategory = [...categoryCounts.entries()].map(([category, count]) => ({ category, count }))

    // Most-booked services
    const serviceCounts = new Map<string, number>()
    for (const b of allBookingsForStats) {
      serviceCounts.set(b.serviceName, (serviceCounts.get(b.serviceName) || 0) + 1)
    }
    const topServices = [...serviceCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const statusBreakdown = {
      confirmed: allBookingsForStats.filter((b) => b.status === 'confirmed').length,
      done: allBookingsForStats.filter((b) => b.status === 'done').length,
      'no-show': allBookingsForStats.filter((b) => b.status === 'no-show').length,
      cancelled: 0, // excluded from allBookingsForStats (excluded cancelled)
    }

    const totalRevenue = allBookingsForStats
      .filter((b) => b.status === 'done' || b.status === 'confirmed')
      .reduce((s, b) => s + b.price, 0)

    return NextResponse.json({
      todayCount: todayBookings.length,
      yesterdayCount: yesterdayBookings.length,
      bookingsPctChange: pct(todayBookings.length, yesterdayBookings.length),
      revenueToday,
      revenueYesterday,
      revenuePctChange: pct(revenueToday, revenueYesterday),
      activeStylists,
      totalStylists,
      totalBookings: allBookingsForStats.length,
      totalRevenue,
      perDay,
      byCategory,
      topServices,
      statusBreakdown,
      servicesCount: services.length,
    })
  } catch (err) {
    console.error('analytics error', err)
    return NextResponse.json({ error: 'Failed to load analytics.' }, { status: 500 })
  }
}
