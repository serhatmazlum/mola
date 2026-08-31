import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { fmt, t } from '@shared/i18n'
import type { OverlayPayload, TimerState } from '@shared/types'
import { clock, secondsLabel } from './lib/format'
import { playSound } from './lib/sound'

const RING = 200
const STROKE = 6
const RADIUS = (RING - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const HOLD_MS = 3000

const IS_PRIMARY = new URLSearchParams(window.location.search).get('primary') === '1'

export default function OverlayApp(): ReactNode {
  const [payload, setPayload] = useState<OverlayPayload | null>(null)
  const [state, setState] = useState<TimerState | null>(null)
  const [hold, setHold] = useState(0)

  const chimed = useRef(false)
  const holdTimer = useRef<number | null>(null)
  const holdStart = useRef(0)
  const volumeRef = useRef(0.6)

  useEffect(() => {
    void window.mola.getOverlayPayload().then((next) => {
      if (next) setPayload(next)
    })
    void window.mola.getState().then(setState)
    const offPayload = window.mola.onOverlayPayload(setPayload)
    const offState = window.mola.onState(setState)
    const offSound = window.mola.onSound((event) => {
      if (IS_PRIMARY) playSound(event, volumeRef.current)
    })
    return () => {
      offPayload()
      offState()
      offSound()
    }
  }, [])

  volumeRef.current = payload?.volume ?? 0.6

  // Mola acilis sesi: pencere hazir olmadan calarsa kaybolur, o yuzden burada.
  useEffect(() => {
    if (!payload || chimed.current || !IS_PRIMARY) return
    chimed.current = true
    if (payload.soundEnabled) playSound('breakStart', payload.volume)
  }, [payload])

  const stopHold = useCallback(() => {
    if (holdTimer.current !== null) window.clearInterval(holdTimer.current)
    holdTimer.current = null
    setHold(0)
  }, [])

  useEffect(() => stopHold, [stopHold])

  const startHold = useCallback(() => {
    if (holdTimer.current !== null) return
    holdStart.current = Date.now()
    holdTimer.current = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - holdStart.current) / HOLD_MS)
      setHold(progress)
      if (progress >= 1) {
        stopHold()
        window.mola.overlayAction({ type: 'skip' })
      }
    }, 40)
  }, [stopHold])

  if (!payload) return <div className="overlay" data-phase="micro" />

  const strings = t(payload.lang)
  const text = payload.exercise[payload.lang]
  const total = state?.totalMs && state.totalMs > 0 ? state.totalMs : payload.durationMs
  const remaining = state?.remainingMs ?? payload.durationMs
  const progress = Math.min(1, Math.max(0, remaining / total))

  const phaseAttr =
    payload.kind === 'micro' ? 'micro' : payload.kind === 'long' ? 'longBreak' : 'shortBreak'
  const title = strings.overlay[payload.kind]
  const subtitle =
    payload.kind === 'micro'
      ? strings.overlay.subtitleMicro
      : payload.kind === 'long'
        ? strings.overlay.subtitleLong
        : strings.overlay.subtitleShort

  const canSkip = payload.strictness === 'relaxed'
  const canPostpone = payload.strictness !== 'strict'
  const mustHold = payload.strictness === 'strict'

  return (
    <div className="overlay" data-phase={phaseAttr} onContextMenu={(e) => e.preventDefault()}>
      <div>
        <div className="overlay-kicker">
          {fmt(strings.overlay.todayCount, { n: payload.todayPomodoros })}
        </div>
        <h1 className="overlay-title">{title}</h1>
        <p className="overlay-sub">{subtitle}</p>
      </div>

      <div className="overlay-ring">
        <svg viewBox={`0 0 ${RING} ${RING}`} aria-hidden="true">
          <circle className="track" cx={RING / 2} cy={RING / 2} r={RADIUS} />
          <circle
            className="progress"
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="overlay-clock">{clock(remaining)}</div>
      </div>

      <div className="overlay-exercise">
        <div className="head">
          <div className="emoji">{payload.exercise.emoji}</div>
          <div>
            <div className="name">{text.name}</div>
            <div className="meta">~{secondsLabel(payload.exercise.seconds, payload.lang)}</div>
          </div>
        </div>
        <ol>
          {text.steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="overlay-actions">
        <button
          type="button"
          className="overlay-btn"
          onClick={() => window.mola.overlayAction({ type: 'shuffle' })}
        >
          {strings.overlay.shuffle}
        </button>

        {canPostpone ? (
          <button
            type="button"
            className="overlay-btn"
            onClick={() => window.mola.overlayAction({ type: 'postpone' })}
          >
            {fmt(strings.overlay.postpone, { n: payload.postponeMinutes })}
          </button>
        ) : null}

        {canSkip ? (
          <button
            type="button"
            className="overlay-btn"
            onClick={() => window.mola.overlayAction({ type: 'skip' })}
          >
            {strings.overlay.skip}
          </button>
        ) : null}

        {mustHold ? (
          <button
            type="button"
            className="overlay-btn hold-btn"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onPointerCancel={stopHold}
          >
            <span className="fill" style={{ transform: `scaleX(${hold})` }} />
            <span className="txt">
              {hold > 0 ? strings.overlay.releaseToCancel : strings.overlay.holdToSkip}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
