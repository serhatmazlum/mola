import type { Lang, Settings, Strictness, ThemeMode } from './types'

export const DEFAULT_SETTINGS: Settings = {
  lang: 'tr',
  theme: 'system',

  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,

  microBreaksEnabled: true,
  microBreakIntervalMinutes: 30,
  microBreakSeconds: 45,
  microBreakOnlyDuringFocus: false,

  eyeReminderEnabled: true,
  eyeReminderIntervalMinutes: 20,

  strictness: 'normal',
  postponeMinutes: 5,
  preBreakWarningSeconds: 30,
  idlePauseMinutes: 5,

  soundEnabled: true,
  volume: 0.6,
  notificationsEnabled: true,

  launchAtLogin: false,
  startMinimized: false,
  showTrayCountdown: true,
  globalShortcut: 'CommandOrControl+Shift+M'
}

interface NumRange {
  min: number
  max: number
}

/** Kullanici JSON'u elle duzenleyebilir; her sayisal alan icin guvenli araliklar. */
const RANGES: Record<string, NumRange> = {
  focusMinutes: { min: 1, max: 180 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 120 },
  cyclesBeforeLongBreak: { min: 1, max: 12 },
  microBreakIntervalMinutes: { min: 5, max: 180 },
  microBreakSeconds: { min: 10, max: 600 },
  eyeReminderIntervalMinutes: { min: 5, max: 120 },
  postponeMinutes: { min: 1, max: 30 },
  preBreakWarningSeconds: { min: 0, max: 300 },
  idlePauseMinutes: { min: 0, max: 60 },
  volume: { min: 0, max: 1 }
}

const LANGS: Lang[] = ['tr', 'en']
const THEMES: ThemeMode[] = ['system', 'light', 'dark']
const STRICTNESS: Strictness[] = ['relaxed', 'normal', 'strict']

function clamp(value: number, range: NumRange): number {
  if (!Number.isFinite(value)) return NaN
  return Math.min(range.max, Math.max(range.min, value))
}

/**
 * Diskten okunan ham nesneyi varsayilanlarla birlestirir ve dogrular.
 * Gecersiz her alan sessizce varsayilana doner; bozuk dosya uygulamayi kilitlemez.
 */
export function normalizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS }
  if (!raw || typeof raw !== 'object') return out
  const input = raw as Record<string, unknown>

  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = input[key]
    if (value === undefined || value === null) continue
    const fallback = DEFAULT_SETTINGS[key]

    if (typeof fallback === 'boolean') {
      if (typeof value === 'boolean') (out[key] as boolean) = value
      continue
    }

    if (typeof fallback === 'number') {
      const num = typeof value === 'number' ? value : Number(value)
      const range = RANGES[key]
      const next = range ? clamp(num, range) : num
      if (Number.isFinite(next)) {
        (out[key] as number) = key === 'volume' ? next : Math.round(next)
      }
      continue
    }

    if (typeof value !== 'string') continue
    if (key === 'lang') {
      if (LANGS.includes(value as Lang)) out.lang = value as Lang
    } else if (key === 'theme') {
      if (THEMES.includes(value as ThemeMode)) out.theme = value as ThemeMode
    } else if (key === 'strictness') {
      if (STRICTNESS.includes(value as Strictness)) out.strictness = value as Strictness
    } else if (key === 'globalShortcut') {
      out.globalShortcut = value.trim()
    }
  }

  return out
}
