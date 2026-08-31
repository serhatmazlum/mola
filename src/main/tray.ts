import { Menu, Tray, nativeImage } from 'electron'
import path from 'node:path'
import { t } from '@shared/i18n'
import type { Settings, TimerState } from '@shared/types'
import { RESOURCES_DIR } from './windows'

export interface TrayActions {
  toggle(): void
  skip(): void
  stretchNow(): void
  showWindow(): void
  openSettings(): void
  quit(): void
}

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0')
}

function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function trayImage(): Electron.NativeImage {
  const file = process.platform === 'darwin' ? 'trayTemplate.png' : 'tray.png'
  const image = nativeImage.createFromPath(path.join(RESOURCES_DIR, file))
  if (process.platform === 'darwin') image.setTemplateImage(true)
  return image
}

export class TrayController {
  private tray: Tray | null = null
  private lastTitle = ''
  private lastMenuKey = ''

  constructor(private readonly actions: TrayActions) {}

  create(settings: Settings, state: TimerState): void {
    if (this.tray) return
    this.tray = new Tray(trayImage())
    this.tray.setIgnoreDoubleClickEvents(true)
    this.tray.on('click', () => {
      // Windows/Linux'ta sol tik pencereyi acar; macOS'ta menu zaten acilir.
      if (process.platform !== 'darwin') this.actions.showWindow()
    })
    this.update(settings, state)
  }

  update(settings: Settings, state: TimerState): void {
    if (!this.tray) return
    const strings = t(settings.lang)

    const title =
      settings.showTrayCountdown && state.phase !== 'idle' ? clock(state.remainingMs) : ''
    if (title !== this.lastTitle) {
      this.lastTitle = title
      if (process.platform === 'darwin') {
        this.tray.setTitle(title ? ` ${title}` : '', { fontType: 'monospacedDigit' })
      }
    }

    const phaseLabel = strings.phase[state.phase]
    const tooltip =
      state.phase === 'idle'
        ? `${strings.appName} — ${strings.phase.idle}`
        : `${strings.appName} — ${phaseLabel} ${clock(state.remainingMs)}`
    this.tray.setToolTip(tooltip)

    // Menuyu sadece anlamli bir sey degistiginde yeniden kur.
    const menuKey = [settings.lang, state.phase, state.running, state.overlayOpen].join('|')
    if (menuKey === this.lastMenuKey) return
    this.lastMenuKey = menuKey

    const menu = Menu.buildFromTemplate([
      { label: `${strings.appName} — ${phaseLabel}`, enabled: false },
      { type: 'separator' },
      {
        label: state.running ? strings.action.pause : strings.action.start,
        enabled: !state.overlayOpen,
        click: () => this.actions.toggle()
      },
      {
        label: strings.action.skip,
        enabled: state.phase !== 'idle',
        click: () => this.actions.skip()
      },
      {
        label: strings.action.stretchNow,
        enabled: !state.overlayOpen,
        click: () => this.actions.stretchNow()
      },
      { type: 'separator' },
      { label: strings.action.show, click: () => this.actions.showWindow() },
      { label: strings.settings.title, click: () => this.actions.openSettings() },
      { type: 'separator' },
      { label: strings.action.quit, click: () => this.actions.quit() }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
