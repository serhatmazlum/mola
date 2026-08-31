import { useState, type ReactNode } from 'react'
import type { Strings } from '@shared/i18n'
import { fmt } from '@shared/i18n'
import type { Lang, Settings, Strictness, ThemeMode } from '@shared/types'
import type { AppInfo } from '@shared/api'
import { minutesLabel, secondsLabel } from '@/lib/format'
import { accelFromKeyboardEvent, prettyAccelerator } from '@/lib/shortcut'
import { Row, Segmented, Stepper, Switch } from './fields'

export function SettingsView({
  settings,
  strings,
  info,
  shortcutError,
  onPatch,
  onReset,
  onOpenDataFolder
}: {
  settings: Settings
  strings: Strings
  info: AppInfo | null
  shortcutError: boolean
  onPatch: (patch: Partial<Settings>) => void
  onReset: () => void
  onOpenDataFolder: () => void
}): ReactNode {
  const [recording, setRecording] = useState(false)
  const s = strings.settings
  const lang = settings.lang
  const platform = info?.platform ?? 'darwin'

  const strictnessHint =
    settings.strictness === 'relaxed'
      ? s.strictnessRelaxed
      : settings.strictness === 'strict'
        ? s.strictnessStrict
        : s.strictnessNormal

  return (
    <div>
      <div className="section-title">{s.groupTimer}</div>
      <div className="group">
        <Row label={s.focusMinutes}>
          <Stepper
            value={settings.focusMinutes}
            min={5}
            max={120}
            step={5}
            format={(v) => minutesLabel(v, lang)}
            onChange={(focusMinutes) => onPatch({ focusMinutes })}
          />
        </Row>
        <Row label={s.shortBreakMinutes}>
          <Stepper
            value={settings.shortBreakMinutes}
            min={1}
            max={30}
            format={(v) => minutesLabel(v, lang)}
            onChange={(shortBreakMinutes) => onPatch({ shortBreakMinutes })}
          />
        </Row>
        <Row label={s.longBreakMinutes}>
          <Stepper
            value={settings.longBreakMinutes}
            min={5}
            max={60}
            step={5}
            format={(v) => minutesLabel(v, lang)}
            onChange={(longBreakMinutes) => onPatch({ longBreakMinutes })}
          />
        </Row>
        <Row label={s.cyclesBeforeLongBreak}>
          <Stepper
            value={settings.cyclesBeforeLongBreak}
            min={2}
            max={8}
            format={(v) => String(v)}
            onChange={(cyclesBeforeLongBreak) => onPatch({ cyclesBeforeLongBreak })}
          />
        </Row>
      </div>

      <div className="section-title">{s.groupStretch}</div>
      <div className="group">
        <Row label={s.microBreaksEnabled}>
          <Switch
            label={s.microBreaksEnabled}
            checked={settings.microBreaksEnabled}
            onChange={(microBreaksEnabled) => onPatch({ microBreaksEnabled })}
          />
        </Row>
        <Row label={s.microBreakIntervalMinutes}>
          <Stepper
            value={settings.microBreakIntervalMinutes}
            min={10}
            max={120}
            step={5}
            format={(v) => minutesLabel(v, lang)}
            onChange={(microBreakIntervalMinutes) => onPatch({ microBreakIntervalMinutes })}
          />
        </Row>
        <Row label={s.microBreakSeconds}>
          <Stepper
            value={settings.microBreakSeconds}
            min={15}
            max={300}
            step={15}
            format={(v) => secondsLabel(v, lang)}
            onChange={(microBreakSeconds) => onPatch({ microBreakSeconds })}
          />
        </Row>
        <Row label={s.microBreakOnlyDuringFocus} hint={s.microBreakHint}>
          <Switch
            label={s.microBreakOnlyDuringFocus}
            checked={settings.microBreakOnlyDuringFocus}
            onChange={(microBreakOnlyDuringFocus) => onPatch({ microBreakOnlyDuringFocus })}
          />
        </Row>
        <Row
          label={s.eyeReminderEnabled}
          hint={fmt(s.eyeHint, { n: settings.eyeReminderIntervalMinutes })}
        >
          <Switch
            label={s.eyeReminderEnabled}
            checked={settings.eyeReminderEnabled}
            onChange={(eyeReminderEnabled) => onPatch({ eyeReminderEnabled })}
          />
        </Row>
        <Row label={s.eyeReminderIntervalMinutes}>
          <Stepper
            value={settings.eyeReminderIntervalMinutes}
            min={10}
            max={60}
            step={5}
            format={(v) => minutesLabel(v, lang)}
            onChange={(eyeReminderIntervalMinutes) => onPatch({ eyeReminderIntervalMinutes })}
          />
        </Row>
      </div>

      <div className="section-title">{s.groupBehaviour}</div>
      <div className="group">
        <Row label={s.autoStartBreaks}>
          <Switch
            label={s.autoStartBreaks}
            checked={settings.autoStartBreaks}
            onChange={(autoStartBreaks) => onPatch({ autoStartBreaks })}
          />
        </Row>
        <Row label={s.autoStartFocus}>
          <Switch
            label={s.autoStartFocus}
            checked={settings.autoStartFocus}
            onChange={(autoStartFocus) => onPatch({ autoStartFocus })}
          />
        </Row>
        <Row label={s.strictness} hint={strictnessHint} stacked>
          <Segmented<Strictness>
            value={settings.strictness}
            options={[
              { value: 'relaxed', label: s.strictnessShort.relaxed },
              { value: 'normal', label: s.strictnessShort.normal },
              { value: 'strict', label: s.strictnessShort.strict }
            ]}
            onChange={(strictness) => onPatch({ strictness })}
          />
        </Row>
        <Row label={s.postponeMinutes}>
          <Stepper
            value={settings.postponeMinutes}
            min={1}
            max={15}
            format={(v) => minutesLabel(v, lang)}
            onChange={(postponeMinutes) => onPatch({ postponeMinutes })}
          />
        </Row>
        <Row label={s.preBreakWarningSeconds}>
          <Stepper
            value={settings.preBreakWarningSeconds}
            min={0}
            max={120}
            step={15}
            format={(v) => (v === 0 ? '—' : secondsLabel(v, lang))}
            onChange={(preBreakWarningSeconds) => onPatch({ preBreakWarningSeconds })}
          />
        </Row>
        <Row label={s.idlePauseMinutes} hint={s.idleHint}>
          <Stepper
            value={settings.idlePauseMinutes}
            min={0}
            max={30}
            format={(v) => (v === 0 ? '—' : minutesLabel(v, lang))}
            onChange={(idlePauseMinutes) => onPatch({ idlePauseMinutes })}
          />
        </Row>
      </div>

      <div className="section-title">{s.groupSystem}</div>
      <div className="group">
        <Row label={s.soundEnabled}>
          <Switch
            label={s.soundEnabled}
            checked={settings.soundEnabled}
            onChange={(soundEnabled) => onPatch({ soundEnabled })}
          />
        </Row>
        <Row label={s.volume}>
          <input
            className="slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            disabled={!settings.soundEnabled}
            onChange={(event) => onPatch({ volume: Number(event.target.value) })}
          />
        </Row>
        <Row label={s.notificationsEnabled}>
          <Switch
            label={s.notificationsEnabled}
            checked={settings.notificationsEnabled}
            onChange={(notificationsEnabled) => onPatch({ notificationsEnabled })}
          />
        </Row>
        <Row label={s.showTrayCountdown}>
          <Switch
            label={s.showTrayCountdown}
            checked={settings.showTrayCountdown}
            onChange={(showTrayCountdown) => onPatch({ showTrayCountdown })}
          />
        </Row>
        <Row label={s.launchAtLogin}>
          <Switch
            label={s.launchAtLogin}
            checked={settings.launchAtLogin}
            onChange={(launchAtLogin) => onPatch({ launchAtLogin })}
          />
        </Row>
        <Row label={s.startMinimized}>
          <Switch
            label={s.startMinimized}
            checked={settings.startMinimized}
            onChange={(startMinimized) => onPatch({ startMinimized })}
          />
        </Row>
        <Row label={s.globalShortcut} hint={shortcutError ? s.shortcutInvalid : undefined}>
          <input
            className={shortcutError ? 'shortcut-input is-invalid' : 'shortcut-input'}
            readOnly
            value={
              recording ? '…' : prettyAccelerator(settings.globalShortcut, String(platform))
            }
            onFocus={() => setRecording(true)}
            onBlur={() => setRecording(false)}
            onKeyDown={(event) => {
              event.preventDefault()
              if (event.key === 'Escape') {
                event.currentTarget.blur()
                return
              }
              const accelerator = accelFromKeyboardEvent(event)
              if (!accelerator) return
              onPatch({ globalShortcut: accelerator })
              setRecording(false)
              event.currentTarget.blur()
            }}
          />
        </Row>
        <Row label={s.theme} stacked>
          <Segmented<ThemeMode>
            value={settings.theme}
            options={[
              { value: 'system', label: s.themeSystem },
              { value: 'light', label: s.themeLight },
              { value: 'dark', label: s.themeDark }
            ]}
            onChange={(theme) => onPatch({ theme })}
          />
        </Row>
        <Row label={s.lang} stacked>
          <Segmented<Lang>
            value={settings.lang}
            options={[
              { value: 'tr', label: 'Türkçe' },
              { value: 'en', label: 'English' }
            ]}
            onChange={(next) => onPatch({ lang: next })}
          />
        </Row>
      </div>

      <div className="footer-actions">
        <button type="button" className="btn-quiet" onClick={onOpenDataFolder}>
          {s.openDataFolder}
        </button>
        <button
          type="button"
          className="btn-quiet is-danger"
          onClick={() => {
            if (window.confirm(s.resetConfirm)) onReset()
          }}
        >
          {s.reset}
        </button>
      </div>

      <div className="version">
        {s.version} {info?.version ?? '—'}
      </div>
    </div>
  )
}
