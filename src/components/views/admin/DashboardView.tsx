'use client'

import { useEffect, useState } from 'react'
import { Card, StatCard } from '../shared'
import { useAppStore } from '@/store/useAppStore'
import { authedFetch } from '@/lib/auth-client'
import { CalendarDays, IndianRupee, Users, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts'

type Booking = {
  id: string; customerName: string; customerPhone: string; serviceName: string
  stylistName: string; startTime: string; endTime: string; durationMin: number
  price: number; status: string; notes: string | null
}

type Analytics = {
  todayCount: number; yesterdayCount: number; bookingsPctChange: number
  revenueToday: number; revenueYesterday: number; revenuePctChange: number
  activeStylists: number; totalStylists: number
  totalBookings: number; totalRevenue: number
  perDay: { date: string; count: number; revenue: number }[]
  byCategory: { category: string; count: number }[]
  topServices: { name: string; count: number }[]
  statusBreakdown: { confirmed: number; done: number; 'no-show': number; cancelled: number }
  servicesCount: number
}

const PIE_COLORS = ['#C5F82A', '#1A1A1A', '#D4A574', '#6B9080', '#B07BAC', '#E5484D']

export function DashboardView() {
  const adminUser = useAppStore((s) => s.adminUser)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      authedFetch('/api/bookings?filter=today').then((r) => r.json()),
      adminUser?.role === 'developer'
        ? authedFetch('/api/analytics').then((r) => r.json()).catch(() => null)
        : Promise.resolve(null),
    ]).then(([b, a]) => {
      setBookings(b.bookings || [])
      if (a) setAnalytics(a)
      setLoading(false)
    })
  }, [adminUser?.role])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="h-32 rounded-2xl bg-white animate-pulse" />)}</div>
        <div className="grid lg:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="h-80 rounded-2xl bg-white animate-pulse" />)}</div>
      </div>
    )
  }

  const upcoming = bookings.filter((b) => new Date(b.startTime).getTime() >= Date.now() && b.status === 'confirmed')
  const chartData = (analytics?.perDay || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
    bookings: d.count,
  }))
  const donutData = analytics?.byCategory?.map((c) => ({ name: c.category, value: c.count })) || []

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Heading with date */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Today's Overview</h2>
          <p className="text-[#8A8478] text-sm mt-1">Your salon at a glance</p>
        </div>
        <div className="text-sm text-[#8A8478] px-4 py-2 rounded-xl bg-white border border-[#E5E1D7]">
          {today}
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Today's Bookings"
          value={String(bookings.length)}
          change={analytics?.bookingsPctChange}
          sub="vs yesterday"
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <StatCard
          label="Revenue Today"
          value={`₹${(analytics?.revenueToday ?? 0).toLocaleString('en-IN')}`}
          change={analytics?.revenuePctChange}
          sub="vs yesterday"
          icon={<IndianRupee className="w-5 h-5" />}
        />
        <StatCard
          label="Active Stylists"
          value={`${analytics?.activeStylists ?? 0}`}
          sub={`${analytics?.activeStylists ?? 0} of ${analytics?.totalStylists ?? 0} working`}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Donut chart — bookings by service category */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold">Bookings by Category</h3>
          </div>
          {donutData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1A1A1A', border: 'none', borderRadius: 12, color: '#F4F1EA', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="space-y-2 mt-2">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[#8A8478]">{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-[#8A8478]">No bookings yet.</div>
          )}
        </Card>

        {/* Dark card — weekly bar chart */}
        <Card dark className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-base font-semibold">Weekly Bookings</h3>
              <p className="text-xs text-[#8A8478] mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8A8478]">
              <TrendingUp className="w-3.5 h-3.5 text-[#C5F82A]" />
              <span className="text-[#C5F82A] font-medium">
                {analytics?.perDay ? analytics.perDay.reduce((s, d) => s + d.count, 0) : 0} total
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="label" stroke="#8A8478" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#8A8478" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, color: '#F4F1EA', fontSize: 12 }}
              />
              <Bar dataKey="bookings" fill="#C5F82A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Upcoming appointments list */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold">Upcoming Appointments</h3>
          <span className="text-xs text-[#8A8478]">{upcoming.length} upcoming</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#8A8478]">No upcoming appointments.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin">
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F1EA] hover:bg-[#EDE9DF] transition-colors">
                <div className="text-center flex-shrink-0 w-16">
                  <div className="font-display font-semibold text-sm">
                    {new Date(b.startTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                  <div className="text-[10px] text-[#8A8478]">{b.durationMin}m</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{b.customerName}</div>
                  <div className="text-xs text-[#8A8478] truncate">{b.serviceName} · {b.stylistName}</div>
                </div>
                <div className="text-sm font-medium">₹{b.price}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
