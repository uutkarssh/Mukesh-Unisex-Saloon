'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSiteContent } from '../useSiteContent'
import { useAppStore } from '@/store/useAppStore'
import { Card, LimeBadge } from '../shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Check, ChevronLeft, ChevronRight, Clock, IndianRupee, Calendar,
  User, Phone, CheckCircle2, Loader2, Scissors,
} from 'lucide-react'
import { BOOKING_HORIZON_DAYS, CLOSED_DAY } from '@/lib/constants'

type Slot = { startTime: string; endTime: string; available: boolean }
type Step = 'service' | 'stylist' | 'datetime' | 'details' | 'confirm'

const STEPS: { id: Step; label: string }[] = [
  { id: 'service', label: 'Service' },
  { id: 'stylist', label: 'Stylist' },
  { id: 'datetime', label: 'Date & Time' },
  { id: 'details', label: 'Details' },
  { id: 'confirm', label: 'Confirm' },
]

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function BookingView() {
  const { content, loading } = useSiteContent()
  const preselectedServiceId = useAppStore((s) => s.preselectedServiceId)
  const setView = useAppStore((s) => s.setView)

  const [step, setStep] = useState<Step>('service')
  const [serviceId, setServiceId] = useState<string | undefined>()
  const [stylistId, setStylistId] = useState<string | undefined>()
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState<{
    id: string; serviceName: string; stylistName: string; startTime: string; endTime: string; price: number
  } | null>(null)

  // Initialize — if preselected service, skip to stylist
  useEffect(() => {
    if (!content) return
    if (preselectedServiceId) {
      setServiceId(preselectedServiceId)
      setStep('stylist')
    }
    // Default date = tomorrow, skip closed days
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    while (tomorrow.getDay() === CLOSED_DAY) tomorrow.setDate(tomorrow.getDate() + 1)
    setDate(toISODate(tomorrow))
  }, [content, preselectedServiceId])

  const service = content?.services.find((s) => s.id === serviceId)
  const stylist = content?.stylists.find((s) => s.id === stylistId)

  // Fetch slots
  const fetchSlots = useCallback(async () => {
    if (!serviceId || !stylistId || !date) return
    setSlotsLoading(true)
    setSlot(null)
    try {
      const r = await fetch(`/api/bookings/slots?serviceId=${serviceId}&stylistId=${stylistId}&date=${date}`)
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setSlots(d.slots || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load slots')
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [serviceId, stylistId, date])

  useEffect(() => {
    if (step === 'datetime') fetchSlots()
  }, [step, fetchSlots])

  const submit = async () => {
    if (!serviceId || !stylistId || !slot || !name || !phone) return
    // phone is stored as 10-digit only; prepend +91 for the API
    const fullPhone = `+91${phone}`
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number.')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId, stylistId, startTime: slot.startTime,
          customerName: name, customerPhone: fullPhone, notes,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Booking failed')
      setConfirmed({
        id: d.booking.id,
        serviceName: d.booking.serviceName,
        stylistName: d.booking.stylistName,
        startTime: d.booking.startTime,
        endTime: d.booking.endTime,
        price: d.booking.price,
      })
      setStep('confirm')
      toast.success('Booking confirmed!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const canNext = () => {
    if (step === 'service') return !!serviceId
    if (step === 'stylist') return !!stylistId
    if (step === 'datetime') return !!slot
    if (step === 'details') return !!name && !!phone && /^\d{10}$/.test(phone)
    return false
  }

  // Bookable days
  const days: { date: string; label: string; sub: string; closed: boolean }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < BOOKING_HORIZON_DAYS; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push({
      date: toISODate(d),
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      sub: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      closed: d.getDay() === CLOSED_DAY,
    })
  }

  if (loading || !content) {
    return <div className="h-96 rounded-2xl bg-white border border-[#E5E1D7] animate-pulse" />
  }

  // Confirmation screen
  if (confirmed) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#C5F82A] flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-[#1A1A1A]" />
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">You're all set!</h2>
          <p className="text-[#8A8478] mb-8">Your Appointment Has Been Booked Kindly Take A Screenshot of This Page.</p>
          <div className="text-left max-w-sm mx-auto p-5 rounded-xl bg-[#F4F1EA] border border-[#E5E1D7] space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#8A8478]">Booking ID</span><span className="font-mono text-xs">{confirmed.id.slice(-8).toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-[#8A8478]">Service</span><span className="font-medium">{confirmed.serviceName}</span></div>
            <div className="flex justify-between"><span className="text-[#8A8478]">Stylist</span><span className="font-medium">{confirmed.stylistName}</span></div>
            <div className="flex justify-between"><span className="text-[#8A8478]">When</span><span className="font-medium">
              {new Date(confirmed.startTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
            </span></div>
            <div className="flex justify-between border-t border-[#E5E1D7] pt-2 mt-2"><span className="text-[#8A8478]">Total</span><span className="font-display font-bold flex items-center"><IndianRupee className="w-4 h-4" />{confirmed.price}</span></div>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => setView('home')} variant="outline" className="rounded-xl">Back to Home</Button>
            <Button onClick={() => { setConfirmed(null); setStep('service'); setServiceId(undefined); setStylistId(undefined); setName(''); setPhone('') }} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">Book Another</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress steps */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${i <= stepIndex ? 'bg-[#C5F82A]' : 'bg-[#E5E1D7]'}`} />
          </div>
        ))}
      </div>
      <div className="text-sm text-[#8A8478]">
        Step {stepIndex + 1} of {STEPS.length} — <span className="font-medium text-[#1A1A1A]">{STEPS[stepIndex].label}</span>
      </div>

      <Card>
        {/* STEP 1: Service */}
        {step === 'service' && (
          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold mb-1">Choose a service</h3>
            <p className="text-sm text-[#8A8478] mb-4">Select what you'd like to book today.</p>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto scroll-thin pr-1">
              {content.services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 text-left transition-all ${
                    serviceId === s.id ? 'border-[#C5F82A] bg-[#C5F82A]/5' : 'border-[#E5E1D7] hover:border-[#8A8478]/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-medium">{s.name}</span>
                      {s.popular && <LimeBadge>Popular</LimeBadge>}
                    </div>
                    <div className="text-xs text-[#8A8478] flex items-center gap-3">
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{s.duration}m</span>
                      <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{s.price}</span>
                    </div>
                  </div>
                  {serviceId === s.id && <Check className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Stylist */}
        {step === 'stylist' && (
          <div className="space-y-3">
            <h3 className="font-display text-xl font-semibold mb-1">Pick your stylist</h3>
            <p className="text-sm text-[#8A8478] mb-4">Choose who you'd like, or let us assign one.</p>
            <div className="space-y-2">
              <button
                onClick={() => setStylistId(content.stylists[0]?.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  stylistId === content.stylists[0]?.id ? 'border-[#C5F82A] bg-[#C5F82A]/5' : 'border-[#E5E1D7] hover:border-[#8A8478]/40'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#C5F82A] flex items-center justify-center font-display font-bold text-[#1A1A1A]">✦</div>
                <div className="flex-1">
                  <div className="font-medium">Any Available Stylist</div>
                  <div className="text-xs text-[#8A8478]">We'll assign the first free expert.</div>
                </div>
                {stylistId === content.stylists[0]?.id && <Check className="w-5 h-5 text-[#1A1A1A]" />}
              </button>
              {content.stylists.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStylistId(s.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    stylistId === s.id ? 'border-[#C5F82A] bg-[#C5F82A]/5' : 'border-[#E5E1D7] hover:border-[#8A8478]/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F4F1EA] flex-shrink-0">
                    {s.image && <img src={s.image} alt={s.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-[#8A8478] truncate">{s.specialty} · {s.experience}y</div>
                  </div>
                  {stylistId === s.id && <Check className="w-5 h-5 text-[#1A1A1A]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Date & Time */}
        {step === 'datetime' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Calendar className="w-4 h-4 text-[#1A1A1A]" /> Select a date
              </div>
              <div className="flex gap-2 overflow-x-auto scroll-thin pb-2">
                {days.map((d) => (
                  <button
                    key={d.date}
                    disabled={d.closed}
                    onClick={() => { setDate(d.date); setSlot(null) }}
                    className={`flex-shrink-0 w-16 p-2.5 rounded-xl border-2 text-center transition-all ${
                      d.closed ? 'opacity-40 cursor-not-allowed border-[#E5E1D7] bg-[#F4F1EA]'
                        : date === d.date ? 'border-[#C5F82A] bg-[#C5F82A]/5'
                        : 'border-[#E5E1D7] hover:border-[#8A8478]/40'
                    }`}
                  >
                    <div className="text-xs font-medium">{d.label}</div>
                    <div className="text-[11px] text-[#8A8478]">{d.sub}</div>
                    {d.closed && <div className="text-[9px] text-red-500">Closed</div>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Clock className="w-4 h-4 text-[#1A1A1A]" /> Available slots
                {service && <span className="text-xs text-[#8A8478]">· {service.duration} min</span>}
              </div>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10 text-[#8A8478]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading slots…
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#8A8478]">No slots available. Please pick another date.</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto scroll-thin pr-1">
                  {slots.map((sl, i) => (
                    <button
                      key={i}
                      disabled={!sl.available}
                      onClick={() => setSlot(sl)}
                      className={`p-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        !sl.available ? 'border-[#E5E1D7] bg-[#F4F1EA] text-[#8A8478]/50 cursor-not-allowed line-through'
                          : slot?.startTime === sl.startTime ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F4F1EA]'
                          : 'border-[#E5E1D7] hover:border-[#8A8478]/40 hover:bg-[#F4F1EA]'
                      }`}
                    >
                      {new Date(sl.startTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Details */}
        {step === 'details' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E5E1D7] space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#8A8478]">Service</span><span className="font-medium">{service?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8A8478]">Stylist</span><span className="font-medium">{stylist?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#8A8478]">When</span><span className="font-medium">
                {slot && new Date(slot.startTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}
              </span></div>
              <div className="flex justify-between"><span className="text-[#8A8478]">Duration</span><span className="font-medium">{service?.duration} min</span></div>
              <div className="flex justify-between border-t border-[#E5E1D7] pt-2 mt-2"><span className="text-[#8A8478]">Total</span><span className="font-display font-bold flex items-center"><IndianRupee className="w-4 h-4" />{service?.price}</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="bk-name" className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Your name</Label>
                <Input id="bk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amit Patel" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="bk-phone" className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone number</Label>
                <div className="mt-1.5 flex items-stretch h-11 rounded-xl border border-[#E5E1D7] overflow-hidden focus-within:ring-2 focus-within:ring-[#C5F82A]/30">
                  <span className="flex items-center px-3 bg-[#F4F1EA] text-[#8A8478] font-mono text-sm border-r border-[#E5E1D7] font-medium">+91</span>
                  <input
                    id="bk-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 px-3 bg-white text-[#1A1A1A] font-mono text-sm outline-none"
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-[#8A8478] mt-1">Enter your 10-digit mobile number. We'll call you for confirmation.</p>
              </div>
              <div>
                <Label htmlFor="bk-notes">Notes (optional)</Label>
                <Textarea id="bk-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific requests?" className="mt-1.5 min-h-[70px] rounded-xl" />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation */}
      {step !== 'confirm' && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id)
              else setView('home')
            }}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            disabled={!canNext() || submitting}
            onClick={() => {
              if (step === 'details') submit()
              else if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].id)
            }}
            className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] px-6"
          >
            {step === 'details' ? (
              submitting ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Confirming…</> : 'Confirm Booking'
            ) : (
              <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
