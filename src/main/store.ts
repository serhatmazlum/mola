import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_SETTINGS, normalizeSettings } from '@shared/defaults'
import type { DayStat, Settings, Stats } from '@shared/types'

const KEEP_DAYS = 120

function localDateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function emptyDay(date: string): DayStat {
  return { date, pomodoros: 0, focusSeconds: 0, breaksTaken: 0, breaksSkipped: 0, stretches: 0 }
}

/** Yarim yazilmis dosya birakmamak icin once .tmp yaz, sonra rename et. */
function writeAtomic(file: string, data: string): void {
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, data, 'utf8')
  fs.renameSync(tmp, file)
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

export class Store {
  readonly dir: string
  private readonly settingsFile: string
  private readonly statsFile: string

  private settings: Settings
  private days: DayStat[]
  private flushTimer: NodeJS.Timeout | null = null
  private dirty = { settings: false, stats: false }

  constructor() {
    this.dir = app.getPath('userData')
    fs.mkdirSync(this.dir, { recursive: true })
    this.settingsFile = path.join(this.dir, 'settings.json')
    this.statsFile = path.join(this.dir, 'stats.json')

    this.settings = normalizeSettings(readJson(this.settingsFile))

    const rawStats = readJson(this.statsFile)
    const rawDays = rawStats && typeof rawStats === 'object' ? (rawStats as { days?: unknown }).days : null
    this.days = Array.isArray(rawDays)
      ? rawDays.map(toDayStat).filter((d): d is DayStat => d !== null)
      : []
    this.days.sort((a, b) => a.date.localeCompare(b.date))
    this.trim()
  }

  getSettings(): Settings {
    return { ...this.settings }
  }

  updateSettings(patch: Partial<Settings>): Settings {
    this.settings = normalizeSettings({ ...this.settings, ...patch })
    this.dirty.settings = true
    this.scheduleFlush()
    return this.getSettings()
  }

  resetSettings(): Settings {
    this.settings = { ...DEFAULT_SETTINGS }
    this.dirty.settings = true
    this.scheduleFlush()
    return this.getSettings()
  }

  today(): DayStat {
    const key = localDateKey()
    let entry = this.days.find((d) => d.date === key)
    if (!entry) {
      entry = emptyDay(key)
      this.days.push(entry)
      this.trim()
    }
    return entry
  }

  bump(field: keyof Omit<DayStat, 'date'>, amount = 1): void {
    const day = this.today()
    day[field] += amount
    this.dirty.stats = true
    this.scheduleFlush()
  }

  getStats(): Stats {
    return { days: this.days.map((d) => ({ ...d })), streak: this.computeStreak() }
  }

  /**
   * Bugun henuz pomodoro yoksa seri dunden geriye sayilir; boylece gun
   * bitmeden seri kirilmis gibi gorunmez.
   */
  private computeStreak(): number {
    const byDate = new Map(this.days.map((d) => [d.date, d]))
    const cursor = new Date()
    const todayKey = localDateKey(cursor)
    if ((byDate.get(todayKey)?.pomodoros ?? 0) === 0) {
      cursor.setDate(cursor.getDate() - 1)
    }
    let streak = 0
    for (;;) {
      const key = localDateKey(cursor)
      if ((byDate.get(key)?.pomodoros ?? 0) === 0) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  private trim(): void {
    this.days.sort((a, b) => a.date.localeCompare(b.date))
    if (this.days.length > KEEP_DAYS) {
      this.days = this.days.slice(this.days.length - KEEP_DAYS)
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      this.flush()
    }, 1000)
  }

  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    try {
      if (this.dirty.settings) {
        writeAtomic(this.settingsFile, JSON.stringify(this.settings, null, 2))
        this.dirty.settings = false
      }
      if (this.dirty.stats) {
        writeAtomic(this.statsFile, JSON.stringify({ days: this.days }, null, 2))
        this.dirty.stats = false
      }
    } catch (error) {
      console.error('[store] yazma hatasi:', error)
    }
  }
}

/** Eksik/bozuk alanlari 0'a cekerek eski surumlerin dosyasini da okuyabilir. */
function toDayStat(value: unknown): DayStat | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (typeof v.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return null
  const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : 0)
  return {
    date: v.date,
    pomodoros: num(v.pomodoros),
    focusSeconds: num(v.focusSeconds),
    breaksTaken: num(v.breaksTaken),
    breaksSkipped: num(v.breaksSkipped),
    stretches: num(v.stretches)
  }
}
