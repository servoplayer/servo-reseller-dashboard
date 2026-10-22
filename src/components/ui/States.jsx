import { AlertCircle, Inbox, RotateCw } from 'lucide-react'
import Button from './Button'
import { cx } from './cx'

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cx('mx-auto flex max-w-sm flex-col items-center text-center', className)}>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-subtle ring-1 ring-line">
        <Icon size={20} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry, className }) {
  return (
    <div className={cx('mx-auto flex max-w-sm flex-col items-center text-center', className)} role="alert">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertCircle size={20} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-fg">Couldn&apos;t load this data</p>
      {message && <p className="mt-1 text-[13px] text-muted">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  )
}

/** Inline banner for contextual warnings inside a page or card. */
export function Callout({ tone = 'info', icon: Icon = AlertCircle, title, children, action, className }) {
  const tones = {
    info: 'border-info/25 bg-info-soft text-info',
    warning: 'border-warning/25 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
    success: 'border-success/25 bg-success-soft text-success',
  }
  return (
    <div className={cx('flex items-start gap-3 rounded-lg border px-3.5 py-3', tones[tone], className)} role="status">
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[13px]">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-fg/80">{children}</div>}
      </div>
      {action}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded bg-line', className)} aria-hidden="true" />
}
