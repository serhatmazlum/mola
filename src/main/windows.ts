import { BrowserWindow, app, nativeTheme, screen, shell } from 'electron'
import path from 'node:path'
import type { OverlayPayload, ThemeMode } from '@shared/types'

const isDev = !app.isPackaged
const rendererUrl = process.env['ELECTRON_RENDERER_URL']

export const RESOURCES_DIR = path.join(__dirname, '../../resources')
const PRELOAD = path.join(__dirname, '../preload/index.js')
const RENDERER_DIR = path.join(__dirname, '../renderer')

const BG_DARK = '#0e1016'
const BG_LIGHT = '#f4f5f8'

function backgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? BG_DARK : BG_LIGHT
}

function loadRoute(win: BrowserWindow, file: 'index' | 'overlay', query?: Record<string, string>): void {
  const search = query ? `?${new URLSearchParams(query).toString()}` : ''
  if (isDev && rendererUrl) {
    void win.loadURL(`${rendererUrl}/${file}.html${search}`)
  } else {
    void win.loadFile(path.join(RENDERER_DIR, `${file}.html`), query ? { query } : undefined)
  }
}

export class WindowManager {
  private main: BrowserWindow | null = null
  private overlays: BrowserWindow[] = []
  private lastPayload: OverlayPayload | null = null
  /** Uygulama gercekten kapaniyor mu, yoksa pencere sadece gizleniyor mu. */
  quitting = false

  createMainWindow(startHidden: boolean): BrowserWindow {
    if (this.main && !this.main.isDestroyed()) {
      this.showMain()
      return this.main
    }

    const win = new BrowserWindow({
      width: 420,
      height: 660,
      minWidth: 380,
      minHeight: 580,
      show: false,
      backgroundColor: backgroundColor(),
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
      ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 14, y: 18 } } : {}),
      ...(process.platform !== 'darwin'
        ? {
            titleBarOverlay: {
              color: backgroundColor(),
              symbolColor: nativeTheme.shouldUseDarkColors ? '#9aa3b2' : '#4a5160',
              height: 40
            }
          }
        : {}),
      webPreferences: {
        preload: PRELOAD,
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        spellcheck: false,
        backgroundThrottling: false
      }
    })

    win.on('ready-to-show', () => {
      if (!startHidden) win.show()
    })

    // Pencereyi kapatmak uygulamayi kapatmaz; zamanlayici arka planda surer.
    win.on('close', (event) => {
      if (this.quitting) return
      event.preventDefault()
      win.hide()
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url)
      return { action: 'deny' }
    })

    loadRoute(win, 'index')
    this.main = win
    return win
  }

  getMain(): BrowserWindow | null {
    return this.main && !this.main.isDestroyed() ? this.main : null
  }

  showMain(): void {
    const win = this.getMain() ?? this.createMainWindow(false)
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }

  toggleMain(): void {
    const win = this.getMain()
    if (win && win.isVisible() && win.isFocused()) win.hide()
    else this.showMain()
  }

  applyTheme(mode: ThemeMode): void {
    nativeTheme.themeSource = mode
    const win = this.getMain()
    if (!win) return
    win.setBackgroundColor(backgroundColor())
    if (process.platform !== 'darwin') {
      try {
        win.setTitleBarOverlay({
          color: backgroundColor(),
          symbolColor: nativeTheme.shouldUseDarkColors ? '#9aa3b2' : '#4a5160',
          height: 40
        })
      } catch {
        // Bazi Windows surumlerinde overlay guncellenemez; kritik degil.
      }
    }
  }

  // ------------------------------------------------------------------ overlay

  openOverlay(payload: OverlayPayload): void {
    this.lastPayload = payload
    if (this.overlays.length > 0) {
      this.sendOverlay('overlay:payload', payload)
      return
    }

    const displays = screen.getAllDisplays()
    const primaryId = screen.getPrimaryDisplay().id

    this.overlays = displays.map((display) => {
      const isPrimary = display.id === primaryId
      const win = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        show: false,
        frame: false,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        closable: false,
        skipTaskbar: true,
        fullscreenable: false,
        backgroundColor: '#0b0d12',
        webPreferences: {
          preload: PRELOAD,
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          spellcheck: false,
          backgroundThrottling: false
        }
      })

      // 'screen-saver' seviyesi macOS menu cubugunun ve tam ekran uygulamalarin ustune cikar.
      win.setAlwaysOnTop(true, 'screen-saver')
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      win.on('ready-to-show', () => {
        win.showInactive()
        win.focus()
      })

      loadRoute(win, 'overlay', { primary: isPrimary ? '1' : '0' })
      return win
    })
  }

  closeOverlay(): void {
    this.lastPayload = null
    for (const win of this.overlays) {
      if (!win.isDestroyed()) win.destroy()
    }
    this.overlays = []
  }

  hasOverlay(): boolean {
    return this.overlays.some((w) => !w.isDestroyed())
  }

  getOverlayPayload(): OverlayPayload | null {
    return this.lastPayload
  }

  // -------------------------------------------------------------- broadcasting

  broadcast(channel: string, ...args: unknown[]): void {
    const main = this.getMain()
    if (main) main.webContents.send(channel, ...args)
    this.sendOverlay(channel, ...args)
  }

  sendMain(channel: string, ...args: unknown[]): void {
    this.getMain()?.webContents.send(channel, ...args)
  }

  sendOverlay(channel: string, ...args: unknown[]): void {
    for (const win of this.overlays) {
      if (!win.isDestroyed()) win.webContents.send(channel, ...args)
    }
  }

  /** Ses tek yerden calsin: overlay acikken orada, degilse ana pencerede. */
  routeSound(channel: string, payload: unknown): void {
    if (this.hasOverlay()) this.sendOverlay(channel, payload)
    else this.sendMain(channel, payload)
  }

  destroyAll(): void {
    this.quitting = true
    this.closeOverlay()
    const main = this.getMain()
    if (main) main.destroy()
    this.main = null
  }
}
