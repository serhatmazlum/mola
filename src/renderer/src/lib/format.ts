import type { Lang } from '@shared/types'

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0')
}

/** mm:ss veya s:mm:ss. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** "1sa 15dk" / "1h 15m" — sifirsa "0dk". */
export function humanDuration(seconds: number, lang: Lang): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const hu = lang === 'en' ? 'h' : 'sa'
  const mu = lang === 'en' ? 'm' : 'dk'
  if (h > 0) return m > 0 ? `${h}${hu} ${m}${mu}` : `${h}${hu}`
  return `${m}${mu}`
}

export function minutesLabel(value: number, lang: Lang): string {
  return `${value} ${lang === 'en' ? 'min' : 'dk'}`
}

export function secondsLabel(value: number, lang: Lang): string {
  return `${value} ${lang === 'en' ? 's' : 'sn'}`
}

export function dayNumber(isoDate: string): string {
  return String(Number(isoDate.slice(8, 10)))
}

export function isToday(isoDate: string): boolean {
  const now = new Date()
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return key === isoDate
}

/** Bugunden geriye n gunluk kesintisiz dizi (eksik gunler 0 olarak doldurulur). */
export function lastDays<T extends { date: string }>(
  entries: T[],
  count: number,
  fill: (date: string) => T
): T[] {
  const byDate = new Map(entries.map((e) => [e.date, e]))
  const out: T[] = []
  const cursor = new Date()
  cursor.setDate(cursor.getDate() - (count - 1))
  for (let i = 0; i < count; i++) {
    const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`
    out.push(byDate.get(key) ?? fill(key))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
