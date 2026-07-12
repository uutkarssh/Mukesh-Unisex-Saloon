'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardSkeleton, PageHeading } from '../shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { authedFetch } from '@/lib/auth-client'

type Stylist = {
  id: string; name: string; specialty: string; experience: number
  bio: string | null; image: string | null; active: boolean; order: number
}

export function StylistsView() {
  const adminUser = useAppStore((s) => s.adminUser)
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Stylist | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await authedFetch('/api/stylists?all=1')
      const d = await r.json()
      setStylists(d.stylists || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (adminUser?.role !== 'developer') {
    return <Card className="text-center py-16 text-[#8A8478]">You need developer access to manage stylists.</Card>
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manage Stylists"
        subtitle="Your team of experts"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true) }} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">
            <Plus className="w-4 h-4 mr-1" /> Add Stylist
          </Button>
        }
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <CardSkeleton key={i} className="h-56" />)}
        </div>
      ) : stylists.length === 0 ? (
        <Card className="text-center py-16 text-[#8A8478]">
          <div className="font-display text-lg mb-1">No stylists yet</div>
          <div className="text-sm">Add your first team member.</div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stylists.map((s) => (
            <Card key={s.id} className={`text-center ${!s.active ? 'opacity-50' : ''}`}>
              <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-[#C5F82A]/20 bg-[#F4F1EA]">
                {s.image && <img src={s.image} alt={s.name} className="w-full h-full object-cover" />}
              </div>
              <h3 className="font-display font-semibold text-lg">{s.name}</h3>
              <div className="text-xs text-[#1A1A1A] font-medium mb-1">{s.specialty}</div>
              <div className="text-xs text-[#8A8478] mb-3">{s.experience} years experience</div>
              {s.bio && <p className="text-xs text-[#8A8478] line-clamp-3 mb-3">{s.bio}</p>}
              {!s.active && <Badge variant="outline" className="text-[10px] text-red-500 border-red-200 mb-3">Inactive</Badge>}
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => { setEditing(s); setShowForm(true) }} className="rounded-lg">
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 rounded-lg"
                  onClick={async () => {
                    if (!confirm(`Remove ${s.name}? (This deactivates — booking history is preserved.)`)) return
                    await authedFetch(`/api/stylists/${s.id}`, { method: 'DELETE' })
                    toast.success('Stylist deactivated.')
                    load()
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <StylistForm open={showForm} onOpenChange={setShowForm} stylist={editing} onSaved={() => { load(); setShowForm(false) }} />
    </div>
  )
}

function StylistForm({
  open, onOpenChange, stylist, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  stylist: Stylist | null; onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [experience, setExperience] = useState('0')
  const [bio, setBio] = useState('')
  const [image, setImage] = useState('')
  const [active, setActive] = useState(true)
  const [order, setOrder] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (stylist) {
      setName(stylist.name); setSpecialty(stylist.specialty)
      setExperience(String(stylist.experience)); setBio(stylist.bio || '')
      setImage(stylist.image || ''); setActive(stylist.active); setOrder(String(stylist.order))
    } else {
      setName(''); setSpecialty(''); setExperience('0'); setBio(''); setImage(''); setActive(true); setOrder('0')
    }
  }, [stylist, open])

  const save = async () => {
    if (!name || !specialty) { toast.error('Name and specialty are required.'); return }
    setSaving(true)
    try {
      const body = {
        name, specialty, experience: Number(experience) || 0,
        bio: bio || null, image: image || null, active, order: Number(order) || 0,
      }
      const url = stylist ? `/api/stylists/${stylist.id}` : '/api/stylists'
      const method = stylist ? 'PATCH' : 'POST'
      const r = await authedFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Save failed') }
      toast.success(stylist ? 'Stylist updated.' : 'Stylist added.')
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
          <DialogTitle className="font-display">{stylist ? 'Edit Stylist' : 'Add Stylist'}</DialogTitle>
          <DialogDescription>{stylist ? 'Update stylist profile.' : 'Add a new team member.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
          <div>
            <Label htmlFor="st-name">Name</Label>
            <Input id="st-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="st-spec">Specialty</Label>
            <Input id="st-spec" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Men's Haircut Specialist" className="mt-1.5 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="st-exp">Experience (years)</Label>
              <Input id="st-exp" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="st-order">Display order</Label>
              <Input id="st-order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} className="mt-1.5 rounded-xl" />
            </div>
          </div>
          <div>
            <Label htmlFor="st-bio">Bio</Label>
            <Textarea id="st-bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5 min-h-[80px] rounded-xl" />
          </div>
          <div>
            <Label htmlFor="st-image">Photo URL</Label>
            <Input id="st-image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className="mt-1.5 rounded-xl" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F1EA]">
            <div className="text-sm font-medium">Active</div>
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
