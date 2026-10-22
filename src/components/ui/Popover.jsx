import { useEffect, useId, useRef, useState } from 'react'
import { cx } from './cx'

/**
 * Click-to-open panel anchored to a trigger. Closes on outside click and
 * Escape, returning focus to the trigger.
 */
export default function Popover({ trigger, children, align = 'right', className, panelLabel }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-controls': id,
        'aria-haspopup': 'dialog',
      })}
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={panelLabel}
          className={cx(
            'absolute top-full z-50 mt-2 animate-pop-in rounded-xl border border-line bg-surface shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}
