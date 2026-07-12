// Global UI state for the Mukesh Unisex Salon app.
// Single-page app with view-based routing. The sidebar + topbar are always present.
// Auth state determines which nav items show.

import { create } from 'zustand'

export type View =
  // Public views (no auth required)
  | 'home'
  | 'services'
  | 'booking'
  | 'gallery'
  | 'about'
  | 'contact'
  | 'login'
  // Admin views (auth required)
  | 'dashboard'
  | 'appointments'
  | 'services-admin'
  | 'stylists'
  | 'gallery-admin'
  | 'offers-admin'
  | 'settings'

export type AdminUser = {
  userId: string
  email: string
  name: string
  role: 'developer' | 'barber'
}

type AppState = {
  currentView: View
  adminUser: AdminUser | null
  authChecked: boolean
  // For booking page — optional preselected service
  preselectedServiceId?: string

  setView: (v: View) => void
  setAdminUser: (u: AdminUser | null) => void
  setAuthChecked: (b: boolean) => void
  setPreselectedService: (id?: string) => void
  openBooking: (serviceId?: string) => void
}

function readHashView(): View {
  if (typeof window === 'undefined') return 'home'
  const h = window.location.hash.replace('#', '')
  const valid: View[] = [
    'home', 'services', 'booking', 'gallery', 'about', 'contact', 'login',
    'dashboard', 'appointments', 'services-admin', 'stylists', 'gallery-admin', 'offers-admin', 'settings',
  ]
  return (valid.includes(h as View) ? h : 'home') as View
}

function writeHashView(v: View) {
  if (typeof window === 'undefined') return
  const newHash = v === 'home' ? '#' : `#${v}`
  if (window.location.hash !== newHash) {
    window.history.pushState(null, '', newHash)
  }
}

export const useAppStore = create<AppState>((set) => ({
  currentView: typeof window !== 'undefined' ? readHashView() : 'home',
  adminUser: null,
  authChecked: false,
  preselectedServiceId: undefined,

  setView: (v) => {
    writeHashView(v)
    set({ currentView: v })
    // Scroll main content to top on view change
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const main = document.getElementById('main-content')
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
      })
    }
  },
  setAdminUser: (u) => set({ adminUser: u }),
  setAuthChecked: (b) => set({ authChecked: b }),
  setPreselectedService: (id) => set({ preselectedServiceId: id }),
  openBooking: (serviceId) => {
    set({ preselectedServiceId: serviceId })
    writeHashView('booking')
    set({ currentView: 'booking' })
  },
}))
