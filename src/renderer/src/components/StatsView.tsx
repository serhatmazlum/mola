import type { ReactNode } from 'react'
import type { Strings } from '@shared/i18n'
import { fmt } from '@shared/i18n'
import type { DayStat, Settings, Stats } from '@shared/types'
import { dayNumber, humanDuration, isToday, lastDays } from '@/lib/format'

const CHART_DAYS = 14

function emptyDay(date: string): DayStat {
  return { date, pomodoros: 0, focusSeconds: 0, breaksTaken: 0, breaksSkipped: 0, stretches: 0 }
}

function Tile({
  value,
  label,
  accent = false
}: {
  value: string
  label: string
  accent?: boolean
}): ReactNode {
  return (
    <div className={accent ? 'stat-tile is-accent' : 'stat-tile'}>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export function StatsView({
  stats,
  settings,
  strings
}: {
  stats: Stats | null
  settings: Settings
  strings: Strings
}): ReactNode {
  if (!stats) return <div className="empty">…</div>

  const series = lastDays(stats.days, CHART_DAYS, emptyDay)
  const today = series[series.length - 1] ?? emptyDay('')
  const max = Math.max(1, ...series.map((d) => d.pomodoros))
  const week = series.slice(-7)
  const weekPomodoros = week.reduce((sum, d) => sum + d.pomodoros, 0)
  const weekFocus = week.reduce((sum, d) => sum + d.focusSeconds, 0)
  const hasAny = stats.days.some((d) => d.pomodoros > 0)

  return (
    <div>
      <div className="section-title">{strings.stats.today}</div>
      <div className="stat-grid">
        <Tile value={String(today.pomodoros)} label={strings.stats.pomodoros} accent />
        <Tile
          value={humanDuration(today.focusSeconds, settings.lang)}
          label={strings.stats.focusTime}
        />
        <Tile value={String(today.stretches)} label={strings.stats.stretches} />
        <Tile
          value={fmt(strings.stats.streakDays, { n: stats.streak })}
          label={strings.stats.streak}
        />
      </div>

      <div className="section-title">{strings.stats.last14}</div>
      {hasAny ? (
        <div className="bars">
          {series.map((day) => {
            const ratio = day.pomodoros / max
            return (
              <div
                key={day.date}
                className={isToday(day.date) ? 'col is-today' : 'col'}
                title={`${day.date} · ${day.pomodoros}`}
              >
                <div
                  className={day.pomodoros === 0 ? 'bar is-zero' : 'bar'}
                  style={{ height: `${Math.max(3, ratio * 78)}%` }}
                />
                <div className="day">{dayNumber(day.date)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty">{strings.stats.empty}</div>
      )}

      <div className="section-title">{strings.stats.weekTotal}</div>
      <div className="stat-grid">
        <Tile value={String(weekPomodoros)} label={strings.stats.pomodoros} />
        <Tile value={humanDuration(weekFocus, settings.lang)} label={strings.stats.focusTime} />
        <Tile
          value={String(week.reduce((s, d) => s + d.breaksTaken, 0))}
          label={strings.stats.breaksTaken}
        />
        <Tile
          value={String(week.reduce((s, d) => s + d.breaksSkipped, 0))}
          label={strings.stats.breaksSkipped}
        />
      </div>
    </div>
  )
}
