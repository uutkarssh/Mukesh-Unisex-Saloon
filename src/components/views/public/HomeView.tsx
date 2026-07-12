'use client'

import { useAppStore } from '@/store/useAppStore'
import { useSiteContent } from '../useSiteContent'
import { Card, CardSkeleton, LimeBadge } from '../shared'
import { CalendarPlus, Scissors, Star, MapPin, Clock, ArrowRight, Tag, Sparkles } from 'lucide-react'

export function HomeView() {
  const { content, loading } = useSiteContent()
  const openBooking = useAppStore((s) => s.openBooking)
  const setView = useAppStore((s) => s.setView)

  if (loading || !content) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-80" />
        <div className="grid sm:grid-cols-3 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    )
  }

  const { settings, services, offers, reviews } = content
  const popular = services.filter((s) => s.popular).slice(0, 4)
  const topReview = reviews[0]
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9'

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="relative overflow-hidden p-8 sm:p-12" >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5F82A] opacity-5 rounded-full blur-3xl" />
        <div className="relative max-w-2xl">
          <LimeBadge className="mb-5">
            <Sparkles className="w-3 h-3" /> {settings.tagline || 'Where Style Meets Tradition'}
          </LimeBadge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mb-5">
            Mukesh Unisex<br /><span className="text-[#8A8478]">Salon</span>
          </h1>
          <p className="text-[#8A8478] text-lg leading-relaxed mb-8 max-w-xl">
            Premium haircuts, colour, bridal, and grooming — crafted by master stylists with 15+ years of tradition. Book in seconds, walk in like family.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openBooking()}
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#1A1A1A] text-[#F4F1EA] font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              <CalendarPlus className="w-5 h-5" />
              Book Appointment
            </button>
            <button
              onClick={() => setView('services')}
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#F4F1EA] border border-[#E5E1D7] font-semibold hover:bg-[#EDE9DF] transition-colors"
            >
              Browse Services
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 sm:gap-6 mt-10 pt-8 border-t border-[#E5E1D7] flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-[#C5F82A] text-[#C5F82A]" />)}
              </div>
              <span className="text-sm font-medium">{avgRating} / 5</span>
            </div>
            <div className="h-8 w-px bg-[#E5E1D7] hidden sm:block" />
            <div className="text-sm whitespace-nowrap">
              <span className="font-display font-bold text-lg">10k+</span>
              <span className="text-[#8A8478] ml-1.5">cuts done</span>
            </div>
            <div className="h-8 w-px bg-[#E5E1D7] hidden sm:block" />
            <div className="text-sm whitespace-nowrap">
              <span className="font-display font-bold text-lg">15+</span>
              <span className="text-[#8A8478] ml-1.5">years</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick info row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[#8A8478] uppercase tracking-wider">Open Today</div>
            <div className="font-medium text-sm">{settings.hours_weekday || '10 AM – 8 PM'}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[#8A8478] uppercase tracking-wider">Visit Us</div>
            <div className="font-medium text-sm truncate">Mangapatti, Bhadohi</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
            <Scissors className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[#8A8478] uppercase tracking-wider">Services</div>
            <div className="font-medium text-sm">{services.length} on the menu</div>
          </div>
        </Card>
      </div>

      {/* Popular services */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold">Most Loved Services</h3>
          <button
            onClick={() => setView('services')}
            className="text-sm text-[#8A8478] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popular.map((s) => (
            <Card key={s.id} className="p-0 overflow-hidden hover:shadow-soft-lg transition-shadow cursor-pointer group" onClick={() => openBooking(s.id)}>
              <div className="h-36 bg-[#F4F1EA] relative overflow-hidden">
                {s.image && <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                {s.popular && <LimeBadge className="absolute top-3 left-3">Popular</LimeBadge>}
              </div>
              <div className="p-4">
                <div className="font-display font-semibold mb-1 line-clamp-1">{s.name}</div>
                <div className="text-xs text-[#8A8478] line-clamp-1 mb-3">{s.description}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8A8478]">{s.duration} min</span>
                  <span className="font-display font-bold text-lg">₹{s.price}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Offers + Review */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Offers */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-[#C5F82A]" />
            <h3 className="font-display text-lg font-semibold">Current Offers</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {offers.slice(0, 4).map((o) => (
              <div key={o.id} className="p-4 rounded-xl bg-[#F4F1EA] border border-[#E5E1D7]">
                <div className="flex items-start justify-between mb-2">
                  {o.badge && <LimeBadge>{o.badge}</LimeBadge>}
                  {o.discount && <span className="font-display font-bold text-sm">{o.discount}</span>}
                </div>
                <div className="font-medium text-sm mb-1 line-clamp-1">{o.title}</div>
                <div className="text-xs text-[#8A8478] line-clamp-2">{o.description}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top review */}
        {topReview && (
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < topReview.rating ? 'fill-[#C5F82A] text-[#C5F82A]' : 'text-[#E5E1D7]'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4">"{topReview.comment}"</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-[#C5F82A] flex items-center justify-center font-display font-semibold text-xs">
                {topReview.customerName.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium">{topReview.customerName}</div>
                {topReview.service && <div className="text-xs text-[#8A8478]">{topReview.service}</div>}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
