'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardSkeleton, PageHeading } from '../shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Trash2, Star, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { authedFetch } from '@/lib/auth-client'

type GalleryItem = {
  id: string; title: string; category: string; imageUrl: string
  description: string | null; featured: boolean; createdAt: string
}

const CATEGORIES = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'styling', label: 'Styling' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'color', label: 'Colour' },
  { value: 'before-after', label: 'Before & After' },
]

export function GalleryAdminView() {
  const adminUser = useAppStore((s) => s.adminUser)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await authedFetch('/api/gallery')
      const d = await r.json()
      setItems(d.items || [])
    } catch {
      toast.error('Failed to load gallery.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (adminUser?.role !== 'developer') {
    return <Card className="text-center py-16 text-[#8A8478]">You need developer access to manage the gallery.</Card>
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter)

  return (
    <div className="space-y-6">
      <PageHeading
        title="Manage Gallery"
        subtitle="Upload and organise your work"
        action={
          <Button onClick={() => { setEditing(null); setShowForm(true) }} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">
            <Plus className="w-4 h-4 mr-1" /> Add Image
          </Button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-[#1A1A1A] text-[#F4F1EA]' : 'bg-white border border-[#E5E1D7] text-[#8A8478] hover:text-[#1A1A1A]'}`}
        >
          All ({items.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === c.value ? 'bg-[#1A1A1A] text-[#F4F1EA]' : 'bg-white border border-[#E5E1D7] text-[#8A8478] hover:text-[#1A1A1A]'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} className="aspect-square" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-[#8A8478]">
          <div className="font-display text-lg mb-1">No images yet</div>
          <div className="text-sm">Add your first gallery image.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#E5E1D7]">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-60 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                <div className="text-white text-sm font-medium line-clamp-1">{item.title}</div>
                <div className="text-white/70 text-xs">{CATEGORIES.find((c) => c.value === item.category)?.label}</div>
                {item.featured && <Star className="w-3 h-3 text-[#C5F82A] fill-[#C5F82A] mt-1" />}
              </div>
              {/* Action buttons — always visible (not hover-only) so they work on touch/mobile */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => { setEditing(item); setShowForm(true) }}
                  className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-[#1A1A1A] transition-colors backdrop-blur-sm"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${item.title}"?`)) return
                    const r = await authedFetch(`/api/gallery/${item.id}`, { method: 'DELETE' })
                    if (r.ok) { toast.success('Image removed.'); load() }
                    else toast.error('Failed to delete image.')
                  }}
                  className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-500/90 transition-colors backdrop-blur-sm"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {item.featured && (
                <div className="absolute top-2 left-2 p-1 rounded-lg bg-[#C5F82A]">
                  <Star className="w-3 h-3 fill-[#1A1A1A] text-[#1A1A1A]" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <GalleryForm open={showForm} onOpenChange={setShowForm} item={editing} onSaved={() => { load(); setShowForm(false) }} />
    </div>
  )
}

function GalleryForm({ open, onOpenChange, item, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; item: GalleryItem | null; onSaved: () => void }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('haircut')
  const [imageUrl, setImageUrl] = useState('')
  const [description, setDescription] = useState('')
  const [featured, setFeatured] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title); setCategory(item.category); setImageUrl(item.imageUrl)
      setDescription(item.description || ''); setFeatured(item.featured)
    } else {
      setTitle(''); setCategory('haircut'); setImageUrl(''); setDescription(''); setFeatured(false)
    }
  }, [item, open])

  const save = async () => {
    if (!title || !category || !imageUrl) { toast.error('Title, category, and image URL are required.'); return }
    setSaving(true)
    try {
      const body = { title, category, imageUrl, description: description || null, featured }
      const url = item ? `/api/gallery/${item.id}` : '/api/gallery'
      const method = item ? 'PATCH' : 'POST'
      // NOTE: gallery PATCH isn't implemented server-side, so edits use POST (re-create).
      // For a new image we POST. Delete is the main admin action here.
      const r = await authedFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Save failed') }
      toast.success(item ? 'Image updated.' : 'Image added.')
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
          <DialogTitle className="font-display">{item ? 'Edit Gallery Image' : 'Add Gallery Image'}</DialogTitle>
          <DialogDescription>{item ? 'Update this gallery image.' : 'Upload a photo of your work to the public gallery.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="g-title">Title</Label>
            <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sharp Skin Fade" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-2 rounded-xl text-sm border-2 transition-all ${category === c.value ? 'border-[#1A1A1A] bg-[#F4F1EA]' : 'border-[#E5E1D7]'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="g-url">Image URL</Label>
            <Input id="g-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" className="mt-1.5 rounded-xl" />
            {imageUrl && <div className="mt-2 aspect-video rounded-xl overflow-hidden bg-[#F4F1EA]"><img src={imageUrl} alt="preview" className="w-full h-full object-cover" /></div>}
          </div>
          <div>
            <Label htmlFor="g-desc">Description (optional)</Label>
            <Textarea id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 min-h-[60px] rounded-xl" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F4F1EA]">
            <div className="text-sm font-medium">Featured</div>
            <Switch checked={featured} onCheckedChange={setFeatured} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A]">{saving ? 'Saving…' : (item ? 'Save' : 'Add Image')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
