'use client'

import { useEffect, useState } from 'react'

export type SiteContent = {
  settings: Record<string, string>
  offers: Array<{ id: string; title: string; description: string; badge: string | null; discount: string | null; validUntil: string | null }>
  reviews: Array<{ id: string; customerName: string; rating: number; comment: string; service: string | null; createdAt: string }>
  services: Array<{ id: string; name: string; category: string; price: number; duration: number; description: string; image: string | null; popular: boolean; order: number }>
  gallery: Array<{ id: string; title: string; category: string; imageUrl: string; description: string | null; featured: boolean; createdAt: string }>
  stylists: Array<{ id: string; name: string; specialty: string; experience: number; bio: string | null; image: string | null; order: number }>
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((d) => setContent(d))
      .finally(() => setLoading(false))
  }, [])

  return { content, loading }
}
