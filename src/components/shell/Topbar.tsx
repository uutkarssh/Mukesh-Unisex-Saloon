'use client'

import { useAppStore, type View } from '@/store/useAppStore'
import { Search, Bell, CalendarPlus, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'

const TITLES: Record<View, { title: string; sub: string }> = {
  home: { title: 'Welcome', sub: 'Premium salon services in Bhadohi' },
  services: { title: 'Services & Pricing', sub: 'Transparent pricing, expert hands' },
  booking: { title: 'Book an Appointment', sub: 'Pick a service, stylist, and time — no signup needed' },
  gallery: { title: 'Gallery', sub: 'A look at our recent work' },
  about: { title: 'About the Salon', sub: 'Our story and our team' },
  contact: { title: 'Contact & Visit', sub: 'Find us, call us, message us' },
  login: { title: 'Staff Login', sub: 'Restricted access' },
  dashboard: { title: "Today's Overview", sub: 'Your salon at a glance' },
  appointments: { title: 'Appointments', sub: 'Manage today and upcoming bookings' },
  'services-admin': { title: 'Manage Services', sub: 'Add, edit, or remove services' },
  stylists: { title: 'Manage Stylists', sub: 'Your team of experts' },
  'gallery-admin': { title: 'Manage Gallery', sub: 'Upload and organise your work' },
  'offers-admin': { title: 'Manage Offers', sub: 'Create promotions and deals' },
  settings: { title: 'Settings', sub: 'Salon hours, contact info, and more' },
}

export function Topbar() {
  const currentView = useAppStore((s) => s.currentView)
  const adminUser = useAppStore((s) => s.adminUser)
  const openBooking = useAppStore((s) => s.openBooking)
  const setView = useAppStore((s) => s.setView)

  const t = TITLES[currentView] || TITLES.home
  const isAdmin = !!adminUser
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header className="sticky top-0 z-30 bg-[#F4F1EA]/80 backdrop-blur-md border-b border-[#E5E1D7]">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Page title */}
        <div className="lg:ml-0 ml-14 lg:ml-0 min-w-0">
          <h1 className="font-display text-lg font-semibold leading-tight truncate">{t.title}</h1>
          <p className="text-xs text-[#8A8478] truncate hidden sm:block">{t.sub}</p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search (admin only — public site is browse-oriented) */}
          {isAdmin && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
              <Input
                placeholder="Search…"
                className="pl-9 w-48 lg:w-64 rounded-full bg-white border-[#E5E1D7] h-9 text-sm"
              />
            </div>
          )}

          {/* Date (admin only) */}
          {isAdmin && (
            <div className="hidden lg:flex items-center text-xs text-[#8A8478] px-3 py-1.5 rounded-full bg-white border border-[#E5E1D7]">
              {today}
            </div>
          )}

          {/* Notification bell (admin only) */}
          {isAdmin && (
            <button className="relative w-9 h-9 rounded-full bg-white border border-[#E5E1D7] flex items-center justify-center text-[#8A8478] hover:text-[#1A1A1A] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C5F82A]" />
            </button>
          )}

          {/* Avatar (admin only) */}
          {isAdmin && (
            <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-[#C5F82A] flex items-center justify-center font-display font-semibold text-sm">
              {adminUser.name.charAt(0)}
            </div>
          )}

          {/* Book Now (public only) */}
          {!isAdmin && currentView !== 'booking' && (
            <button
              onClick={() => openBooking()}
              className="flex items-center gap-2 px-4 sm:px-5 h-9 rounded-full bg-[#1A1A1A] text-[#F4F1EA] text-sm font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Book Now</span>
            </button>
          )}

          {/* Back to site (when on booking page) */}
          {!isAdmin && currentView === 'booking' && (
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 px-4 h-9 rounded-full bg-white border border-[#E5E1D7] text-[#1A1A1A] text-sm font-medium hover:bg-[#EDE9DF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
