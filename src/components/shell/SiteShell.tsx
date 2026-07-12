'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { LoginView } from '../views/LoginView'
import {
  HomeView, ServicesView, BookingView, GalleryView, AboutView, ContactView,
} from '../views/public'
import {
  DashboardView, AppointmentsView, ServicesAdminView, StylistsView,
  GalleryAdminView, OffersAdminView, SettingsView,
} from '../views/admin'
import { subscribeAdminUser } from '@/lib/auth-client'

export function SiteShell() {
  const currentView = useAppStore((s) => s.currentView)
  const adminUser = useAppStore((s) => s.adminUser)
  const authChecked = useAppStore((s) => s.authChecked)
  const setAdminUser = useAppStore((s) => s.setAdminUser)
  const setAuthChecked = useAppStore((s) => s.setAuthChecked)
  const setView = useAppStore((s) => s.setView)

  // Subscribe to Firebase + cookie auth state. This fires immediately with
  // any remembered user (Firebase persists in localStorage, so the admin
  // stays logged in across reloads even inside a cross-origin iframe where
  // cookies are blocked).
  useEffect(() => {
    const unsub = subscribeAdminUser((u) => {
      setAdminUser(u)
      setAuthChecked(true)
    })
    return unsub
  }, [setAdminUser, setAuthChecked])

  // Sync hash on popstate (back/forward)
  useEffect(() => {
    const onPop = () => {
      const h = window.location.hash.replace('#', '')
      const valid = ['home','services','booking','gallery','about','contact','login','dashboard','appointments','services-admin','stylists','gallery-admin','offers-admin','settings']
      setView(valid.includes(h) ? (h as typeof currentView) : 'home')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setView])

  // Guard admin views — if not authed, redirect to login
  const adminViews = ['dashboard','appointments','services-admin','stylists','gallery-admin','offers-admin','settings']
  const isAdminView = adminViews.includes(currentView)
  useEffect(() => {
    if (authChecked && isAdminView && !adminUser) {
      setView('login')
    }
  }, [authChecked, isAdminView, adminUser, setView])

  // Barber role guard — barbers can only see dashboard + appointments
  const barberAllowed = ['dashboard', 'appointments']
  useEffect(() => {
    if (adminUser?.role === 'barber' && isAdminView && !barberAllowed.includes(currentView)) {
      setView('dashboard')
    }
  }, [adminUser, isAdminView, currentView, setView])

  const renderView = () => {
    // Login is a full-screen view (no shell)
    if (currentView === 'login') return <LoginView />

    switch (currentView) {
      case 'home': return <HomeView />
      case 'services': return <ServicesView />
      case 'booking': return <BookingView />
      case 'gallery': return <GalleryView />
      case 'about': return <AboutView />
      case 'contact': return <ContactView />
      case 'dashboard': return <DashboardView />
      case 'appointments': return <AppointmentsView />
      case 'services-admin': return <ServicesAdminView />
      case 'stylists': return <StylistsView />
      case 'gallery-admin': return <GalleryAdminView />
      case 'offers-admin': return <OffersAdminView />
      case 'settings': return <SettingsView />
      default: return <HomeView />
    }
  }

  // Login view is standalone (no sidebar)
  if (currentView === 'login') {
    return <LoginView />
  }

  return (
    <div className="min-h-screen flex bg-[#F4F1EA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  )
}
