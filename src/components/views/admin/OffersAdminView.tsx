'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardSkeleton, PageHeading, LimeBadge } from '../shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, Pencil, Tag, CalendarClock, Percent, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { authedFetch } from '@/lib/auth-client'

type Offer = {
  id: string
  title: string
  description: string
  badge: string | null
  discount: string | null
  validUntil: string | null
  active: boolean
  createdAt: string
}

export function OffersAdminView() {
  const adminUser = useAppStore((s) => s.adminUser)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await authedFetch('/api/offers?all=1')
      const d = await r.json()
      setOffers(d.offers || [])
    } catch {
      toast.error('Failed to load offers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (adminUser?.role !== 'developer') {
    return <Card className="text-center py-16 text-[#8A8478]">You need developer access to manage offers.</Card>
  }

  const toggleActive = async (o: Offer) => {
    try {
      const r = await authedFetch(`/api/offers/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !o.active }),
      })
      if (!r.ok) throw new Error('Update failed')
      toast.success(o.active ? 'Offer deactivated.' : 'Offer activated.')
      load()
    } catch {
      toast.error('Failed to toggle offer.')
    }
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil).getTime() < Date.now()
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manage Offers"
        subtitle="Create promotions and deals shown on the home page"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true) }} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">
            <Plus className="w-4 h-4 mr-1" /> Add Offer
          </Button>
        }
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} className="h-40" />)}
        </div>
      ) : offers.length === 0 ? (
        <Card className="text-center py-16 text-[#8A8478]">
          <div className="font-display text-lg mb-1">No offers yet</div>
          <div className="text-sm">Click &ldquo;Add Offer&rdquo; to create your first promotion.</div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {offers.map((o) => {
            const expired = isExpired(o.validUntil)
            const inactive = !o.active || expired
            return (
              <Card key={o.id} className={`p-5 ${inactive ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {o.badge && <LimeBadge><Tag className="w-2.5 h-2.5" />{o.badge}</LimeBadge>}
                    {o.discount && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-[#1A1A1A] text-[#C5F82A]">
                        <Percent className="w-2.5 h-2.5" />{o.discount}
                      </span>
                    )}
                    {expired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-red-100 text-red-700">Expired</span>
                    )}
                    {!o.active && !expired && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-600">Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditing(o); setShowForm(true) }}
                      className="p-1.5 hover:bg-[#F4F1EA] rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActive(o)}
                      className={`p-1.5 rounded-lg ${o.active ? 'hover:bg-[#F4F1EA] text-[#8A8478]' : 'hover:bg-[#C5F82A]/20 text-[#1A1A1A]'}`}
                      title={o.active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${o.title}"?`)) return
                        const r = await authedFetch(`/api/offers/${o.id}`, { method: 'DELETE' })
                        if (r.ok) { toast.success('Offer deleted.'); load() }
                        else toast.error('Delete failed.')
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-1.5">{o.title}</h3>
                <p className="text-sm text-[#8A8478] line-clamp-3 mb-3">{o.description}</p>
                {o.validUntil && (
                  <div className="flex items-center gap-1.5 text-xs text-[#8A8478]">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Valid until {new Date(o.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <OfferForm open={showForm} onOpenChange={setShowForm} offer={editing} onSaved={() => { load(); setShowForm(false) }} />
    </div>
  )
}

function OfferForm({
  open, onOpenChange, offer, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  offer: Offer | null; onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [badge, setBadge] = useState('')
  const [discount, setDiscount] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (offer) {
      setTitle(offer.title)
      setDescription(offer.description)
      setBadge(offer.badge || '')
      setDiscount(offer.discount || '')
      setValidUntil(offer.validUntil ? offer.validUntil.slice(0, 10) : '')
      setActive(offer.active)
    } else {
      setTitle(''); setDescription(''); setBadge(''); setDiscount(''); setValidUntil(''); setActive(true)
    }
  }, [offer, open])

  const save = async () => {
    if (!title || !description) {
      toast.error('Title and description are required.')
      return
    }
    setSaving(true)
    try {
      const body = {
        title,
        description,
        badge: badge || null,
        discount: discount || null,
        validUntil: validUntil || null,
        active,
      }
      const url = offer ? `/api/offers/${offer.id}` : '/api/offers'
      const method = offer ? 'PATCH' : 'POST'
      const r = await authedFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || 'Save failed')
      }
      toast.success(offer ? 'Offer updated.' : 'Offer created.')
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{offer ? 'Edit Offer' : 'Add Offer'}</DialogTitle>
          <DialogDescription>{offer ? 'Update this promotion.' : 'Create a new offer for customers to see on the home page.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
          <div>
            <Label htmlFor="of-title">Title</Label>
            <Input id="of-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Festival Combo — Haircut + Facial" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="of-desc">Description</Label>
            <Textarea id="of-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what the offer includes…" className="mt-1.5 min-h-[80px] rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="of-badge">Badge (optional)</Label>
              <Input id="of-badge" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. Festival Special" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="of-disc">Discount (optional)</Label>
              <Input id="of-disc" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="e.g. 20% OFF or Save ₹200" className="mt-1.5 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="of-valid">Valid Until (optional)</Label>
              <Input id="of-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div className="flex items-end">
              <div className="flex items-center justify-between w-full p-3 rounded-xl bg-[#F4F1EA]">
                <div>
                  <div className="text-sm font-medium">Active</div>
                  <div className="text-xs text-[#8A8478]">Shown on site</div>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
