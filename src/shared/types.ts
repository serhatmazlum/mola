export type Lang = 'tr' | 'en'
export type ThemeMode = 'system' | 'light' | 'dark'
export type Strictness = 'relaxed' | 'normal' | 'strict'

/** Pomodoro durum makinesinin ana fazlari. `micro` bagimsiz esneme molasidir. */
export type Phase = 'idle' | 'focus' | 'shortBreak' | 'longBreak' | 'micro'

/** Overlay penceresinde gosterilen mola turu. */
export type BreakKind = 'micro' | 'short' | 'long'

export type ExerciseCategory =
  | 'neck'
  | 'shoulder'
  | 'back'
  | 'wrist'
  | 'legs'
  | 'eyes'
  | 'breath'
  | 'posture'

export interface ExerciseText {
  name: string
  steps: string[]
}

export interface Exercise {
  id: string
  emoji: string
  category: ExerciseCategory
  /** Onerilen sure (saniye). Mola suresinden bagimsiz, sadece rehber. */
  seconds: number
  /** true ise ayaga kalkmayi gerektirir; mikro molalarda oncelik alir. */
  standing: boolean
  tr: ExerciseText
  en: ExerciseText
}

export interface Settings {
  lang: Lang
  theme: ThemeMode

  // --- Pomodoro dongusu ---
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartFocus: boolean

  // --- Mikro esneme molalari (bagimsiz zamanlayici) ---
  microBreaksEnabled: boolean
  microBreakIntervalMinutes: number
  microBreakSeconds: number
  /** false ise pomodoro kapaliyken bile esneme hatirlaticisi calisir. */
  microBreakOnlyDuringFocus: boolean

  // --- 20-20-20 goz kurali ---
  eyeReminderEnabled: boolean
  eyeReminderIntervalMinutes: number

  // --- Davranis ---
  strictness: Strictness
  postponeMinutes: number
  preBreakWarningSeconds: number
  /** Bu kadar dakika hareketsizlik odak seansini otomatik duraklatir. 0 = kapali. */
  idlePauseMinutes: number

  soundEnabled: boolean
  volume: number
  notificationsEnabled: boolean

  launchAtLogin: boolean
  startMinimized: boolean
  showTrayCountdown: boolean
  globalShortcut: string
}

export interface TimerState {
  phase: Phase
  running: boolean
  remainingMs: number
  totalMs: number
  /** Uzun molaya kadar tamamlanan odak seansi sayisi. */
  cyclePosition: number
  cyclesBeforeLongBreak: number
  todayPomodoros: number
  todayFocusSeconds: number
  /** Sonraki esneme molasina kalan sure; kapaliysa null. */
  nextMicroMs: number | null
  nextEyeMs: number | null
  overlayOpen: boolean
  idle: boolean
}

export interface OverlayPayload {
  kind: BreakKind
  durationMs: number
  exercise: Exercise
  strictness: Strictness
  postponeMinutes: number
  lang: Lang
  theme: ThemeMode
  todayPomodoros: number
  /** Mola bitince baslayacak fazin etiketi icin ipucu. */
  nextPhase: Phase
  soundEnabled: boolean
  volume: number
}

export interface DayStat {
  date: string
  pomodoros: number
  focusSeconds: number
  breaksTaken: number
  breaksSkipped: number
  stretches: number
}

export interface Stats {
  days: DayStat[]
  streak: number
}

export type Command =
  | { type: 'toggle' }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'skipPhase' }
  | { type: 'stretchNow' }
  | { type: 'resetCycle' }

export type OverlayAction =
  | { type: 'finish' }
  | { type: 'skip' }
  | { type: 'postpone' }
  | { type: 'shuffle' }

export type SoundEvent = 'focusStart' | 'breakStart' | 'breakEnd' | 'warn'

export interface WindowControlAction {
  type: 'minimize' | 'hide' | 'close'
}
