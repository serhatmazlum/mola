import { ExerciseRotation } from '@shared/exercises'
import type {
  BreakKind,
  Command,
  Exercise,
  OverlayAction,
  OverlayPayload,
  Phase,
  Settings,
  SoundEvent,
  TimerState
} from '@shared/types'
import type { Store } from './store'

const TICK_MS = 500
/** Bu kadar uyku/gecikme sonrasi faz "kacirilmis" sayilir ve bastan kurulur. */
const STALE_AFTER_MS = 5 * 60_000
/** Pomodoro molasina bu kadar kalmissa mikro mola tetiklenmez, ikisi ust uste binmesin. */
const MERGE_WINDOW_MS = 2 * 60_000

export type NotificationKey = 'breakSoon' | 'breakStart' | 'focusStart' | 'idlePaused' | 'cycleDone' | 'eye'

export interface EngineHooks {
  onState(state: TimerState): void
  onOverlayOpen(payload: OverlayPayload): void
  onOverlayClose(): void
  onNotify(key: NotificationKey, vars: Record<string, string | number>): void
  onSound(event: SoundEvent): void
}

interface Suspended {
  phase: Phase
  totalMs: number
  remainingMs: number
  running: boolean
}

function isBreakPhase(phase: Phase): boolean {
  return phase === 'shortBreak' || phase === 'longBreak' || phase === 'micro'
}

function breakKindOf(phase: Phase): BreakKind | null {
  if (phase === 'micro') return 'micro'
  if (phase === 'shortBreak') return 'short'
  if (phase === 'longBreak') return 'long'
  return null
}

export class Engine {
  private phase: Phase = 'idle'
  private running = false
  private totalMs = 0
  private endsAt = 0
  private pausedRemaining = 0

  private cyclePosition = 0
  private pendingBreak: BreakKind | null = null
  private preWarned = false

  private microDueAt: number | null = null
  private eyeDueAt: number | null = null

  private overlayOpen = false
  private suspended: Suspended | null = null
  private currentExercise: Exercise | null = null
  private readonly rotation = new ExerciseRotation()

  private idleActive = false
  private idlePeakSeconds = 0

  private focusCarryMs = 0
  private lastTickAt = Date.now()
  private ticker: NodeJS.Timeout | null = null

  constructor(
    private readonly store: Store,
    private readonly hooks: EngineHooks
  ) {
    const settings = store.getSettings()
    this.totalMs = settings.focusMinutes * 60_000
    this.pausedRemaining = this.totalMs
  }

  // ---------------------------------------------------------------- lifecycle

  startTicking(): void {
    if (this.ticker) return
    this.lastTickAt = Date.now()
    this.ticker = setInterval(() => this.tick(), TICK_MS)
  }

  stopTicking(): void {
    if (!this.ticker) return
    clearInterval(this.ticker)
    this.ticker = null
  }

  // ----------------------------------------------------------------- commands

  execute(command: Command): void {
    switch (command.type) {
      case 'toggle':
        if (this.running) this.pause()
        else this.start()
        break
      case 'start':
        this.start()
        break
      case 'pause':
        this.pause()
        break
      case 'reset':
        this.reset()
        break
      case 'skipPhase':
        this.skipPhase()
        break
      case 'stretchNow':
        this.stretchNow()
        break
      case 'resetCycle':
        this.cyclePosition = 0
        break
    }
    this.broadcast()
  }

  start(): void {
    if (this.overlayOpen) return
    if (this.phase === 'idle') {
      this.beginPhase('focus', true)
      return
    }
    if (!this.running) this.resume()
  }

  pause(): void {
    if (!this.running || this.overlayOpen) return
    this.pausedRemaining = this.currentRemaining()
    this.running = false
  }

  reset(): void {
    if (this.overlayOpen) return
    const phase = this.phase === 'idle' ? 'focus' : this.phase
    this.pendingBreak = null
    this.beginPhase(phase, false)
  }

  /** Mevcut fazi krediye saymadan bitirir. */
  skipPhase(): void {
    if (this.phase === 'idle') return
    if (isBreakPhase(this.phase)) {
      this.skipBreak()
      return
    }
    this.finishFocus(false)
  }

  stretchNow(): void {
    if (this.overlayOpen) return
    this.triggerMicro(true)
  }

  // ---------------------------------------------------------- overlay actions

  overlayAction(action: OverlayAction): void {
    if (!isBreakPhase(this.phase)) return
    switch (action.type) {
      case 'finish':
        this.completePhase()
        break
      case 'skip':
        this.skipBreak()
        break
      case 'postpone':
        this.postponeBreak()
        break
      case 'shuffle': {
        const kind = breakKindOf(this.phase)
        if (!kind) return
        this.currentExercise = this.rotation.next(kind)
        this.hooks.onOverlayOpen(this.buildOverlayPayload(kind))
        return
      }
    }
    this.broadcast()
  }

  // -------------------------------------------------------------- system hooks

  /** index.ts saniyede bir powerMonitor.getSystemIdleTime() sonucunu iletir. */
  setIdle(idleSeconds: number): void {
    const settings = this.store.getSettings()
    const threshold = settings.idlePauseMinutes * 60

    if (idleSeconds > this.idlePeakSeconds) this.idlePeakSeconds = idleSeconds

    if (!this.idleActive) {
      if (threshold > 0 && idleSeconds >= threshold && this.running && this.phase === 'focus') {
        this.idleActive = true
        this.pause()
        this.hooks.onNotify('idlePaused', { n: settings.idlePauseMinutes })
        this.broadcast()
      }
      return
    }

    // Kullanici geri dondu.
    if (idleSeconds < 5) {
      const wasAwayFor = this.idlePeakSeconds
      this.idleActive = false
      this.idlePeakSeconds = 0
      // Masadan uzun sure kalkmak zaten bir esneme molasidir; sayaci sifirla.
      if (wasAwayFor >= 120) {
        this.microDueAt = Date.now() + settings.microBreakIntervalMinutes * 60_000
        this.eyeDueAt = Date.now() + settings.eyeReminderIntervalMinutes * 60_000
      }
      this.broadcast()
    }
  }

  /** Uyku/kapak sonrasi cok gecikmis fazlari sessizce toparlar. */
  handleWake(): void {
    const now = Date.now()
    if (this.running && this.endsAt < now - STALE_AFTER_MS) {
      this.running = false
      this.overlayOpen = false
      this.hooks.onOverlayClose()
      this.suspended = null
      this.pendingBreak = null
      this.beginPhase('focus', false)
    }
    const settings = this.store.getSettings()
    this.microDueAt = now + settings.microBreakIntervalMinutes * 60_000
    this.eyeDueAt = now + settings.eyeReminderIntervalMinutes * 60_000
    this.lastTickAt = now
    this.broadcast()
  }

  onSettingsChanged(prev: Settings, next: Settings): void {
    if (!this.running && !this.overlayOpen && this.phase !== 'idle') {
      const total = this.durationFor(this.phase, next)
      if (total !== this.totalMs) {
        this.totalMs = total
        this.pausedRemaining = total
      }
    }
    if (
      prev.microBreaksEnabled !== next.microBreaksEnabled ||
      prev.microBreakIntervalMinutes !== next.microBreakIntervalMinutes
    ) {
      this.microDueAt = null
    }
    if (
      prev.eyeReminderEnabled !== next.eyeReminderEnabled ||
      prev.eyeReminderIntervalMinutes !== next.eyeReminderIntervalMinutes
    ) {
      this.eyeDueAt = null
    }
    this.broadcast()
  }

  // --------------------------------------------------------------------- state

  getState(): TimerState {
    const now = Date.now()
    const settings = this.store.getSettings()
    const today = this.store.today()
    return {
      phase: this.phase,
      running: this.running,
      remainingMs: this.currentRemaining(),
      totalMs: this.totalMs,
      cyclePosition: this.cyclePosition,
      cyclesBeforeLongBreak: settings.cyclesBeforeLongBreak,
      todayPomodoros: today.pomodoros,
      todayFocusSeconds: today.focusSeconds,
      nextMicroMs:
        settings.microBreaksEnabled && this.microDueAt !== null
          ? Math.max(0, this.microDueAt - now)
          : null,
      nextEyeMs:
        settings.eyeReminderEnabled && this.eyeDueAt !== null
          ? Math.max(0, this.eyeDueAt - now)
          : null,
      overlayOpen: this.overlayOpen,
      idle: this.idleActive
    }
  }

  getOverlayPayload(): OverlayPayload | null {
    const kind = breakKindOf(this.phase)
    if (!kind) return null
    return this.buildOverlayPayload(kind)
  }

  // ------------------------------------------------------------------ internals

  private currentRemaining(): number {
    if (!this.running) return Math.max(0, this.pausedRemaining)
    return Math.max(0, this.endsAt - Date.now())
  }

  private durationFor(phase: Phase, settings: Settings): number {
    switch (phase) {
      case 'focus':
        return settings.focusMinutes * 60_000
      case 'shortBreak':
        return settings.shortBreakMinutes * 60_000
      case 'longBreak':
        return settings.longBreakMinutes * 60_000
      case 'micro':
        return settings.microBreakSeconds * 1_000
      default:
        return settings.focusMinutes * 60_000
    }
  }

  private beginPhase(phase: Phase, autorun: boolean, overrideMs?: number): void {
    const settings = this.store.getSettings()
    this.phase = phase
    this.totalMs = overrideMs ?? this.durationFor(phase, settings)
    this.pausedRemaining = this.totalMs
    this.running = false
    this.preWarned = false
    if (autorun) this.resume()
    else this.broadcast()
  }

  private resume(): void {
    const settings = this.store.getSettings()
    this.endsAt = Date.now() + this.pausedRemaining
    this.running = true

    const kind = breakKindOf(this.phase)
    if (kind) {
      this.currentExercise = this.rotation.next(kind)
      this.overlayOpen = true
      this.hooks.onOverlayOpen(this.buildOverlayPayload(kind))
      this.hooks.onNotify('breakStart', {})
    } else if (this.phase === 'focus') {
      if (this.microDueAt === null) {
        this.microDueAt = Date.now() + settings.microBreakIntervalMinutes * 60_000
      }
      if (this.eyeDueAt === null) {
        this.eyeDueAt = Date.now() + settings.eyeReminderIntervalMinutes * 60_000
      }
      this.hooks.onSound('focusStart')
    }
    this.broadcast()
  }

  private buildOverlayPayload(kind: BreakKind): OverlayPayload {
    const settings = this.store.getSettings()
    if (!this.currentExercise) this.currentExercise = this.rotation.next(kind)
    return {
      kind,
      durationMs: this.totalMs,
      exercise: this.currentExercise,
      strictness: settings.strictness,
      postponeMinutes: settings.postponeMinutes,
      lang: settings.lang,
      theme: settings.theme,
      todayPomodoros: this.store.today().pomodoros,
      nextPhase: this.suspended ? this.suspended.phase : 'focus',
      soundEnabled: settings.soundEnabled,
      volume: settings.volume
    }
  }

  private completePhase(): void {
    switch (this.phase) {
      case 'focus':
        this.finishFocus(true)
        break
      case 'shortBreak':
      case 'longBreak':
        this.endBreak(true)
        break
      case 'micro':
        this.endMicro(true)
        break
      default:
        break
    }
  }

  private finishFocus(credit: boolean): void {
    const settings = this.store.getSettings()

    // Ertelemeden gelen kisa odak: pomodoro sayilmaz, bekleyen molaya doner.
    if (this.pendingBreak) {
      const kind = this.pendingBreak
      this.pendingBreak = null
      this.beginPhase(kind === 'long' ? 'longBreak' : 'shortBreak', true)
      return
    }

    if (credit) {
      this.store.bump('pomodoros')
      this.cyclePosition += 1
    }

    let kind: BreakKind = 'short'
    if (this.cyclePosition >= settings.cyclesBeforeLongBreak) {
      kind = 'long'
      this.cyclePosition = 0
      this.hooks.onNotify('cycleDone', {})
    }
    this.beginPhase(kind === 'long' ? 'longBreak' : 'shortBreak', settings.autoStartBreaks)
  }

  private endBreak(natural: boolean): void {
    const settings = this.store.getSettings()
    this.overlayOpen = false
    this.currentExercise = null
    this.hooks.onOverlayClose()
    this.store.bump(natural ? 'breaksTaken' : 'breaksSkipped')
    if (natural) {
      this.store.bump('stretches')
      this.hooks.onSound('breakEnd')
    }
    // Mola zaten esneme sayilir; mikro sayaci bastan baslasin.
    this.microDueAt = Date.now() + settings.microBreakIntervalMinutes * 60_000
    this.eyeDueAt = Date.now() + settings.eyeReminderIntervalMinutes * 60_000
    this.beginPhase('focus', settings.autoStartFocus)
  }

  private endMicro(natural: boolean): void {
    const settings = this.store.getSettings()
    this.overlayOpen = false
    this.currentExercise = null
    this.hooks.onOverlayClose()
    this.store.bump(natural ? 'breaksTaken' : 'breaksSkipped')
    if (natural) {
      this.store.bump('stretches')
      this.hooks.onSound('breakEnd')
    }
    this.microDueAt = Date.now() + settings.microBreakIntervalMinutes * 60_000
    this.restoreSuspended()
  }

  private skipBreak(): void {
    if (this.phase === 'micro') this.endMicro(false)
    else if (isBreakPhase(this.phase)) this.endBreak(false)
  }

  private postponeBreak(): void {
    const settings = this.store.getSettings()
    const snoozeMs = settings.postponeMinutes * 60_000

    if (this.phase === 'micro') {
      this.overlayOpen = false
      this.currentExercise = null
      this.hooks.onOverlayClose()
      this.microDueAt = Date.now() + snoozeMs
      this.restoreSuspended()
      return
    }

    const kind = breakKindOf(this.phase)
    if (!kind || kind === 'micro') return
    this.overlayOpen = false
    this.currentExercise = null
    this.hooks.onOverlayClose()
    this.pendingBreak = kind
    this.beginPhase('focus', true, snoozeMs)
  }

  private restoreSuspended(): void {
    const suspended = this.suspended
    this.suspended = null
    if (!suspended) {
      // Pomodoro calismiyorken tetiklenen esneme molasi: bosta duruma don.
      this.phase = 'idle'
      this.running = false
      this.totalMs = this.durationFor('focus', this.store.getSettings())
      this.pausedRemaining = this.totalMs
      this.broadcast()
      return
    }
    this.phase = suspended.phase
    this.totalMs = suspended.totalMs
    this.pausedRemaining = suspended.remainingMs
    this.running = suspended.running
    if (this.running) this.endsAt = Date.now() + this.pausedRemaining
    this.broadcast()
  }

  private triggerMicro(forced: boolean): void {
    const settings = this.store.getSettings()
    if (!forced && !settings.microBreaksEnabled) return

    this.suspended = {
      phase: this.phase,
      totalMs: this.totalMs,
      remainingMs: this.currentRemaining(),
      running: this.running
    }

    this.phase = 'micro'
    this.totalMs = settings.microBreakSeconds * 1_000
    this.pausedRemaining = this.totalMs
    this.endsAt = Date.now() + this.totalMs
    this.running = true
    this.overlayOpen = true
    this.currentExercise = this.rotation.next('micro')
    this.hooks.onOverlayOpen(this.buildOverlayPayload('micro'))
    this.broadcast()
  }

  // ----------------------------------------------------------------- the tick

  private tick(): void {
    const now = Date.now()
    const elapsed = Math.max(0, now - this.lastTickAt)
    this.lastTickAt = now
    const settings = this.store.getSettings()

    if (this.running && this.phase === 'focus') {
      this.focusCarryMs += Math.min(elapsed, TICK_MS * 4)
      if (this.focusCarryMs >= 1000) {
        const whole = Math.floor(this.focusCarryMs / 1000)
        this.focusCarryMs -= whole * 1000
        this.store.bump('focusSeconds', whole)
      }
    }

    if (this.running) {
      const remaining = this.endsAt - now
      if (
        this.phase === 'focus' &&
        !this.preWarned &&
        settings.preBreakWarningSeconds > 0 &&
        remaining > 0 &&
        remaining <= settings.preBreakWarningSeconds * 1_000
      ) {
        this.preWarned = true
        this.hooks.onNotify('breakSoon', { n: Math.round(remaining / 1000) })
        this.hooks.onSound('warn')
      }
      if (remaining <= 0) {
        this.completePhase()
        this.broadcast()
        return
      }
    }

    if (!this.overlayOpen) {
      this.evaluateMicro(now, settings)
      this.evaluateEye(now, settings)
    }

    this.broadcast()
  }

  private evaluateMicro(now: number, settings: Settings): void {
    if (!settings.microBreaksEnabled) {
      this.microDueAt = null
      return
    }
    const intervalMs = settings.microBreakIntervalMinutes * 60_000
    if (this.microDueAt === null) {
      this.microDueAt = now + intervalMs
      return
    }

    const focusing = this.phase === 'focus' && this.running
    const eligible = this.idleActive ? false : settings.microBreakOnlyDuringFocus ? focusing : true
    if (!eligible) {
      // Sayac sadece uygun zamanda islesin; aksi halde donunce hemen patlar.
      this.microDueAt = now + intervalMs
      return
    }

    if (now < this.microDueAt) return

    // Pomodoro molasi cok yakinsa mikro molayi ona birak.
    if (focusing && this.endsAt - now < MERGE_WINDOW_MS) {
      this.microDueAt = now + MERGE_WINDOW_MS
      return
    }

    this.triggerMicro(false)
  }

  private evaluateEye(now: number, settings: Settings): void {
    if (!settings.eyeReminderEnabled) {
      this.eyeDueAt = null
      return
    }
    const intervalMs = settings.eyeReminderIntervalMinutes * 60_000
    if (this.eyeDueAt === null) {
      this.eyeDueAt = now + intervalMs
      return
    }
    if (this.phase !== 'focus' || !this.running || this.idleActive) {
      this.eyeDueAt = now + intervalMs
      return
    }
    if (now < this.eyeDueAt) return

    const breakSoon = this.endsAt - now < 90_000
    const microSoon = this.microDueAt !== null && this.microDueAt - now < 90_000
    if (breakSoon || microSoon) {
      this.eyeDueAt = now + 90_000
      return
    }

    this.eyeDueAt = now + intervalMs
    this.hooks.onNotify('eye', {})
  }

  private broadcast(): void {
    this.hooks.onState(this.getState())
  }
}
