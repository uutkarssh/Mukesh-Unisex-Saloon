'use client'

import { useState } from 'react'
import { useSiteContent } from '../useSiteContent'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardSkeleton, LimeBadge, PageHeading } from '../shared'
import { Clock, ArrowRight } from 'lucide-react'

const CATEGORIES = ['All', 'Men', 'Women', 'Unisex'] as const

export function ServicesView() {
  const { content, loading } = useSiteContent()
  const openBooking = useAppStore((s) => s.openBooking)
  const [cat, setCat] = useState<typeof CATEGORIES[number]>('All')

  if (loading || !content) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} className="h-56" />)}
        </div>
      </div>
    )
  }

  const services = cat === 'All' ? content.services : content.services.filter((s) => s.category === cat)

  return (
    <div className="space-y-6">
      <PageHeading
        title="Services & Pricing"
        subtitle="Transparent pricing, expert hands. Book any service in seconds."
      />

      {/* Category filter */}
      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              cat === c
                ? 'bg-[#1A1A1A] text-[#F4F1EA]'
                : 'bg-white border border-[#E5E1D7] text-[#8A8478] hover:text-[#1A1A1A]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id} className="p-0 overflow-hidden hover:shadow-soft-lg transition-shadow group flex flex-col">
            <div className="h-40 bg-[#F4F1EA] relative overflow-hidden">
              {s.image && (
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              {s.popular && <LimeBadge className="absolute top-3 left-3">Popular</LimeBadge>}
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 backdrop-blur text-[#1A1A1A]">
                {s.category}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-display text-lg font-semibold mb-1.5">{s.name}</h3>
              <p className="text-sm text-[#8A8478] line-clamp-2 mb-4 flex-1">{s.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#8A8478]">
                  <Clock className="w-3.5 h-3.5" />
                  {s.duration} min
                </span>
                <span className="font-display text-xl font-bold">₹{s.price}</span>
              </div>
              <button
                onClick={() => openBooking(s.id)}
                className="w-full h-10 rounded-xl bg-[#1A1A1A] text-[#F4F1EA] text-sm font-semibold hover:bg-[#2A2A2A] transition-colors inline-flex items-center justify-center gap-1.5 group/btn"
              >
                Book Now
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card className="text-center py-16 text-[#8A8478]">
          No services in this category yet.
        </Card>
      )}
    </div>
  )
}
