import { toast } from 'react-toastify'

// Toast ids are derived from the message so the same event never stacks
// duplicate notifications (e.g. a double click or a re-render).
const show = (kind) => (message, options = {}) => {
  if (!message) return
  const toastId = options.toastId ?? `${kind}:${message}`
  if (toast.isActive(toastId)) return
  toast[kind](message, { toastId, ...options })
}

export const notify = {
  success: show('success'),
  error: show('error'),
  warning: show('warning'),
  info: show('info'),
}
