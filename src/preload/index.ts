import { contextBridge, ipcRenderer } from 'electron'
import type { MolaApi, Unsubscribe } from '@shared/api'
import type { Command, OverlayAction, Settings, WindowControlAction } from '@shared/types'

function subscribe<T>(channel: string, cb: (value: T) => void): Unsubscribe {
  const listener = (_event: Electron.IpcRendererEvent, value: T): void => cb(value)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: MolaApi = {
  getState: () => ipcRenderer.invoke('app:getState'),
  getSettings: () => ipcRenderer.invoke('app:getSettings'),
  setSettings: (patch: Partial<Settings>) => ipcRenderer.invoke('app:setSettings', patch),
  resetSettings: () => ipcRenderer.invoke('app:resetSettings'),
  getStats: () => ipcRenderer.invoke('app:getStats'),
  getInfo: () => ipcRenderer.invoke('app:getInfo'),
  getOverlayPayload: () => ipcRenderer.invoke('overlay:getPayload'),

  command: (command: Command) => ipcRenderer.send('app:command', command),
  overlayAction: (action: OverlayAction) => ipcRenderer.send('overlay:action', action),
  openDataFolder: () => ipcRenderer.send('app:openDataFolder'),
  windowControl: (action: WindowControlAction) => ipcRenderer.send('win:control', action),

  onState: (cb) => subscribe('state', cb),
  onSettings: (cb) => subscribe('settings', cb),
  onSound: (cb) => subscribe('sound', cb),
  onOverlayPayload: (cb) => subscribe('overlay:payload', cb),
  onNavigate: (cb) => subscribe('navigate', cb)
}

contextBridge.exposeInMainWorld('mola', api)
