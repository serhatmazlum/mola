const SPECIAL: Record<string, string> = {
  ' ': 'Space',
  Escape: 'Esc',
  Enter: 'Return',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Tab: 'Tab',
  '+': 'Plus',
  '-': '-',
  '=': '=',
  ',': ',',
  '.': '.',
  '/': '/',
  '\\': '\\',
  ';': ';',
  "'": "'",
  '[': '[',
  ']': ']'
}

/**
 * Klavye olayindan Electron accelerator uretir.
 * En az bir degistirici sart; sadece Shift kabul edilmez (harf yazmakla karisir).
 */
export function accelFromKeyboardEvent(event: {
  key: string
  code: string
  metaKey: boolean
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
}): string | null {
  const modifiers: string[] = []
  if (event.metaKey) modifiers.push('Command')
  if (event.ctrlKey) modifiers.push('Control')
  if (event.altKey) modifiers.push('Alt')
  if (event.shiftKey) modifiers.push('Shift')

  const hasRealModifier = event.metaKey || event.ctrlKey || event.altKey
  if (!hasRealModifier) return null

  let key: string | null = null
  if (/^F\d{1,2}$/.test(event.key)) key = event.key
  else if (/^Key[A-Z]$/.test(event.code)) key = event.code.slice(3)
  else if (/^Digit\d$/.test(event.code)) key = event.code.slice(5)
  else if (SPECIAL[event.key]) key = SPECIAL[event.key] ?? null
  else if (event.key.length === 1) key = event.key.toUpperCase()

  if (!key) return null
  return [...modifiers, key].join('+')
}

const MAC_SYMBOLS: Record<string, string> = {
  CommandOrControl: '⌘',
  CmdOrCtrl: '⌘',
  Command: '⌘',
  Cmd: '⌘',
  Control: '⌃',
  Ctrl: '⌃',
  Alt: '⌥',
  Option: '⌥',
  Shift: '⇧',
  Super: '❖'
}

const WIN_WORDS: Record<string, string> = {
  CommandOrControl: 'Ctrl',
  CmdOrCtrl: 'Ctrl',
  Command: 'Win',
  Cmd: 'Win',
  Control: 'Ctrl',
  Ctrl: 'Ctrl',
  Alt: 'Alt',
  Option: 'Alt',
  Shift: 'Shift',
  Super: 'Win'
}

export function prettyAccelerator(accelerator: string, platform: string): string {
  if (!accelerator) return '—'
  const isMac = platform === 'darwin'
  const table = isMac ? MAC_SYMBOLS : WIN_WORDS
  const parts = accelerator.split('+').map((part) => table[part] ?? part)
  return isMac ? parts.join('') : parts.join(' + ')
}
