import type { ReactNode } from 'react'

export function Row({
  label,
  hint,
  children,
  stacked = false
}: {
  label: string
  hint?: string
  children?: ReactNode
  stacked?: boolean
}): ReactNode {
  return (
    <div className={stacked ? 'row is-stacked' : 'row'}>
      <div>
        <div className="label">{label}</div>
        {hint ? <div className="hint">{hint}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={checked ? 'switch on' : 'switch'}
      onClick={() => onChange(!checked)}
    />
  )
}

export function Stepper({
  value,
  min,
  max,
  step = 1,
  format,
  onChange
}: {
  value: number
  min: number
  max: number
  step?: number
  format: (value: number) => string
  onChange: (next: number) => void
}): ReactNode {
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label="-"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <div className="val">{format(value)}</div>
      <button
        type="button"
        aria-label="+"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  )
}

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

export function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: SegmentOption<T>[]
  onChange: (next: T) => void
}): ReactNode {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={option.value === value ? 'on' : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
