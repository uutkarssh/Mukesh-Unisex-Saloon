'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Scissors, ArrowLeft, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import { adminSignIn, adminSignInLegacy, subscribeAdminUser } from '@/lib/auth-client'

export function LoginView() {
  const setAdminUser = useAppStore((s) => s.setAdminUser)
  const setView = useAppStore((s) => s.setView)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Check existing Firebase/cookie session — if already logged in, go to dashboard.
  // subscribeAdminUser fires immediately with the current user (restored from
  // Firebase localStorage) and again whenever auth state changes.
  useEffect(() => {
    const unsub = subscribeAdminUser((u) => {
      if (u) {
        setAdminUser(u)
        setView('dashboard')
      }
    })
    return unsub
  }, [setAdminUser, setView])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Enter your email and password.')
      return
    }
    setLoading(true)
    try {
      let user
      try {
        // Primary: Firebase Auth (persists in localStorage, works in iframes).
        user = await adminSignIn(email, password)
      } catch (fbErr) {
        // Fallback: legacy DB password check (for admins not yet in Firebase).
        const msg = fbErr instanceof Error ? fbErr.message : ''
        if (msg.includes('not authorised') || msg.includes('Not authorised')) {
          // Firebase login worked but email isn't in AdminUser table — don't retry legacy.
          throw fbErr
        }
        try {
          user = await adminSignInLegacy(email, password)
        } catch {
          // Both failed — surface the Firebase error (more informative).
          throw fbErr
        }
      }
      setAdminUser(user)
      setView('dashboard')
      toast.success(`Welcome back, ${user.name}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (e: string, p: string) => {
    setEmail(e)
    setPassword(p)
  }

  return (
    <div className="min-h-screen flex bg-[#F4F1EA]">
      {/* Left side — brand panel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#1A1A1A] text-[#F4F1EA] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5F82A] opacity-10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-[#C5F82A] flex items-center justify-center">
              <Scissors className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <div className="font-display font-semibold text-xl">Mukesh Unisex Salon</div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#8A8478]">Staff Portal</div>
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">
            Welcome back to your <span className="text-[#C5F82A]">dashboard</span>.
          </h1>
          <p className="text-[#8A8478] text-lg leading-relaxed max-w-md">
            Manage appointments, track revenue, and keep your salon running smoothly — all from one place.
          </p>
        </div>
        <div className="relative text-sm text-[#8A8478]">
          Authorized personnel only. All actions are logged.
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 text-sm text-[#8A8478] hover:text-[#1A1A1A] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to site
          </button>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-[#C5F82A] flex items-center justify-center">
              <Scissors className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <div className="font-display font-semibold text-lg">Mukesh Unisex Salon</div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#8A8478]">Staff Portal</div>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold mb-2">Sign in</h2>
          <p className="text-[#8A8478] mb-8">Enter your staff credentials to continue.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mukeshsalon.com"
                className="mt-1.5 h-11 rounded-xl bg-white"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="w-3.5 h-3.5" /> Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-11 rounded-xl bg-white"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#F4F1EA]"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Signing in…</> : 'Sign In'}
            </Button>
          </form>
          
        </div>
      </div>
    </div>
  )
}
