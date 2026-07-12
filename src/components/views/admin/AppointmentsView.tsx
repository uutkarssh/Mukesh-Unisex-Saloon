'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, PageHeading } from '../shared'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Filter, RefreshCw, CheckCircle2, XCircle, Ban, Phone, Clock } from 'lucide-react'
import { useState as useReactState } from 'react'
import { toast } from 'sonner'
import { authedFetch } from '@/lib/auth-client'

type Booking = {
  id: string; customerName: string; customerPhone: string; serviceName: string
  stylistName: string; startTime: string; endTime: string; durationMin: number
  price: number; status: string; notes: string | null
}

type FilterValue = 'today' | 'upcoming' | 'past'
type StatusValue = 'all' | 'confirmed' | 'done' | 'no-show' | 'cancelled'

export function AppointmentsView() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('today')
  const [status, setStatus] = useState<StatusValue>('all')
  const [search, setSearch] = useReactState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter })
      if (status !== 'all') params.set('status', status)
      const r = await authedFetch(`/api/bookings?${params}`)
      const d = await r.json()
      setBookings(d.bookings || [])
    } finally {
      setLoading(false)
    }
  }, [filter, status])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? bookings.filter((b) =>
        b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.customerPhone.includes(search) ||
        b.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        b.stylistName.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  // Group by date
  const groups = new Map<string, Booking[]>()
  for (const b of filtered) {
    const d = new Date(b.startTime)
    const key = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(b)
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Appointments"
        subtitle="Manage today's and upcoming bookings"
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-xl">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
            <Input
              placeholder="Search name, phone, service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
            <SelectTrigger className="w-full sm:w-40 rounded-xl">
              <Filter className="w-4 h-4 mr-1.5 text-[#8A8478]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusValue)}>
            <SelectTrigger className="w-full sm:w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="no-show">No-show</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Booking list grouped by date */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-[#8A8478]">
          <div className="font-display text-lg mb-1">No appointments found</div>
          <div className="text-sm">Try adjusting your filters.</div>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs uppercase tracking-wider text-[#8A8478] font-semibold">{date}</h3>
                <div className="text-xs text-[#8A8478]">({items.length})</div>
                <div className="flex-1 h-px bg-[#E5E1D7]" />
              </div>
              <div className="space-y-2">
                {items.map((b) => <BookingCard key={b.id} booking={b} onRefresh={load} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onRefresh }: { booking: Booking; onRefresh: () => void }) {
  const [updating, setUpdating] = useReactState<string | null>(null)

  const updateStatus = async (status: 'done' | 'no-show' | 'cancelled') => {
    setUpdating(status)
    try {
      const r = await authedFetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) throw new Error('Update failed')
      toast.success(`Marked as ${status}`)
      onRefresh()
    } catch {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const statusStyles: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'no-show': 'bg-amber-100 text-amber-700 border-amber-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Time */}
        <div className="flex sm:flex-col items-center sm:justify-center text-center sm:w-16 flex-shrink-0 bg-[#F4F1EA] rounded-xl p-2 sm:p-2.5">
          <div className="font-display text-sm font-semibold leading-tight">
            {new Date(booking.startTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
          <div className="text-[10px] text-[#8A8478] sm:mt-0.5 ml-2 sm:ml-0 flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />{booking.durationMin}m
          </div>
        </div>

        {/* Customer + service */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-medium truncate">{booking.customerName}</span>
            <Badge variant="outline" className={`text-[10px] border ${statusStyles[booking.status] || statusStyles.confirmed}`}>
              {booking.status}
            </Badge>
          </div>
          <div className="text-sm text-[#8A8478] truncate">{booking.serviceName} · {booking.stylistName}</div>
          <div className="text-xs text-[#8A8478] mt-1 flex items-center gap-3 flex-wrap">
            <a href={`tel:${booking.customerPhone}`} className="flex items-center gap-1 hover:text-[#1A1A1A]">
              <Phone className="w-3 h-3" />{booking.customerPhone}
            </a>
            <span className="font-medium text-[#1A1A1A]">₹{booking.price}</span>
          </div>
          {booking.notes && (
            <div className="text-xs text-[#8A8478] italic mt-1.5 bg-[#F4F1EA] rounded-lg p-2">&ldquo;{booking.notes}&rdquo;</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-1.5 flex-shrink-0">
          {booking.status === 'confirmed' && (
            <>
              <Button size="sm" variant="outline" disabled={!!updating} onClick={() => updateStatus('done')}
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 text-xs rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {updating === 'done' ? '…' : 'Done'}
              </Button>
              <Button size="sm" variant="outline" disabled={!!updating} onClick={() => updateStatus('no-show')}
                className="text-amber-600 border-amber-200 hover:bg-amber-50 h-8 text-xs rounded-lg">
                <XCircle className="w-3.5 h-3.5 mr-1" />
                {updating === 'no-show' ? '…' : 'No-show'}
              </Button>
            </>
          )}
          {(booking.status === 'confirmed' || booking.status === 'done') && (
            <Button size="sm" variant="ghost" disabled={!!updating} onClick={() => updateStatus('cancelled')}
              className="text-red-500 hover:bg-red-50 h-8 text-xs rounded-lg">
              <Ban className="w-3.5 h-3.5 mr-1" />
              {updating === 'cancelled' ? '…' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
