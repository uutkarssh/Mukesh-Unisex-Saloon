// Slot generation — the core booking logic.
//
// TIMEZONE NOTE: The salon operates in IST (Asia/Kolkata, UTC+5:30).
// Vercel runs in UTC, so we must NOT use Date.setHours()/getHours()
// (those use the server's timezone). Instead we compute the exact UTC
// instant for a given IST hour on a given calendar date.

import {
  getAllSettings,
  findBookingIntervalsForStylist,
  findTimeBlocksForStylist,
  findBookingIntervalsForStylistWide,
} from './queries'
import {
  BOOKING_HORIZON_DAYS,
  DEFAULT_BUFFER_MIN,
  SLOT_STEP_MIN,
  getOpenCloseHours,
  isClosedDay,
  readScheduleConfig,
} from './constants'

export type Slot = {
  startTime: string // ISO (UTC)
  endTime: string // ISO (UTC)
  available: boolean
}

export type SlotGenerationInput = {
  stylistId: string
  serviceDurationMin: number
  date: Date // the day to generate slots for (any time during the day)
}

// IST is UTC+5:30 (fixed offset, India has no DST).
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000

// Given a calendar date and an IST hour (e.g. 8 = 8:00 AM IST, 20 = 8:00 PM IST),
// return the exact UTC Date instant.
function istInstant(date: Date, hour: number, minute = 0): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  // Date.UTC(...) gives the instant for "hour:minute UTC on Y/M/D".
  // Subtract the IST offset so the result is the UTC instant for "hour:minute IST".
  return new Date(Date.UTC(y, m, d, hour, minute, 0, 0) - IST_OFFSET_MS)
}

// Given a UTC Date instant, return the IST hour as a decimal
// (e.g. 14.5 = 2:30 PM IST). Used for the open/close hour check.
function istHourDecimal(date: Date): number {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS)
  return istDate.getUTCHours() + istDate.getUTCMinutes() / 60
}

export async function generateSlots({
  stylistId,
  serviceDurationMin,
  date,
}: SlotGenerationInput): Promise<Slot[]> {
  // Load schedule config from site settings
  const settingsMap = await getAllSettings()
  const settingsArr = Object.entries(settingsMap).map(([key, value]) => ({ key, value }))
  const cfg = readScheduleConfig(settingsArr)

  // Closed day check
  if (isClosedDay(date, cfg.closedDay)) return []

  const { openHour, closeHour } = getOpenCloseHours(date, cfg)

  // Define the day's window in IST (converted to exact UTC instants).
  // e.g. openHour=8, closeHour=20 → 8:00 AM IST to 8:00 PM IST.
  const dayStart = istInstant(date, openHour)
  const dayEnd = istInstant(date, closeHour)

  // Fetch existing bookings + time blocks for this stylist on this day.
  const bufferMs = cfg.bufferMin * 60 * 1000
  const windowStart = new Date(dayStart.getTime() - bufferMs)
  const windowEnd = new Date(dayEnd.getTime() + bufferMs)

  const [bookings, blocks] = await Promise.all([
    findBookingIntervalsForStylist(stylistId, windowStart.toISOString(), windowEnd.toISOString()),
    findTimeBlocksForStylist(stylistId, windowStart.toISOString(), windowEnd.toISOString()),
  ])

  // Build a list of "occupied" intervals (with buffer applied to each).
  type Interval = { start: number; end: number }
  const occupied: Interval[] = []
  for (const b of [...bookings, ...blocks]) {
    const s = new Date(b.startTime).getTime()
    const e = new Date(b.endTime).getTime()
    occupied.push({ start: s - bufferMs, end: e + bufferMs })
  }

  const now = Date.now()
  const slots: Slot[] = []

  // Walk candidate start times in SLOT_STEP_MIN increments.
  for (let t = dayStart.getTime(); t + serviceDurationMin * 60 * 1000 <= dayEnd.getTime(); t += SLOT_STEP_MIN * 60 * 1000) {
    const start = t
    const end = t + serviceDurationMin * 60 * 1000
    const paddedStart = start - bufferMs
    const paddedEnd = end + bufferMs

    // Past check (can't book a slot that has already started)
    const inFuture = start > now

    // Overlap check against occupied (padded) intervals
    const overlaps = occupied.some(
      (iv) => paddedStart < iv.end && paddedEnd > iv.start,
    )

    slots.push({
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      available: inFuture && !overlaps,
    })
  }

  return slots
}

// Validate a booking request before persisting.
// Re-runs the slot check server-side to prevent race conditions / tampering.
export async function isSlotAvailable(
  stylistId: string,
  serviceDurationMin: number,
  startTime: Date,
): Promise<boolean> {
  const settingsMap = await getAllSettings()
  const settingsArr = Object.entries(settingsMap).map(([key, value]) => ({ key, value }))
  const cfg = readScheduleConfig(settingsArr)

  if (isClosedDay(startTime, cfg.closedDay)) return false

  const { openHour, closeHour } = getOpenCloseHours(startTime, cfg)
  // Use IST hours (not server-local getHours).
  const startHour = istHourDecimal(startTime)
  if (startHour < openHour) return false
  const endTime = new Date(startTime.getTime() + serviceDurationMin * 60 * 1000)
  const endHour = istHourDecimal(endTime)
  if (endHour > closeHour) return false

  if (startTime.getTime() <= Date.now()) return false

  const bufferMs = cfg.bufferMin * 60 * 1000
  const paddedStart = startTime.getTime() - bufferMs
  const paddedEnd = endTime.getTime() + bufferMs

  const [bookings, blocks] = await Promise.all([
    findBookingIntervalsForStylistWide(
      stylistId,
      new Date(paddedStart - 24 * 60 * 60 * 1000).toISOString(),
      new Date(paddedEnd + 24 * 60 * 60 * 1000).toISOString(),
    ),
    findTimeBlocksForStylist(
      stylistId,
      new Date(paddedStart - 24 * 60 * 60 * 1000).toISOString(),
      new Date(paddedEnd + 24 * 60 * 60 * 1000).toISOString(),
    ),
  ])

  for (const b of [...bookings, ...blocks]) {
    const s = new Date(b.startTime).getTime()
    const e = new Date(b.endTime).getTime()
    if (paddedStart < e + bufferMs && paddedEnd > s - bufferMs) {
      return false
    }
  }
  return true
}

// Helper used by the booking UI to validate the date range.
export function getBookableDateRange(): { start: Date; end: Date } {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + BOOKING_HORIZON_DAYS)
  return { start, end }
}

export { DEFAULT_BUFFER_MIN }
