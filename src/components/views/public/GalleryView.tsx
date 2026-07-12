'use client'

import { useState } from 'react'
import { useSiteContent } from '../useSiteContent'
import { Card, CardSkeleton, PageHeading } from '../shared'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const FILTERS = ['All', 'haircut', 'styling', 'bridal', 'color', 'before-after'] as const
const LABELS: Record<string, string> = {
  All: 'All Work', haircut: 'Haircuts', styling: 'Styling',
  bridal: 'Bridal', color: 'Colour', 'before-after': 'Before & After',
}

export function GalleryView() {
  const { content, loading } = useSiteContent()
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All')
  const [lightbox, setLightbox] = useState<typeof content.gallery[number] | null>(null)

  if (loading || !content) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map((i) => <CardSkeleton key={i} className="aspect-square" />)}
      </div>
    )
  }

  const items = filter === 'All' ? content.gallery : content.gallery.filter((i) => i.category === filter)

  return (
    <div className="space-y-6">
      <PageHeading title="Gallery" subtitle="A look at our recent work — from sharp fades to bridal updos." />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-[#1A1A1A] text-[#F4F1EA]'
                : 'bg-white border border-[#E5E1D7] text-[#8A8478] hover:text-[#1A1A1A]'
            }`}
          >
            {LABELS[f]}
          </button>
        ))}
      </div>

      {/* Masonry grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item)}
            className="block w-full mb-4 break-inside-avoid group relative overflow-hidden rounded-2xl"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <div className="text-left text-white">
                <div className="text-[10px] uppercase tracking-wider text-[#C5F82A] mb-1">{LABELS[item.category] || item.category}</div>
                <div className="font-display font-semibold">{item.title}</div>
                {item.description && <div className="text-xs text-white/80 line-clamp-2">{item.description}</div>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="text-center py-16 text-[#8A8478]">No work in this category yet.</Card>
      )}

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0">
          {lightbox && (
            <div>
              <img src={lightbox.imageUrl} alt={lightbox.title} className="w-full max-h-[75vh] object-contain bg-black" />
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-wider text-[#C5F82A] mb-1">{LABELS[lightbox.category] || lightbox.category}</div>
                <h3 className="font-display text-xl font-semibold mb-1">{lightbox.title}</h3>
                {lightbox.description && <p className="text-sm text-[#8A8478]">{lightbox.description}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
