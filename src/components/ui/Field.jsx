import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { cx } from './cx'

const inputClass = cx(
  'block w-full rounded-lg border bg-surface px-3 text-sm text-fg placeholder:text-subtle',
  'transition-colors focus:outline-none focus:ring-2',
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted',
)
const validClass = 'border-line-strong focus:border-brand focus:ring-brand/25'
const invalidClass = 'border-danger focus:border-danger focus:ring-danger/20'

/**
 * Label + control + hint/error. The child control receives id and aria props
 * through a render function so labels and errors stay wired for screen readers.
 */
export function Field({ label, required, hint, error, className, children }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-fg">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  const isInvalid = invalid ?? props['aria-invalid']
  return (
    <input
      ref={ref}
      className={cx(inputClass, 'h-10', isInvalid ? invalidClass : validClass, className)}
      {...props}
    />
  )
})

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(inputClass, 'py-2.5', props['aria-invalid'] ? invalidClass : validClass, className)}
      {...props}
    />
  )
})

export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cx('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted hover:text-fg"
        aria-label={visible ? 'Hide value' : 'Show value'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search', label, className, loading, ...props }) {
  return (
    <div className={cx('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label || placeholder}
        className={cx(inputClass, validClass, 'h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg"
          aria-label="Clear search"
        >
          {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-brand" /> : <X size={15} />}
        </button>
      )}
    </div>
  )
}
