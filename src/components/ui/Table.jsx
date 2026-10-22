import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from './cx'

export function Table({ children, className, minWidth = 640, caption }) {
  return (
    <div className={cx('scrollbar-thin overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

export function Th({ children, className, align = 'left' }) {
  return (
    <th
      scope="col"
      className={cx(
        'whitespace-nowrap border-b border-line bg-surface-2 px-3 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className, align = 'left' }) {
  return (
    <td
      className={cx(
        'border-b border-line px-3 py-3 align-middle text-fg first:pl-4 last:pr-4 sm:px-4 sm:first:pl-5 sm:last:pr-5',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function Tr({ children, className }) {
  return <tr className={cx('transition-colors hover:bg-surface-2/70 [&:last-child>td]:border-b-0', className)}>{children}</tr>
}

/** Skeleton rows that match the table's column count while data loads. */
export function SkeletonRows({ rows = 6, cols = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} aria-hidden="true">
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c} className="border-b border-line px-4 py-3.5 first:pl-5 last:pr-5">
          <div className="h-3.5 animate-pulse rounded bg-line" style={{ width: `${45 + ((r * 7 + c * 13) % 45)}%` }} />
        </td>
      ))}
    </tr>
  ))
}

/** Full-width table cell used for empty and error states. */
export function TableMessage({ cols, children }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-10">
        {children}
      </td>
    </tr>
  )
}

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push(`gap-${p}`)
    out.push(p)
  })
  return out
}

export function Pagination({ page, totalPages, onChange, disabled, summary }) {
  if (!totalPages || totalPages < 1) return null
  const current = Number(page) || 1
  const btn = 'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row sm:px-5"
      aria-label="Pagination"
    >
      <p className="text-[13px] text-muted tabular">
        {summary ?? <>Page <span className="font-semibold text-fg">{current}</span> of <span className="font-semibold text-fg">{totalPages}</span></>}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cx(btn, 'text-muted hover:bg-surface-2 hover:text-fg')}
          onClick={() => onChange(current - 1)}
          disabled={disabled || current <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pageList(current, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-subtle" aria-hidden="true">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              disabled={disabled}
              aria-current={p === current ? 'page' : undefined}
              className={cx(
                btn,
                'hidden tabular sm:flex',
                p === current ? 'flex bg-brand text-brand-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={cx(btn, 'text-muted hover:bg-surface-2 hover:text-fg')}
          onClick={() => onChange(current + 1)}
          disabled={disabled || current >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}
