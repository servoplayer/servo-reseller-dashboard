import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'
import { cx } from './cx'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible dialog: Escape and backdrop close it (unless `busy`), focus is
 * moved inside and trapped, and returned to the trigger on close.
 */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md', busy = false, onSubmit }) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    const panel = panelRef.current
    const first =
      panel?.querySelector('[data-autofocus]') ||
      panel?.querySelector('input:not([disabled]), textarea:not([disabled])') ||
      panel?.querySelector(FOCUSABLE)
    first?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape' && !busyRef.current) {
        e.stopPropagation()
        closeRef.current?.()
      }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)]
        if (!items.length) return
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  const Wrapper = onSubmit ? 'form' : 'div'
  const wrapperProps = onSubmit
    ? { onSubmit: (e) => { e.preventDefault(); onSubmit(e) }, noValidate: true }
    : {}

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-navy/50 backdrop-blur-[2px]"
        onClick={() => !busy && onClose?.()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cx(
          'relative flex max-h-[92vh] w-full animate-pop-in flex-col rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-xl',
          size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <Wrapper className="flex min-h-0 flex-1 flex-col" {...wrapperProps}>
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold text-fg">{title}</h2>
              {description && <p id={descId} className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-3.5 sm:flex-row sm:justify-end sm:rounded-b-xl">
              {footer}
            </div>
          )}
        </Wrapper>
      </div>
    </div>,
    document.body,
  )
}

/** Explicit approval for destructive or financially consequential actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={loading}
      size="sm"
      title={
        <span className="flex items-center gap-2.5">
          {tone === 'danger' && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-soft text-danger">
              <AlertTriangle size={15} aria-hidden="true" />
            </span>
          )}
          {title}
        </span>
      }
      footer={
        <>
          {/* Cancel takes initial focus so Enter never triggers the action by accident. */}
          <Button variant="secondary" onClick={onClose} disabled={loading} data-autofocus>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-muted">{description}</p>}
      {children}
    </Modal>
  )
}
