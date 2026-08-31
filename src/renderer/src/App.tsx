import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '@shared/i18n'
import type { AppInfo } from '@shared/api'
import type { Settings, Stats, TimerState } from '@shared/types'
import { FocusView } from './components/FocusView'
import { SettingsView } from './components/SettingsView'
import { StatsView } from './components/StatsView'
import { playSound } from './lib/sound'

type View = 'focus' | 'stats' | 'settings'

export default function App(): ReactNode {
  const [state, setState] = useState<TimerState | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [view, setView] = useState<View>('focus')
  const [shortcutError, setShortcutError] = useState(false)

  const volumeRef = useRef(0.6)
  volumeRef.current = settings?.volume ?? 0.6

  useEffect(() => {
    void window.mola.getState().then(setState)
    void window.mola.getSettings().then(setSettings)
    void window.mola.getInfo().then((next) => {
      setInfo(next)
      document.body.dataset.platform = String(next.platform)
    })

    const offState = window.mola.onState(setState)
    const offSettings = window.mola.onSettings(setSettings)
    const offNavigate = window.mola.onNavigate((next) => setView(next as View))
    const offSound = window.mola.onSound((event) => playSound(event, volumeRef.current))
    return () => {
      offState()
      offSettings()
      offNavigate()
      offSound()
    }
  }, [])

  // Istatistikler yalnizca ilgili sekme acikken tazelenir.
  useEffect(() => {
    if (view !== 'stats') return
    const load = (): void => {
      void window.mola.getStats().then(setStats)
    }
    load()
    const id = window.setInterval(load, 30_000)
    return () => window.clearInterval(id)
  }, [view, state?.todayPomodoros])

  // Boslukla baslat/duraklat — yazi alanindayken devre disi.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.isContentEditable)) return
      if (event.code !== 'Space' || event.metaKey || event.ctrlKey || event.altKey) return
      event.preventDefault()
      window.mola.command({ type: 'toggle' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const patch = useCallback((next: Partial<Settings>): void => {
    void window.mola.setSettings(next).then((result) => {
      setSettings(result.settings)
      setShortcutError(!result.shortcutOk)
    })
  }, [])

  const reset = useCallback((): void => {
    void window.mola.resetSettings().then((next) => {
      setSettings(next)
      setShortcutError(false)
    })
  }, [])

  if (!state || !settings) {
    return <div className="app" data-phase="idle" />
  }

  const strings = t(settings.lang)

  return (
    <div className="app" data-phase={state.phase}>
      <header className="titlebar">
        <span className="brand">{strings.appName}</span>
        <span className={state.running ? 'phase-pill is-running' : 'phase-pill'}>
          <i className="dot" />
          {strings.phase[state.phase]}
        </span>
      </header>

      <main className="view">
        {view === 'focus' ? (
          <FocusView
            state={state}
            settings={settings}
            strings={strings}
            onCommand={(type) => window.mola.command({ type })}
          />
        ) : null}
        {view === 'stats' ? (
          <StatsView stats={stats} settings={settings} strings={strings} />
        ) : null}
        {view === 'settings' ? (
          <SettingsView
            settings={settings}
            strings={strings}
            info={info}
            shortcutError={shortcutError}
            onPatch={patch}
            onReset={reset}
            onOpenDataFolder={() => window.mola.openDataFolder()}
          />
        ) : null}
      </main>

      <nav className="tabbar">
        {(
          [
            ['focus', strings.nav.focus],
            ['stats', strings.nav.stats],
            ['settings', strings.nav.settings]
          ] as [View, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'tab is-active' : 'tab'}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
