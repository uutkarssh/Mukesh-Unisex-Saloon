// Salon-wide constants and helpers for hours, closed days, and buffers.
// These can be overridden at runtime by SiteSetting rows (keyed below).

export const CLOSED_DAY = 1 // 0 = Sunday, 1 = Monday. Salon is closed Mondays.

export const DEFAULT_OPEN_HOUR = 10 // 10 AM
export const DEFAULT_CLOSE_HOUR = 20 // 8 PM
export const DEFAULT_WEEKEND_OPEN_HOUR = 9
export const DEFAULT_WEEKEND_CLOSE_HOUR = 21

export const DEFAULT_BUFFER_MIN = 15 // buffer before/after each booking, scales gaps with service length

export const SLOT_STEP_MIN = 30 // candidate start times every 30 min
export const BOOKING_HORIZON_DAYS = 14 // customers can book up to 14 days ahead

export type Role = 'developer' | 'barber'

export type BookingStatus = 'confirmed' | 'done' | 'no-show' | 'cancelled'

export const ADMIN_PHONES_DEV = ['+919876543210']
export const ADMIN_PHONES_BARBER = ['+919876543211', '+919876543212']

// Read hours/buffer from a settings map (key→value), falling back to defaults.
export function readScheduleConfig(settings: { key: string; value: string }[]) {
  const map = new Map(settings.map((s) => [s.key, s.value]))
  const num = (k: string, d: number) => {
    const v = map.get(k)
    return v ? Number(v) : d
  }
  return {
    openHour: num('opening_hour', DEFAULT_OPEN_HOUR),
    closeHour: num('closing_hour', DEFAULT_CLOSE_HOUR),
    weekendOpenHour: num('weekend_opening_hour', DEFAULT_WEEKEND_OPEN_HOUR),
    weekendCloseHour: num('weekend_closing_hour', DEFAULT_WEEKEND_CLOSE_HOUR),
    closedDay: num('closed_day', CLOSED_DAY),
    bufferMin: num('buffer_minutes', DEFAULT_BUFFER_MIN),
  }
}

export function isClosedDay(date: Date, closedDay: number): boolean {
  return date.getDay() === closedDay
}

export function getOpenCloseHours(date: Date, cfg: ReturnType<typeof readScheduleConfig>) {
  const day = date.getDay()
  const isWeekend = day === 0 || day === 6
  return {
    openHour: isWeekend ? cfg.weekendOpenHour : cfg.openHour,
    closeHour: isWeekend ? cfg.weekendCloseHour : cfg.closeHour,
  }
}
