import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cx } from './cx'

const variants = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-hover shadow-card',
  secondary: 'bg-surface text-fg border border-line-strong hover:bg-surface-2 hover:border-subtle/60',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:bg-danger-hover shadow-card dark:text-canvas',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
}

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, icon: Icon, className, children, type = 'button', ...props },
  ref,
) {
  const iconSize = size === 'sm' || size === 'icon-sm' ? 15 : 17
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex shrink-0 items-center rounded-lg font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={iconSize} aria-hidden="true" />
      )}
      {children}
    </button>
  )
})

export default Button
