import type { ReactNode } from 'react'

const SIZE = 236
const STROKE = 13
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Kalan orani (0..1) gosteren gradyanli ilerleme halkasi. */
export function Ring({ progress, children }: { progress: number; children: ReactNode }): ReactNode {
  const clamped = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0
  return (
    <div className="ring-wrap">
      <svg className="ring" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle className="track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
        <circle
          className="progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
