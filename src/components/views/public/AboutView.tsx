'use client'

import { useSiteContent } from '../useSiteContent'
import { Card, CardSkeleton, PageHeading } from '../shared'
import { Award, Sparkles, Heart } from 'lucide-react'

export function AboutView() {
  const { content, loading } = useSiteContent()

  if (loading || !content) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-80" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <CardSkeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  const { stylists } = content

  return (
    <div className="space-y-6">
      <PageHeading title="About the Salon" subtitle="A family salon, built on trust and tradition." />

      {/* Story card */}
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#C5F82A] font-semibold mb-3">Our Story</div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-5 leading-tight">
              A family salon, built on trust and tradition
            </h3>
            <div className="space-y-4 text-[#8A8478] leading-relaxed">
              <p>
                Mukesh Unisex Salon began in 2010 with a single chair and a simple promise — give every customer a cut they love and a chair they feel at home in. Fifteen years later, that promise still drives every snip, shave, and style.
              </p>
              <p>
                From classic men's fades and beard sculpting to balayage, keratin, and full bridal packages, our team brings together master barbers and senior colourists under one roof. Walk in for a trim, leave looking your absolute best.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="text-center p-4 rounded-xl bg-[#F4F1EA]">
                <Award className="w-5 h-5 text-[#1A1A1A] mx-auto mb-2" />
                <div className="font-display text-xl font-bold">4.9</div>
                <div className="text-[10px] text-[#8A8478] uppercase tracking-wider">Avg rating</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-[#F4F1EA]">
                <Sparkles className="w-5 h-5 text-[#1A1A1A] mx-auto mb-2" />
                <div className="font-display text-xl font-bold">10k+</div>
                <div className="text-[10px] text-[#8A8478] uppercase tracking-wider">Cuts done</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-[#F4F1EA]">
                <Heart className="w-5 h-5 text-[#1A1A1A] mx-auto mb-2" />
                <div className="font-display text-xl font-bold">200+</div>
                <div className="text-[10px] text-[#8A8478] uppercase tracking-wider">Bridal looks</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src="/about-story.png"
                alt="Mukesh at work"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#C5F82A] p-4 rounded-2xl shadow-soft-lg hidden sm:block">
              <div className="font-display text-3xl font-bold text-[#1A1A1A]">15+</div>
              <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Years of Craft</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Team */}
      <div>
        <h3 className="font-display text-xl font-semibold mb-4">Meet the Team</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stylists.map((s) => (
            <Card key={s.id} className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-[#C5F82A]/20">
                {s.image && <img src={s.image} alt={s.name} className="w-full h-full object-cover" />}
              </div>
              <h4 className="font-display text-lg font-semibold">{s.name}</h4>
              <div className="text-xs text-[#1A1A1A] font-medium mb-2">{s.specialty}</div>
              <div className="text-xs text-[#8A8478] mb-3">{s.experience} years experience</div>
              {s.bio && <p className="text-xs text-[#8A8478] line-clamp-3">{s.bio}</p>}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
