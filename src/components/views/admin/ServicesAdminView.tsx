'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardSkeleton, PageHeading, LimeBadge } from '../shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, IndianRupee, Clock, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { authedFetch } from '@/lib/auth-client'

type Service = {
  id: string; name: string; category: string; price: number; duration: number
  description: string; image: string | null; popular: boolean; active: boolean; order: number
}

const CATEGORIES = ['Men', 'Women', 'Unisex'] as const

export function ServicesAdminView() {
  const adminUser = useAppStore((s) => s.adminUser)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Service | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [catFilter, setCatFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await authedFetch('/api/services?all=1')
      const d = await r.json()
      setServices(d.services || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (adminUser?.role !== 'developer') {
    return <Card className="text-center py-16 text-[#8A8478]">You need developer access to manage services.</Card>
  }

  const filtered = catFilter === 'all' ? services : services.filter((s) => s.category === catFilter)

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manage Services"
        subtitle="Add, edit, or remove services and pricing"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true) }} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">
            <Plus className="w-4 h-4 mr-1" /> Add Service
          </Button>
        }
      />

      {/* Category filter */}
      <div className="flex gap-2">
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              catFilter === c ? 'bg-[#1A1A1A] text-[#F4F1EA]' : 'bg-white border border-[#E5E1D7] text-[#8A8478] hover:text-[#1A1A1A]'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-[#8A8478]">
          <div className="font-display text-lg mb-1">No services yet</div>
          <div className="text-sm">Click "Add Service" to create your first one.</div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className={`p-5 ${!s.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{s.category}</Badge>
                  {s.popular && <LimeBadge><Star className="w-2.5 h-2.5 fill-current" />Popular</LimeBadge>}
                  {!s.active && <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">Inactive</Badge>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(s); setShowForm(true) }} className="p-1.5 hover:bg-[#F4F1EA] rounded-lg">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete "${s.name}"?`)) return
                      await authedFetch(`/api/services/${s.id}`, { method: 'DELETE' })
                      toast.success('Service removed.')
                      load()
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-display font-semibold mb-1">{s.name}</h3>
              <p className="text-xs text-[#8A8478] line-clamp-2 mb-3">{s.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-[#8A8478]"><Clock className="w-3.5 h-3.5" />{s.duration}m</span>
                <span className="flex items-center font-display font-bold"><IndianRupee className="w-3.5 h-3.5" />{s.price}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceForm open={showForm} onOpenChange={setShowForm} service={editing} onSaved={() => { load(); setShowForm(false) }} />
    </div>
  )
}

function ServiceForm({
  open, onOpenChange, service, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  service: Service | null; onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('Men')
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [popular, setPopular] = useState(false)
  const [active, setActive] = useState(true)
  const [order, setOrder] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (service) {
      setName(service.name); setCategory(service.category)
      setPrice(String(service.price)); setDuration(String(service.duration))
      setDescription(service.description); setImage(service.image || '')
      setPopular(service.popular); setActive(service.active); setOrder(String(service.order))
    } else {
      setName(''); setCategory('Men'); setPrice(''); setDuration('')
      setDescription(''); setImage(''); setPopular(false); setActive(true); setOrder('0')
    }
  }, [service, open])

  const save = async () => {
    if (!name || !description || !price || !duration) {
      toast.error('Name, description, price, and duration are required.')
      return
    }
    setSaving(true)
    try {
      const body = {
        name, category, price: Number(price), duration: Number(duration),
        description, image: image || null, popular, active, order: Number(order) || 0,
      }
      const url = service ? `/api/services/${service.id}` : '/api/services'
      const method = service ? 'PATCH' : 'POST'
      const r = await authedFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error || 'Save failed')
      }
      toast.success(service ? 'Service updated.' : 'Service created.')
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
          <DialogTitle className="font-display">{service ? 'Edit Service' : 'Add Service'}</DialogTitle>
          <DialogDescription>{service ? 'Update the service details.' : 'Create a new service for customers to book.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
          <div>
            <Label htmlFor="sv-name">Name</Label>
            <Input id="sv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic Haircut" className="mt-1.5 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sv-duration">Duration (min)</Label>
              <Input id="sv-duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" className="mt-1.5 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sv-price">Price (₹)</Label>
              <Input id="sv-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="200" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="sv-order">Order</Label>
              <Input id="sv-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </div>
          <div>
            <Label htmlFor="sv-desc">Description</Label>
            <Textarea id="sv-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the service" className="mt-1.5 min-h-[80px] rounded-xl" />
          </div>
          <div>
            <Label htmlFor="sv-image">Image URL (optional)</Label>
            <Input id="sv-image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className="mt-1.5 rounded-xl" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F1EA]">
            <div>
              <div className="text-sm font-medium">Show as Popular</div>
              <div className="text-xs text-[#8A8478]">Highlights on home page</div>
            </div>
            <Switch checked={popular} onCheckedChange={setPopular} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F1EA]">
            <div>
              <div className="text-sm font-medium">Active</div>
              <div className="text-xs text-[#8A8478]">Inactive services can't be booked</div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
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
