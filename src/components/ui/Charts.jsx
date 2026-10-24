import { useState } from 'react'
import { cx } from './cx'
import { niceTicks } from '../../lib/chartScale'

/**
 * Single-series column chart. One series needs no legend: the card title names
 * it. Each column is a focusable hit target with a tooltip, and the same values
 * are exposed as a visually hidden table.
 */
export function ColumnChart({ data, unit, format = (v) => Number(v).toLocaleString(), height = 176, caption }) {
  const [active, setActive] = useState(null)
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.value)))
  const top = ticks[ticks.length - 1] || 1

  return (
    <figure className="select-none">
      <div className="flex gap-2">
        <div className="relative w-9 shrink-0 text-right text-2xs text-subtle tabular" style={{ height }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: 'translateY(50%)' }}>
              {format(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }} onMouseLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <div
              key={t}
              className={cx('absolute inset-x-0 border-t', t === 0 ? 'border-line-strong' : 'border-dashed border-line')}
              style={{ bottom: `${(t / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}
          <div className="absolute inset-0 flex">
            {data.map((d, i) => {
              const pct = (d.value / top) * 100
              const isActive = active === i
              return (
                <button
                  key={d.key}
                  type="button"
                  className="group relative flex h-full flex-1 items-end justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${d.label}: ${format(d.value)} ${unit}`}
                >
                  <span className={cx('absolute inset-x-1 inset-y-0 rounded-md transition-colors', isActive && 'bg-brand/[0.06]')} aria-hidden="true" />
                  <span
                    className={cx('relative w-full max-w-[44px] rounded-t-[4px] bg-brand transition-opacity', active !== null && !isActive && 'opacity-60')}
                    style={{ height: d.value > 0 ? `max(${pct}%, 2px)` : 0, marginInline: 2 }}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <span
                      className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left shadow-pop"
                      style={{ bottom: `calc(${Math.min(pct, 100)}% + 8px)`, left: '50%' }}
                      role="tooltip"
                    >
                      <span className="block text-2xs font-medium text-muted">{d.label}</span>
                      <span className="block text-[13px] font-bold text-fg tabular">
                        {format(d.value)} <span className="font-medium text-muted">{unit}</span>
                      </span>
                      {d.detail && <span className="block text-2xs text-muted">{d.detail}</span>}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="ml-11 mt-2 flex" aria-hidden="true">
        {data.map((d) => (
          <span key={d.key} className="flex-1 truncate text-center text-2xs font-medium text-muted">{d.short ?? d.label}</span>
        ))}
      </div>
      <table className="sr-only">
        {caption && <caption>{caption}</caption>}
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{format(d.value)} {unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

const segmentTones = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-sky',
  neutral: 'bg-line-strong',
}

/**
 * Part-to-whole breakdown of states (status colours, always with a label and
 * count beside them so colour is never the only cue).
 */
export function StatusBreakdown({ items, total }) {
  const sum = total ?? items.reduce((acc, i) => acc + i.value, 0)
  const pct = (v) => (sum > 0 ? Math.round((v / sum) * 100) : 0)
  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        {items.filter((i) => i.value > 0).map((i) => (
          <span key={i.key} className={cx('h-full first:rounded-l-full last:rounded-r-full', segmentTones[i.tone])} style={{ width: `${(i.value / (sum || 1)) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-2.5 text-[13px]">
            <span className={cx('h-2.5 w-2.5 shrink-0 rounded-sm', segmentTones[i.tone])} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="font-medium text-fg">{i.label}</span>
              {i.hint && <span className="block text-2xs text-muted">{i.hint}</span>}
            </span>
            <span className="font-semibold text-fg tabular">{i.value.toLocaleString()}</span>
            <span className="w-10 text-right text-xs text-muted tabular">{pct(i.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Ranked horizontal bars for a handful of categories (one hue: the bars encode magnitude only). */
export function RankedBars({ items }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.key} className="text-[13px]">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="truncate font-medium text-fg">{i.label}</span>
            <span className="font-semibold text-fg tabular">{i.value.toLocaleString()}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2" aria-hidden="true">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
