// Parameterized SQL query layer.
// Every function here uses `?` placeholders + args arrays — never string-concatenated SQL.
// Row mappers convert SQLite integers (0/1) back to booleans so the frontend
// (which expects Prisma-style boolean fields) works unchanged.

import { db } from './db'

// ---------- helpers ----------

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true'
  return false
}

function val(v: unknown): string | null {
  if (v === null || v === undefined) return null
  return String(v)
}

// Run a statement that doesn't return rows (INSERT/UPDATE/DELETE).
async function run(sql: string, args: unknown[] = []) {
  return db.execute({ sql, args: args as never })
}

// ---------- AdminUser ----------

export type AdminUserRow = {
  id: string
  email: string
  passwordHash: string
  name: string
  role: 'developer' | 'barber'
  active: boolean
  createdAt: string
  updatedAt: string
}

export async function findAdminByEmail(email: string): Promise<AdminUserRow | null> {
  const res = await db.execute({
    sql: 'SELECT id, email, passwordHash, name, role, active, createdAt, updatedAt FROM AdminUser WHERE email = ? LIMIT 1',
    args: [email.toLowerCase().trim()],
  })
  const r = res.rows[0]
  if (!r) return null
  return {
    id: String(r.id),
    email: String(r.email),
    passwordHash: String(r.passwordHash),
    name: String(r.name),
    role: String(r.role) as 'developer' | 'barber',
    active: toBool(r.active),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  }
}

// ---------- SiteSetting ----------

export async function getAllSettings(): Promise<Record<string, string>> {
  const res = await db.execute({ sql: 'SELECT key, value FROM SiteSetting', args: [] })
  const map: Record<string, string> = {}
  for (const r of res.rows) map[String(r.key)] = String(r.value)
  return map
}

export async function getSetting(key: string): Promise<string | null> {
  const res = await db.execute({
    sql: 'SELECT value FROM SiteSetting WHERE key = ? LIMIT 1',
    args: [key],
  })
  const r = res.rows[0]
  return r ? String(r.value) : null
}

export async function upsertSetting(key: string, value: string): Promise<void> {
  // SQLite UPSERT
  await run(
    `INSERT INTO SiteSetting (id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [cryptoRandomId(), key, value],
  )
}

// ---------- Service ----------

export type ServiceRow = {
  id: string
  name: string
  category: string
  price: number
  duration: number
  description: string
  image: string | null
  popular: boolean
  active: boolean
  order: number
  createdAt: string
  updatedAt: string
}

function mapService(r: Record<string, unknown>): ServiceRow {
  return {
    id: String(r.id),
    name: String(r.name),
    category: String(r.category),
    price: Number(r.price),
    duration: Number(r.duration),
    description: String(r.description),
    image: val(r.image),
    popular: toBool(r.popular),
    active: toBool(r.active),
    order: Number(r.order),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  }
}

export async function findServices(opts: {
  activeOnly?: boolean
  category?: string | null
} = {}): Promise<ServiceRow[]> {
  const where: string[] = []
  const args: unknown[] = []
  if (opts.activeOnly) {
    where.push('active = 1')
  }
  if (opts.category) {
    where.push('category = ?')
    args.push(opts.category)
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const res = await db.execute({
    sql: `SELECT id, name, category, price, duration, description, image, popular, active, "order", createdAt, updatedAt FROM Service ${clause} ORDER BY "order" ASC, name ASC`,
    args: args as never,
  })
  return res.rows.map((r) => mapService(r as Record<string, unknown>))
}

export async function findServiceById(id: string): Promise<ServiceRow | null> {
  const res = await db.execute({
    sql: `SELECT id, name, category, price, duration, description, image, popular, active, "order", createdAt, updatedAt FROM Service WHERE id = ? LIMIT 1`,
    args: [id],
  })
  const r = res.rows[0]
  return r ? mapService(r as Record<string, unknown>) : null
}

export async function createService(data: {
  name: string
  category: string
  price: number
  duration: number
  description: string
  image: string | null
  popular: boolean
  order: number
}): Promise<ServiceRow> {
  const id = cryptoRandomId()
  await run(
    `INSERT INTO Service (id, name, category, price, duration, description, image, popular, active, "order", createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, data.name, data.category, data.price, data.duration, data.description, data.image, data.popular ? 1 : 0, data.order],
  )
  const created = await findServiceById(id)
  return created!
}

export async function updateService(id: string, data: Partial<{
  name: string
  category: string
  price: number
  duration: number
  description: string
  image: string | null
  popular: boolean
  active: boolean
  order: number
}>): Promise<void> {
  const sets: string[] = []
  const args: unknown[] = []
  for (const k of ['name', 'category', 'description'] as const) {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); args.push(data[k]) }
  }
  if (data.image !== undefined) { sets.push('image = ?'); args.push(data.image) }
  if (data.price !== undefined) { sets.push('price = ?'); args.push(data.price) }
  if (data.duration !== undefined) { sets.push('duration = ?'); args.push(data.duration) }
  if (data.popular !== undefined) { sets.push('popular = ?'); args.push(data.popular ? 1 : 0) }
  if (data.active !== undefined) { sets.push('active = ?'); args.push(data.active ? 1 : 0) }
  if (data.order !== undefined) { sets.push('"order" = ?'); args.push(data.order) }
  if (sets.length === 0) return
  sets.push('updatedAt = CURRENT_TIMESTAMP')
  args.push(id)
  await run(`UPDATE Service SET ${sets.join(', ')} WHERE id = ?`, args)
}

// ---------- Stylist ----------

export type StylistRow = {
  id: string
  name: string
  specialty: string
  experience: number
  bio: string | null
  image: string | null
  active: boolean
  order: number
  createdAt: string
  updatedAt: string
}

function mapStylist(r: Record<string, unknown>): StylistRow {
  return {
    id: String(r.id),
    name: String(r.name),
    specialty: String(r.specialty),
    experience: Number(r.experience),
    bio: val(r.bio),
    image: val(r.image),
    active: toBool(r.active),
    order: Number(r.order),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  }
}

export async function findStylists(opts: { activeOnly?: boolean } = {}): Promise<StylistRow[]> {
  const where = opts.activeOnly ? 'WHERE active = 1' : ''
  const res = await db.execute({
    sql: `SELECT id, name, specialty, experience, bio, image, active, "order", createdAt, updatedAt FROM Stylist ${where} ORDER BY "order" ASC, name ASC`,
    args: [],
  })
  return res.rows.map((r) => mapStylist(r as Record<string, unknown>))
}

export async function findStylistById(id: string): Promise<StylistRow | null> {
  const res = await db.execute({
    sql: `SELECT id, name, specialty, experience, bio, image, active, "order", createdAt, updatedAt FROM Stylist WHERE id = ? LIMIT 1`,
    args: [id],
  })
  const r = res.rows[0]
  return r ? mapStylist(r as Record<string, unknown>) : null
}

export async function createStylist(data: {
  name: string
  specialty: string
  experience: number
  bio: string | null
  image: string | null
  order: number
}): Promise<StylistRow> {
  const id = cryptoRandomId()
  await run(
    `INSERT INTO Stylist (id, name, specialty, experience, bio, image, active, "order", createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, data.name, data.specialty, data.experience, data.bio, data.image, data.order],
  )
  return (await findStylistById(id))!
}

export async function updateStylist(id: string, data: Partial<{
  name: string
  specialty: string
  bio: string | null
  image: string | null
  experience: number
  active: boolean
  order: number
}>): Promise<void> {
  const sets: string[] = []
  const args: unknown[] = []
  for (const k of ['name', 'specialty', 'bio', 'image'] as const) {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); args.push(data[k]) }
  }
  if (data.experience !== undefined) { sets.push('experience = ?'); args.push(data.experience) }
  if (data.active !== undefined) { sets.push('active = ?'); args.push(data.active ? 1 : 0) }
  if (data.order !== undefined) { sets.push('"order" = ?'); args.push(data.order) }
  if (sets.length === 0) return
  sets.push('updatedAt = CURRENT_TIMESTAMP')
  args.push(id)
  await run(`UPDATE Stylist SET ${sets.join(', ')} WHERE id = ?`, args)
}

export async function countStylists(activeOnly = false): Promise<number> {
  const res = await db.execute({
    sql: `SELECT COUNT(*) as c FROM Stylist ${activeOnly ? 'WHERE active = 1' : ''}`,
    args: [],
  })
  return Number((res.rows[0] as Record<string, unknown>).c)
}

// ---------- GalleryItem ----------

export type GalleryRow = {
  id: string
  title: string
  category: string
  imageUrl: string
  description: string | null
  featured: boolean
  createdAt: string
}

function mapGallery(r: Record<string, unknown>): GalleryRow {
  return {
    id: String(r.id),
    title: String(r.title),
    category: String(r.category),
    imageUrl: String(r.imageUrl),
    description: val(r.description),
    featured: toBool(r.featured),
    createdAt: String(r.createdAt),
  }
}

export async function findGallery(opts: { category?: string | null } = {}): Promise<GalleryRow[]> {
  const where = opts.category ? 'WHERE category = ?' : ''
  const args = opts.category ? [opts.category] : []
  const res = await db.execute({
    sql: `SELECT id, title, category, imageUrl, description, featured, createdAt FROM GalleryItem ${where} ORDER BY featured DESC, createdAt DESC`,
    args: args as never,
  })
  return res.rows.map((r) => mapGallery(r as Record<string, unknown>))
}

export async function createGallery(data: {
  title: string
  category: string
  imageUrl: string
  description: string | null
  featured: boolean
}): Promise<GalleryRow> {
  const id = cryptoRandomId()
  await run(
    `INSERT INTO GalleryItem (id, title, category, imageUrl, description, featured, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, data.title, data.category, data.imageUrl, data.description, data.featured ? 1 : 0],
  )
  const res = await db.execute({ sql: 'SELECT id, title, category, imageUrl, description, featured, createdAt FROM GalleryItem WHERE id = ?', args: [id] })
  return mapGallery(res.rows[0] as Record<string, unknown>)
}

export async function deleteGallery(id: string): Promise<void> {
  await run('DELETE FROM GalleryItem WHERE id = ?', [id])
}

export async function updateGallery(id: string, data: Partial<{
  title: string
  category: string
  imageUrl: string
  description: string | null
  featured: boolean
}>): Promise<void> {
  const sets: string[] = []
  const args: unknown[] = []
  for (const k of ['title', 'category', 'imageUrl', 'description'] as const) {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); args.push(data[k]) }
  }
  if (data.featured !== undefined) { sets.push('featured = ?'); args.push(data.featured ? 1 : 0) }
  if (sets.length === 0) return
  args.push(id)
  await run(`UPDATE GalleryItem SET ${sets.join(', ')} WHERE id = ?`, args)
}

// ---------- Offer ----------

export type OfferRow = {
  id: string
  title: string
  description: string
  badge: string | null
  discount: string | null
  validUntil: string | null
  active: boolean
  createdAt: string
}

function mapOffer(r: Record<string, unknown>): OfferRow {
  return {
    id: String(r.id),
    title: String(r.title),
    description: String(r.description),
    badge: val(r.badge),
    discount: val(r.discount),
    validUntil: val(r.validUntil),
    active: toBool(r.active),
    createdAt: String(r.createdAt),
  }
}

export async function findActiveOffers(): Promise<OfferRow[]> {
  const nowIso = new Date().toISOString()
  // active = 1 AND (validUntil IS NULL OR validUntil > now)
  const res = await db.execute({
    sql: `SELECT id, title, description, badge, discount, validUntil, active, createdAt FROM Offer WHERE active = 1 AND (validUntil IS NULL OR validUntil > ?) ORDER BY createdAt DESC`,
    args: [nowIso],
  })
  return res.rows.map((r) => mapOffer(r as Record<string, unknown>))
}

// Admin: list ALL offers (including inactive/expired)
export async function findAllOffers(): Promise<OfferRow[]> {
  const res = await db.execute({
    sql: `SELECT id, title, description, badge, discount, validUntil, active, createdAt FROM Offer ORDER BY createdAt DESC`,
    args: [],
  })
  return res.rows.map((r) => mapOffer(r as Record<string, unknown>))
}

export async function createOffer(data: {
  title: string
  description: string
  badge: string | null
  discount: string | null
  validUntil: string | null
  active: boolean
}): Promise<OfferRow> {
  const id = cryptoRandomId()
  await run(
    `INSERT INTO Offer (id, title, description, badge, discount, validUntil, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, data.title, data.description, data.badge, data.discount, data.validUntil, data.active ? 1 : 0],
  )
  const res = await db.execute({ sql: 'SELECT id, title, description, badge, discount, validUntil, active, createdAt FROM Offer WHERE id = ?', args: [id] })
  return mapOffer(res.rows[0] as Record<string, unknown>)
}

export async function updateOffer(id: string, data: Partial<{
  title: string
  description: string
  badge: string | null
  discount: string | null
  validUntil: string | null
  active: boolean
}>): Promise<void> {
  const sets: string[] = []
  const args: unknown[] = []
  for (const k of ['title', 'description', 'badge', 'discount', 'validUntil'] as const) {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); args.push(data[k]) }
  }
  if (data.active !== undefined) { sets.push('active = ?'); args.push(data.active ? 1 : 0) }
  if (sets.length === 0) return
  args.push(id)
  await run(`UPDATE Offer SET ${sets.join(', ')} WHERE id = ?`, args)
}

export async function deleteOffer(id: string): Promise<void> {
  await run('DELETE FROM Offer WHERE id = ?', [id])
}

// ---------- Review ----------

export type ReviewRow = {
  id: string
  customerName: string
  rating: number
  comment: string
  service: string | null
  approved: boolean
  createdAt: string
}

function mapReview(r: Record<string, unknown>): ReviewRow {
  return {
    id: String(r.id),
    customerName: String(r.customerName),
    rating: Number(r.rating),
    comment: String(r.comment),
    service: val(r.service),
    approved: toBool(r.approved),
    createdAt: String(r.createdAt),
  }
}

export async function findApprovedReviews(limit?: number): Promise<ReviewRow[]> {
  const sql = `SELECT id, customerName, rating, comment, service, approved, createdAt FROM Review WHERE approved = 1 ORDER BY createdAt DESC${limit ? ` LIMIT ${limit}` : ''}`
  const res = await db.execute({ sql, args: [] })
  return res.rows.map((r) => mapReview(r as Record<string, unknown>))
}

// ---------- Booking ----------

export type BookingRow = {
  id: string
  customerName: string
  customerPhone: string
  serviceId: string
  serviceName: string
  stylistId: string
  stylistName: string
  startTime: string
  endTime: string
  durationMin: number
  price: number
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

function mapBooking(r: Record<string, unknown>): BookingRow {
  return {
    id: String(r.id),
    customerName: String(r.customerName),
    customerPhone: String(r.customerPhone),
    serviceId: String(r.serviceId),
    serviceName: String(r.serviceName),
    stylistId: String(r.stylistId),
    stylistName: String(r.stylistName),
    startTime: String(r.startTime),
    endTime: String(r.endTime),
    durationMin: Number(r.durationMin),
    price: Number(r.price),
    status: String(r.status),
    notes: val(r.notes),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  }
}

// For slot generation — only need start/end times for confirmed/done bookings of a stylist in a window.
export async function findBookingIntervalsForStylist(
  stylistId: string,
  fromIso: string,
  toIso: string,
): Promise<{ startTime: string; endTime: string }[]> {
  const res = await db.execute({
    sql: `SELECT startTime, endTime FROM Booking
          WHERE stylistId = ? AND status IN ('confirmed','done') AND startTime >= ? AND startTime <= ?`,
    args: [stylistId, fromIso, toIso],
  })
  return res.rows.map((r) => ({
    startTime: String((r as Record<string, unknown>).startTime),
    endTime: String((r as Record<string, unknown>).endTime),
  }))
}

// For isSlotAvailable re-check — wider window to catch adjacent bookings.
export async function findBookingIntervalsForStylistWide(
  stylistId: string,
  fromIso: string,
  toIso: string,
): Promise<{ startTime: string; endTime: string }[]> {
  const res = await db.execute({
    sql: `SELECT startTime, endTime FROM Booking
          WHERE stylistId = ? AND status IN ('confirmed','done') AND startTime >= ? AND startTime <= ?`,
    args: [stylistId, fromIso, toIso],
  })
  return res.rows.map((r) => ({
    startTime: String((r as Record<string, unknown>).startTime),
    endTime: String((r as Record<string, unknown>).endTime),
  }))
}

// Admin list — flexible filtering by filter (today/upcoming/past/all) + optional status.
export async function findBookingsForAdmin(opts: {
  filter?: 'today' | 'upcoming' | 'past' | 'all'
  status?: string | null
  startOfTodayIso: string
  endOfTodayIso: string
}): Promise<BookingRow[]> {
  const where: string[] = []
  const args: unknown[] = []
  if (opts.status) { where.push('status = ?'); args.push(opts.status) }
  if (opts.filter === 'today') {
    where.push('startTime >= ?'); args.push(opts.startOfTodayIso)
    where.push('startTime <= ?'); args.push(opts.endOfTodayIso)
  } else if (opts.filter === 'upcoming') {
    where.push('startTime >= ?'); args.push(opts.startOfTodayIso)
  } else if (opts.filter === 'past') {
    where.push('startTime < ?'); args.push(opts.startOfTodayIso)
  }
  // 'all' → no date filter (but barbers are restricted to upcoming upstream)
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const res = await db.execute({
    sql: `SELECT id, customerName, customerPhone, serviceId, serviceName, stylistId, stylistName, startTime, endTime, durationMin, price, status, notes, createdAt, updatedAt FROM Booking ${clause} ORDER BY startTime ASC`,
    args: args as never,
  })
  return res.rows.map((r) => mapBooking(r as Record<string, unknown>))
}

// Analytics helpers — fetch lightweight rows for stats.
export async function findBookingsInIsoRange(fromIso: string, toIso: string, excludeCancelled = true): Promise<BookingRow[]> {
  const where = ['startTime >= ?', 'startTime <= ?']
  const args: unknown[] = [fromIso, toIso]
  if (excludeCancelled) { where.push("status != 'cancelled'") }
  const res = await db.execute({
    sql: `SELECT id, customerName, customerPhone, serviceId, serviceName, stylistId, stylistName, startTime, endTime, durationMin, price, status, notes, createdAt, updatedAt FROM Booking WHERE ${where.join(' AND ')} ORDER BY startTime ASC`,
    args: args as never,
  })
  return res.rows.map((r) => mapBooking(r as Record<string, unknown>))
}

export async function findBookingsFromIso(fromIso: string, excludeCancelled = true): Promise<BookingRow[]> {
  const where = ['startTime >= ?']
  const args: unknown[] = [fromIso]
  if (excludeCancelled) { where.push("status != 'cancelled'") }
  const res = await db.execute({
    sql: `SELECT id, customerName, customerPhone, serviceId, serviceName, stylistId, stylistName, startTime, endTime, durationMin, price, status, notes, createdAt, updatedAt FROM Booking WHERE ${where.join(' AND ')} ORDER BY startTime ASC`,
    args: args as never,
  })
  return res.rows.map((r) => mapBooking(r as Record<string, unknown>))
}

export async function findAllBookingsForStats(excludeCancelled = true): Promise<BookingRow[]> {
  const where = excludeCancelled ? "WHERE status != 'cancelled'" : ''
  const res = await db.execute({
    sql: `SELECT id, customerName, customerPhone, serviceId, serviceName, stylistId, stylistName, startTime, endTime, durationMin, price, status, notes, createdAt, updatedAt FROM Booking ${where} ORDER BY startTime ASC`,
    args: [],
  })
  return res.rows.map((r) => mapBooking(r as Record<string, unknown>))
}

export async function createBooking(data: {
  customerName: string
  customerPhone: string
  serviceId: string
  serviceName: string
  stylistId: string
  stylistName: string
  startTime: string // ISO
  endTime: string // ISO
  durationMin: number
  price: number
  status: string
  notes: string | null
}): Promise<BookingRow> {
  const id = cryptoRandomId()
  await run(
    `INSERT INTO Booking (id, customerName, customerPhone, serviceId, serviceName, stylistId, stylistName, startTime, endTime, durationMin, price, status, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, data.customerName, data.customerPhone, data.serviceId, data.serviceName, data.stylistId, data.stylistName, data.startTime, data.endTime, data.durationMin, data.price, data.status, data.notes],
  )
  const res = await db.execute({ sql: 'SELECT id, customerName, customerPhone, serviceId, serviceName, stylistId, stylistName, startTime, endTime, durationMin, price, status, notes, createdAt, updatedAt FROM Booking WHERE id = ?', args: [id] })
  return mapBooking(res.rows[0] as Record<string, unknown>)
}

export async function updateBooking(id: string, data: { status?: string; notes?: string | null }): Promise<void> {
  const sets: string[] = []
  const args: unknown[] = []
  if (data.status !== undefined) { sets.push('status = ?'); args.push(data.status) }
  if (data.notes !== undefined) { sets.push('notes = ?'); args.push(data.notes) }
  if (sets.length === 0) return
  sets.push('updatedAt = CURRENT_TIMESTAMP')
  args.push(id)
  await run(`UPDATE Booking SET ${sets.join(', ')} WHERE id = ?`, args)
}

// ---------- TimeBlock ----------

export type TimeBlockRow = {
  id: string
  stylistId: string
  startTime: string
  endTime: string
  reason: string | null
  createdAt: string
}

export async function findTimeBlocksForStylist(
  stylistId: string,
  fromIso: string,
  toIso: string,
): Promise<{ startTime: string; endTime: string }[]> {
  const res = await db.execute({
    sql: `SELECT startTime, endTime FROM TimeBlock WHERE stylistId = ? AND startTime >= ? AND startTime <= ?`,
    args: [stylistId, fromIso, toIso],
  })
  return res.rows.map((r) => ({
    startTime: String((r as Record<string, unknown>).startTime),
    endTime: String((r as Record<string, unknown>).endTime),
  }))
}

export async function findTimeBlocksForAdmin(from?: string | null, to?: string | null): Promise<TimeBlockRow[]> {
  const where: string[] = []
  const args: unknown[] = []
  if (from) { where.push('startTime >= ?'); args.push(from) }
  if (to) { where.push('startTime <= ?'); args.push(to) }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const res = await db.execute({
    sql: `SELECT id, stylistId, startTime, endTime, reason, createdAt FROM TimeBlock ${clause} ORDER BY startTime ASC`,
    args: args as never,
  })
  return res.rows.map((r) => {
    const x = r as Record<string, unknown>
    return {
      id: String(x.id),
      stylistId: String(x.stylistId),
      startTime: String(x.startTime),
      endTime: String(x.endTime),
      reason: val(x.reason),
      createdAt: String(x.createdAt),
    }
  })
}

export async function createTimeBlock(data: {
  stylistId: string
  startTime: string
  endTime: string
  reason: string | null
}): Promise<TimeBlockRow> {
  const id = cryptoRandomId()
  await run(
    `INSERT INTO TimeBlock (id, stylistId, startTime, endTime, reason, createdAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, data.stylistId, data.startTime, data.endTime, data.reason],
  )
  const res = await db.execute({ sql: 'SELECT id, stylistId, startTime, endTime, reason, createdAt FROM TimeBlock WHERE id = ?', args: [id] })
  const x = res.rows[0] as Record<string, unknown>
  return { id: String(x.id), stylistId: String(x.stylistId), startTime: String(x.startTime), endTime: String(x.endTime), reason: val(x.reason), createdAt: String(x.createdAt) }
}

export async function deleteTimeBlock(id: string): Promise<void> {
  await run('DELETE FROM TimeBlock WHERE id = ?', [id])
}

// ---------- id helper (cuid-like, collision-resistant enough for this app) ----------

function cryptoRandomId(): string {
  // 24-char base36 id, similar in shape to a short cuid.
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  return `${ts}${rand}`.slice(0, 24)
}
