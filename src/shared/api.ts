import type {
  Command,
  OverlayAction,
  OverlayPayload,
  Settings,
  SoundEvent,
  Stats,
  TimerState,
  WindowControlAction
} from './types'

export interface AppInfo {
  version: string
  /** process.platform degeri: darwin | win32 | linux */
  platform: string
  dataDir: string
}

export interface SetSettingsResult {
  settings: Settings
  /** Kisayol kaydedilemediyse false doner ve eski kisayol korunur. */
  shortcutOk: boolean
}

export type Unsubscribe = () => void

export interface MolaApi {
  getState(): Promise<TimerState>
  getSettings(): Promise<Settings>
  setSettings(patch: Partial<Settings>): Promise<SetSettingsResult>
  resetSettings(): Promise<Settings>
  getStats(): Promise<Stats>
  getInfo(): Promise<AppInfo>
  getOverlayPayload(): Promise<OverlayPayload | null>

  command(command: Command): void
  overlayAction(action: OverlayAction): void
  openDataFolder(): void
  windowControl(action: WindowControlAction): void

  onState(cb: (state: TimerState) => void): Unsubscribe
  onSettings(cb: (settings: Settings) => void): Unsubscribe
  onSound(cb: (event: SoundEvent) => void): Unsubscribe
  onOverlayPayload(cb: (payload: OverlayPayload) => void): Unsubscribe
  onNavigate(cb: (view: string) => void): Unsubscribe
}

declare global {
  interface Window {
    mola: MolaApi
  }
}
