import type { ReactNode } from 'react'
import type { Strings } from '@shared/i18n'
import { fmt } from '@shared/i18n'
import type { Settings, TimerState } from '@shared/types'
import { clock, humanDuration } from '@/lib/format'
import { Ring } from './Ring'

function IconReset(): ReactNode {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 5v4.2h4.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSkip(): ReactNode {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.5 5.5v13l9-6.5-9-6.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M18 5.5v13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function IconStretch(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="4.6" r="2.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4 10h16M12 8v6m0 0-3.5 6M12 14l3.5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconEye(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function FocusView({
  state,
  settings,
  strings,
  onCommand
}: {
  state: TimerState
  settings: Settings
  strings: Strings
  onCommand: (type: 'toggle' | 'reset' | 'skipPhase' | 'stretchNow') => void
}): ReactNode {
  const progress = state.totalMs > 0 ? state.remainingMs / state.totalMs : 0
  const busy = state.overlayOpen
  const timeText = clock(state.remainingMs)

  const primaryLabel =
    state.running
      ? strings.action.pause
      : state.phase === 'idle'
        ? strings.action.start
        : strings.action.resume

  const dots = Array.from({ length: state.cyclesBeforeLongBreak }, (_, i) => i < state.cyclePosition)

  return (
    <div className="focus">
      <Ring progress={progress}>
        <div className={timeText.length > 5 ? 'clock is-small' : 'clock'}>{timeText}</div>
        <div className="phase-label">{strings.phase[state.phase]}</div>
      </Ring>

      <div className="cycle-dots" aria-label={fmt(strings.focusView.sessionOf, {
        done: state.cyclePosition,
        total: state.cyclesBeforeLongBreak
      })}>
        {dots.map((on, index) => (
          <i key={index} className={on ? 'on' : undefined} />
        ))}
      </div>

      <div className="controls">
        <button
          type="button"
          className="btn-ghost"
          aria-label={strings.action.reset}
          title={strings.action.reset}
          disabled={busy || state.phase === 'idle'}
          onClick={() => onCommand('reset')}
        >
          <IconReset />
        </button>

        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => onCommand('toggle')}
        >
          {primaryLabel}
        </button>

        <button
          type="button"
          className="btn-ghost"
          aria-label={strings.action.skip}
          title={strings.action.skip}
          disabled={busy || state.phase === 'idle'}
          onClick={() => onCommand('skipPhase')}
        >
          <IconSkip />
        </button>
      </div>

      {state.idle ? <div className="notice">{strings.focusView.idleNotice}</div> : null}

      <div className="chips">
        <button
          type="button"
          className="chip is-button"
          disabled={busy}
          onClick={() => onCommand('stretchNow')}
          title={strings.action.stretchNow}
        >
          <IconStretch />
          {state.nextMicroMs === null ? (
            <span>{strings.focusView.stretchOff}</span>
          ) : (
            <>
              <span>{strings.focusView.nextStretch}</span>
              <b>{clock(state.nextMicroMs)}</b>
            </>
          )}
        </button>

        {state.nextEyeMs !== null ? (
          <div className="chip">
            <IconEye />
            <span>{strings.focusView.nextEye}</span>
            <b>{clock(state.nextEyeMs)}</b>
          </div>
        ) : null}
      </div>

      <div className="today-line">
        {strings.stats.today} <b>{state.todayPomodoros}</b>{' '}
        {strings.stats.pomodoros.toLowerCase()} {' · '}
        <b>{humanDuration(state.todayFocusSeconds, settings.lang)}</b>{' '}
        {strings.focusView.todayFocus}
      </div>
    </div>
  )
}
