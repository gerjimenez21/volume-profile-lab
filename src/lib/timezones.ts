export interface TimeZoneOption {
  id: string
  label: string
  short: string
}

export const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires'

export const TIMEZONES: TimeZoneOption[] = [
  {
    id: 'America/Argentina/Buenos_Aires',
    label: 'Buenos Aires (ART)',
    short: 'ART',
  },
  { id: 'America/Sao_Paulo', label: 'São Paulo (BRT)', short: 'BRT' },
  { id: 'America/Santiago', label: 'Santiago (CLT)', short: 'CLT' },
  { id: 'America/New_York', label: 'Nueva York (ET)', short: 'ET' },
  { id: 'America/Chicago', label: 'Chicago (CT)', short: 'CT' },
  { id: 'America/Los_Angeles', label: 'Los Ángeles (PT)', short: 'PT' },
  { id: 'Europe/London', label: 'Londres (UK)', short: 'UK' },
  { id: 'Europe/Madrid', label: 'Madrid (CET)', short: 'CET' },
  { id: 'UTC', label: 'UTC', short: 'UTC' },
]

const KEY = 'vplab.timezone'

export function loadTimeZone(): string {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && TIMEZONES.some((z) => z.id === saved)) return saved
  } catch {
    /* ignore */
  }
  return DEFAULT_TIMEZONE
}

export function saveTimeZone(timeZone: string) {
  localStorage.setItem(KEY, timeZone)
}

export function getTimeZoneMeta(id: string): TimeZoneOption {
  return TIMEZONES.find((z) => z.id === id) ?? TIMEZONES[0]
}

/** Unix seconds → Date */
function toDate(time: number | { year: number; month: number; day: number }): Date {
  if (typeof time === 'number') return new Date(time * 1000)
  return new Date(Date.UTC(time.year, time.month - 1, time.day))
}

export function formatClock(timeZone: string, date = new Date()): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatCrosshairTime(
  time: number | { year: number; month: number; day: number },
  timeZone: string,
): string {
  const date = toDate(time)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** Tick labels for the time axis (Year / Month / Day / Time). */
export function formatTickMark(
  time: number | { year: number; month: number; day: number },
  tickMarkType: number,
  timeZone: string,
): string {
  const date = toDate(time)
  // TickMarkType: Year=0, Month=1, DayOfMonth=2, Time=3, TimeWithSeconds=4
  if (tickMarkType <= 0) {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone,
      year: 'numeric',
    }).format(date)
  }
  if (tickMarkType === 1) {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone,
      month: 'short',
    }).format(date)
  }
  if (tickMarkType === 2) {
    return new Intl.DateTimeFormat('es-AR', {
      timeZone,
      day: '2-digit',
      month: 'short',
    }).format(date)
  }
  return new Intl.DateTimeFormat('es-AR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}
