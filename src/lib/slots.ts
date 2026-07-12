// Slot generation — the core booking logic.
//
// Algorithm (unchanged from reference implementation):
//   1. For a given stylist + date + service duration, generate candidate start times
//      every SLOT_STEP_MIN minutes from open hour to (close hour - service duration).
//   2. For each candidate, compute the padded interval:
//        [start - buffer, start + duration + buffer]
//      This makes gaps scale with service length rather than being fixed.
//   3. A candidate is available iff its padded interval does not overlap the padded
//      interval of any existing booking or time block for that stylist on that date,
//      AND the candidate is in the future (can't book in the past).
//   4. Skip the closed day entirely.
//
// This is per-stylist (not per-salon), supporting multiple simultaneous stylists.
//
// NOTE: data access goes through the parameterized SQL layer in lib/queries.ts.

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
  startTime: string // ISO
  endTime: string // ISO
  available: boolean
}

export type SlotGenerationInput = {
  stylistId: string
  serviceDurationMin: number
  date: Date // the day to generate slots for (any time during the day)
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

  // Define the day's window (we store times as UTC ISO strings)
  const dayStart = new Date(date)
  dayStart.setHours(openHour, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(closeHour, 0, 0, 0)

  // Fetch existing bookings + time blocks for this stylist on this day.
  // Widen the window by one buffer on each side so edge-of-day overlaps are caught.
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
  const startHour = startTime.getHours() + startTime.getMinutes() / 60
  if (startHour < openHour) return false
  const endTime = new Date(startTime.getTime() + serviceDurationMin * 60 * 1000)
  const endHour = endTime.getHours() + endTime.getMinutes() / 60
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
