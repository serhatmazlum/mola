import type { SoundEvent } from '@shared/types'

/**
 * Ses dosyasi tasimamak icin tonlari Web Audio ile uretiyoruz:
 * paket kucuk kalir, lisans derdi olmaz, her platformda ayni calar.
 */
const PATTERNS: Record<SoundEvent, number[]> = {
  focusStart: [523.25, 659.25, 783.99],
  breakStart: [783.99, 587.33, 493.88],
  breakEnd: [493.88, 659.25, 880.0],
  warn: [880.0]
}

let ctx: AudioContext | null = null

function context(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function playSound(event: SoundEvent, volume: number): void {
  if (volume <= 0) return
  const audio = context()
  if (!audio) return

  const notes = PATTERNS[event] ?? PATTERNS.warn
  const start = audio.currentTime + 0.02
  const step = 0.13

  notes.forEach((freq, index) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq

    const t0 = start + index * step
    const peak = Math.min(0.28, 0.28 * volume)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42)

    osc.connect(gain).connect(audio.destination)
    osc.start(t0)
    osc.stop(t0 + 0.45)
  })
}
