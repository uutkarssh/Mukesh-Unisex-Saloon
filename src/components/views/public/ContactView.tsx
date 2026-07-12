'use client'

import { useSiteContent } from '../useSiteContent'
import { Card, CardSkeleton, PageHeading } from '../shared'
import { MapPin, Phone, Clock, MessageCircle, Mail, Navigation } from 'lucide-react'

export function ContactView() {
  const { content, loading } = useSiteContent()

  if (loading || !content) {
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <CardSkeleton className="h-96" />
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      </div>
    )
  }

  const { settings } = content
  const phone = settings.phone || '+919876543210'
  const whatsapp = settings.whatsapp || phone
  const email = settings.email || 'hello@mukeshsalon.example'
  const address = settings.address || 'Mangapatti Sudhawai, Bhadohi, near Dinesh Vastralaya, Uttar Pradesh 221401'
  const lat = 25.3342000
  const lng = 82.3500831

  const waLink = `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hi Mukesh Unisex Salon, I\'d like to book an appointment.')}`
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  const mapEmbed = `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`

  return (
    <div className="space-y-6">
      <PageHeading title="Contact & Visit" subtitle="Find us, call us, message us — we're always happy to help." />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Map */}
        <Card className="p-0 overflow-hidden min-h-[400px]">
          <iframe
            title="Salon location — Mangapatti Sudhawai, Bhadohi"
            src={mapEmbed}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '400px' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>

        {/* Contact info */}
        <div className="space-y-3">
          <a href={mapsLink} target="_blank" rel="noreferrer" className="block">
            <Card className="flex items-start gap-4 hover:shadow-soft-lg transition-shadow cursor-pointer group">
              <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold mb-1">Address</div>
                <div className="text-sm text-[#8A8478]">{address}</div>
                <div className="text-xs text-[#1A1A1A] mt-1 group-hover:underline">Get directions →</div>
              </div>
              <Navigation className="w-4 h-4 text-[#8A8478] group-hover:text-[#1A1A1A]" />
            </Card>
          </a>

          <a href={`tel:${phone}`}>
            <Card className="flex items-center gap-4 hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <div className="font-display font-semibold mb-1">Call us</div>
                <div className="text-sm text-[#8A8478]">{phone}</div>
              </div>
            </Card>
          </a>

          <a href={`mailto:${email}`}>
            <Card className="flex items-center gap-4 hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <div className="font-display font-semibold mb-1">Email</div>
                <div className="text-sm text-[#8A8478]">{email}</div>
              </div>
            </Card>
          </a>

          <Card>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold mb-2">Opening hours</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8A8478]">Mon – Fri</span>
                    <span className="font-medium">{settings.hours_weekday || '10 AM – 8 PM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8478]">Sat – Sun</span>
                    <span className="font-medium">{settings.hours_weekend || '9 AM – 9 PM'}</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>Closed</span>
                    <span className="font-medium">{settings.closed_day === '1' ? 'Monday' : settings.closed_day}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <a href={waLink} target="_blank" rel="noreferrer" className="block">
            <Card className="bg-[#25D366] border-0 text-white hover:opacity-90 transition-opacity cursor-pointer">
              <div className="flex items-center justify-center gap-2 py-1">
                <MessageCircle className="w-5 h-5" />
                <span className="font-display font-semibold">Chat on WhatsApp</span>
              </div>
            </Card>
          </a>
        </div>
      </div>
    </div>
  )
}
