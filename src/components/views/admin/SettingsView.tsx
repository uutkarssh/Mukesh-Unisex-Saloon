'use client'

import { useEffect, useState } from 'react'
import { Card, PageHeading } from '../shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { authedFetch } from '@/lib/auth-client'

const DAYS = [
  { value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }, { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' }, { value: '4', label: 'Thursday' }, { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
]

const FIELDS: { key: string; label: string; type?: 'text' | 'textarea'; placeholder?: string }[] = [
  { key: 'salon_name', label: 'Salon name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'phone', label: 'Phone (for calls)', placeholder: '+919876543210' },
  { key: 'whatsapp', label: 'WhatsApp number', placeholder: '+919876543210' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address', type: 'textarea' },
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'facebook', label: 'Facebook URL' },
  { key: 'hours_weekday', label: 'Weekday hours', placeholder: '10:00 AM – 8:00 PM' },
  { key: 'hours_weekend', label: 'Weekend hours', placeholder: '9:00 AM – 9:00 PM' },
]

const NUM_FIELDS: { key: string; label: string; help: string }[] = [
  { key: 'opening_hour', label: 'Weekday open (24h)', help: 'e.g. 10 = 10 AM' },
  { key: 'closing_hour', label: 'Weekday close (24h)', help: 'e.g. 20 = 8 PM' },
  { key: 'weekend_opening_hour', label: 'Weekend open (24h)', help: 'e.g. 9 = 9 AM' },
  { key: 'weekend_closing_hour', label: 'Weekend close (24h)', help: 'e.g. 21 = 9 PM' },
  { key: 'buffer_minutes', label: 'Buffer between bookings (min)', help: 'Recommended: 10–15' },
]

export function SettingsView() {
  const adminUser = useAppStore((s) => s.adminUser)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authedFetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setValues(d.settings || {}))
      .finally(() => setLoading(false))
  }, [])

  if (adminUser?.role !== 'developer') {
    return <Card className="text-center py-16 text-[#8A8478]">You need developer access to change site settings.</Card>
  }

  if (loading) return <div className="h-64 rounded-2xl bg-white animate-pulse" />

  const save = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(values).map(([key, value]) => ({ key, value: String(value) }))
      const r = await authedFetch('/api/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!r.ok) throw new Error('Save failed')
      toast.success('Settings saved.')
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }))

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeading title="Site Settings" subtitle="Salon hours, contact info, and more" />

      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Salon Information</h3>
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`set-${f.key}`}>{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea
                  id={`set-${f.key}`}
                  value={values[f.key] || ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1.5 min-h-[70px] rounded-xl"
                />
              ) : (
                <Input
                  id={`set-${f.key}`}
                  value={values[f.key] || ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1.5 rounded-xl"
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Schedule & Booking</h3>
        <div className="space-y-4">
          <div>
            <Label>Closed day (weekly off)</Label>
            <Select value={values.closed_day || '1'} onValueChange={(v) => set('closed_day', v)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#8A8478] mt-1">Customers cannot book on this day.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {NUM_FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={`set-${f.key}`}>{f.label}</Label>
                <Input id={`set-${f.key}`} type="number" value={values[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} className="mt-1.5 rounded-xl" />
                <p className="text-xs text-[#8A8478] mt-1">{f.help}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] px-8">
          {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-1.5" /> Save Settings</>}
        </Button>
      </div>
    </div>
  )
}
