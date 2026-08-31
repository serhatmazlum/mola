import {
  BrowserWindow,
  Notification,
  app,
  globalShortcut,
  ipcMain,
  nativeTheme,
  powerMonitor,
  shell
} from 'electron'
import { EXERCISES_BY_ID } from '@shared/exercises'
import { fmt, t } from '@shared/i18n'
import type {
  Command,
  OverlayAction,
  Settings,
  SoundEvent,
  WindowControlAction
} from '@shared/types'
import { Engine, type NotificationKey } from './engine'
import { Store } from './store'
import { TrayController } from './tray'
import { WindowManager } from './windows'

const IDLE_POLL_MS = 1000

// getPath('userData') cagrilmadan once: gelistirme ve paketli surum ayni klasoru kullansin.
app.setName('Mola')

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let store: Store
let engine: Engine
let windows: WindowManager
let tray: TrayController
let idlePoller: NodeJS.Timeout | null = null
let registeredShortcut = ''

// ------------------------------------------------------------------ bildirim

function notify(key: NotificationKey, vars: Record<string, string | number>): void {
  const settings = store.getSettings()
  if (!settings.notificationsEnabled || !Notification.isSupported()) return
  const strings = t(settings.lang)

  let title: string
  let body: string

  if (key === 'eye') {
    const exercise = EXERCISES_BY_ID.get('eye-20-20-20')
    const text = exercise ? exercise[settings.lang] : null
    title = text?.name ?? '20-20-20'
    body = text?.steps.join(' ') ?? ''
  } else {
    const phaseLabel = strings.phase[engine.getState().phase]
    title = strings.notif[`${key}Title` as const]
    body = fmt(strings.notif[`${key}Body` as const], { phase: phaseLabel, ...vars })
  }

  const notification = new Notification({ title, body, silent: !settings.soundEnabled })
  notification.on('click', () => windows.showMain())
  notification.show()
}

// ------------------------------------------------------------------- kisayol

function applyGlobalShortcut(accelerator: string): boolean {
  if (registeredShortcut === accelerator) return true
  if (registeredShortcut) {
    globalShortcut.unregister(registeredShortcut)
    registeredShortcut = ''
  }
  if (!accelerator) return true
  try {
    const ok = globalShortcut.register(accelerator, () => engine.execute({ type: 'toggle' }))
    if (ok) registeredShortcut = accelerator
    return ok
  } catch {
    return false
  }
}

/**
 * Acilista baslatmayi sistemle esitler ve *gerceklesen* durumu dondurur.
 * Imzasiz ya da /Applications disindan calisan bir kopyada macOS bunu
 * reddedebilir; o zaman ayari geri alip arayuzun yalan soylemesini onleriz.
 * openAsHidden Electron 44'te kaldirildi; gizli acilis kendi startMinimized
 * ayarimizla saglaniyor.
 */
function syncLaunchAtLogin(desired: boolean): boolean {
  // Gelistirme modunda kullanicinin acilis ogelerine Electron binary'si eklenmez.
  if (!app.isPackaged) return desired
  try {
    if (app.getLoginItemSettings().openAtLogin === desired) return desired
    app.setLoginItemSettings({ openAtLogin: desired })
    return app.getLoginItemSettings().openAtLogin
  } catch {
    return false
  }
}

function applySystemSettings(settings: Settings): void {
  windows.applyTheme(settings.theme)
  const actual = syncLaunchAtLogin(settings.launchAtLogin)
  if (actual !== settings.launchAtLogin) store.updateSettings({ launchAtLogin: actual })
}

// ----------------------------------------------------------------------- IPC

function registerIpc(): void {
  ipcMain.handle('app:getState', () => engine.getState())
  ipcMain.handle('app:getSettings', () => store.getSettings())
  ipcMain.handle('app:getStats', () => store.getStats())
  ipcMain.handle('overlay:getPayload', () => engine.getOverlayPayload())

  ipcMain.handle('app:getInfo', () => ({
    version: app.getVersion(),
    platform: process.platform,
    dataDir: store.dir
  }))

  ipcMain.handle('app:setSettings', (_event, patch: Partial<Settings>) => {
    const prev = store.getSettings()
    const next = store.updateSettings(patch)
    engine.onSettingsChanged(prev, next)
    applySystemSettings(next)

    let shortcutOk = true
    if (prev.globalShortcut !== next.globalShortcut) {
      shortcutOk = applyGlobalShortcut(next.globalShortcut)
      if (!shortcutOk) {
        // Kaydedilemeyen kisayolu geri al ki ayar ile gercek durum uyusmasin.
        store.updateSettings({ globalShortcut: prev.globalShortcut })
        applyGlobalShortcut(prev.globalShortcut)
      }
    }

    const result = store.getSettings()
    windows.broadcast('settings', result)
    tray.update(result, engine.getState())
    return { settings: result, shortcutOk }
  })

  ipcMain.handle('app:resetSettings', () => {
    const prev = store.getSettings()
    const next = store.resetSettings()
    engine.onSettingsChanged(prev, next)
    applySystemSettings(next)
    applyGlobalShortcut(next.globalShortcut)
    windows.broadcast('settings', next)
    return next
  })

  ipcMain.on('app:command', (_event, command: Command) => engine.execute(command))
  ipcMain.on('overlay:action', (_event, action: OverlayAction) => engine.overlayAction(action))

  ipcMain.on('app:openDataFolder', () => {
    void shell.openPath(store.dir)
  })

  ipcMain.on('win:control', (event, action: WindowControlAction) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (action.type === 'minimize') win.minimize()
    else win.hide()
  })
}

// ------------------------------------------------------------------- bootstrap

app.whenReady().then(() => {
  app.setAppUserModelId('com.smc.mola')

  store = new Store()
  windows = new WindowManager()

  engine = new Engine(store, {
    onState: (state) => {
      windows.broadcast('state', state)
      tray?.update(store.getSettings(), state)
    },
    onOverlayOpen: (payload) => windows.openOverlay(payload),
    onOverlayClose: () => windows.closeOverlay(),
    onNotify: (key, vars) => notify(key, vars),
    onSound: (event: SoundEvent) => {
      if (!store.getSettings().soundEnabled) return
      windows.routeSound('sound', event)
    }
  })

  tray = new TrayController({
    toggle: () => engine.execute({ type: 'toggle' }),
    skip: () => engine.execute({ type: 'skipPhase' }),
    stretchNow: () => engine.execute({ type: 'stretchNow' }),
    showWindow: () => windows.showMain(),
    openSettings: () => {
      windows.showMain()
      windows.sendMain('navigate', 'settings')
    },
    quit: () => {
      windows.quitting = true
      app.quit()
    }
  })

  const settings = store.getSettings()
  registerIpc()
  applySystemSettings(settings)
  applyGlobalShortcut(settings.globalShortcut)

  windows.createMainWindow(settings.startMinimized)
  tray.create(settings, engine.getState())
  engine.startTicking()

  // Bilgisayar basinda mi? Motor buna gore odagi duraklatir ve esneme sayacini sifirlar.
  idlePoller = setInterval(() => {
    engine.setIdle(powerMonitor.getSystemIdleTime())
  }, IDLE_POLL_MS)

  powerMonitor.on('suspend', () => engine.execute({ type: 'pause' }))
  powerMonitor.on('lock-screen', () => engine.execute({ type: 'pause' }))
  powerMonitor.on('resume', () => engine.handleWake())
  powerMonitor.on('unlock-screen', () => engine.handleWake())

  nativeTheme.on('updated', () => {
    windows.broadcast('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
  })

  app.on('activate', () => windows.showMain())
})

app.on('second-instance', () => windows?.showMain())

// Pencere kapansa bile zamanlayici tepside calismaya devam eder.
app.on('window-all-closed', () => {})

app.on('before-quit', () => {
  if (windows) windows.quitting = true
  engine?.stopTicking()
  if (idlePoller) clearInterval(idlePoller)
  globalShortcut.unregisterAll()
  tray?.destroy()
  store?.flush()
})
