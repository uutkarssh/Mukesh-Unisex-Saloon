'use client'

import { useState } from 'react'
import { useAppStore, type View } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  Home, Scissors, CalendarPlus, Image, Users, Phone,
  LayoutDashboard, CalendarDays, Settings as SettingsIcon, LogOut, Menu, X, ShieldCheck, Tag,
} from 'lucide-react'

type NavItem = { id: View; label: string; icon: React.ComponentType<{ className?: string }> }

const PUBLIC_NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'services', label: 'Services', icon: Scissors },
  { id: 'booking', label: 'Book Appointment', icon: CalendarPlus },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'about', label: 'About', icon: Users },
  { id: 'contact', label: 'Contact', icon: Phone },
]

const ADMIN_NAV_DEVELOPER: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'services-admin', label: 'Services', icon: Scissors },
  { id: 'stylists', label: 'Stylists', icon: Users },
  { id: 'gallery-admin', label: 'Gallery', icon: Image },
  { id: 'offers-admin', label: 'Offers', icon: Tag },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

const ADMIN_NAV_BARBER: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
]

export function Sidebar() {
  const currentView = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setView)
  const adminUser = useAppStore((s) => s.adminUser)
  const setAdminUser = useAppStore((s) => s.setAdminUser)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = !!adminUser
  let nav: NavItem[] = PUBLIC_NAV
  if (adminUser?.role === 'developer') nav = ADMIN_NAV_DEVELOPER
  else if (adminUser?.role === 'barber') nav = ADMIN_NAV_BARBER

  const logout = async () => {
    // Sign out of Firebase (clears localStorage) + clear server cookie.
    const { adminSignOut } = await import('@/lib/auth-client')
    await adminSignOut()
    setAdminUser(null)
    setView('home')
  }

  return (
    <>
      {/* Mobile toggle (floating, top-left) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-2xl bg-[#1A1A1A] text-[#F4F1EA] flex items-center justify-center shadow-soft-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — floating dark panel with rounded corners */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 p-3 transition-transform duration-300',
          'w-[260px] flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex-1 flex flex-col bg-[#1A1A1A] rounded-2xl shadow-sidebar overflow-hidden">
          {/* Brand header */}
          <div className="p-5 border-b border-white/5">
            <button
              onClick={() => { setView(adminUser ? 'dashboard' : 'home'); setMobileOpen(false) }}
              className="flex items-center gap-3 w-full"
            >
              <div className="w-10 h-10 rounded-xl bg-[#C5F82A] flex items-center justify-center flex-shrink-0">
                <Scissors className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div className="text-left min-w-0">
                <div className="font-display font-semibold text-[#F4F1EA] text-base leading-tight truncate">
                  Mukesh Unisex
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A8478]">
                  {isAdmin ? 'Admin Panel' : 'Salon'}
                </div>
              </div>
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden absolute top-5 right-5 text-[#8A8478] hover:text-[#F4F1EA]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scroll-dark">
            <div className="px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#8A8478] font-medium">
              {isAdmin ? 'Management' : 'Browse'}
            </div>
            {nav.map((item) => {
              const Icon = item.icon
              const active = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setMobileOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-[#F4F1EA] text-[#1A1A1A]'
                      : 'text-[#8A8478] hover:bg-white/5 hover:text-[#F4F1EA]'
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}

            {/* Public → Staff Login link (only when not authed) */}
            {!isAdmin && (
              <>
                <div className="px-3 py-2 mt-4 text-[10px] uppercase tracking-[0.18em] text-[#8A8478] font-medium">
                  Staff
                </div>
                <button
                  onClick={() => { setView('login'); setMobileOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    currentView === 'login'
                      ? 'bg-[#F4F1EA] text-[#1A1A1A]'
                      : 'text-[#8A8478] hover:bg-white/5 hover:text-[#F4F1EA]'
                  )}
                >
                  <ShieldCheck className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>Staff Login</span>
                </button>
              </>
            )}
          </nav>

          {/* Footer — user card (if authed) or logout */}
          <div className="p-3 border-t border-white/5">
            {isAdmin ? (
              <>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 mb-1">
                  <div className="w-9 h-9 rounded-lg bg-[#C5F82A] text-[#1A1A1A] flex items-center justify-center font-display font-semibold text-sm">
                    {adminUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#F4F1EA] truncate">{adminUser.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#C5F82A] font-medium">
                      {adminUser.role}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#8A8478] hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => { setView('booking'); setMobileOpen(false) }}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-[#C5F82A] text-[#1A1A1A] text-sm font-semibold hover:bg-[#d4ff3f] transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
                Book Now
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
