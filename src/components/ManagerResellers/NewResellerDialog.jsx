import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Field, Input, PasswordInput } from '../ui/Field'
import { distributorApi } from '../../lib/services'
import { invalidate } from '../../lib/resource'
import { notify } from '../../lib/notify'
import { formatNumber } from '../../lib/format'
import { MAX_RECHARGE, newIdempotencyKey } from '../../lib/credits'

const EMPTY = { userName: '', email: '', password: '', initialCredits: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(v) {
  const errors = {}
  if (!v.userName.trim()) errors.userName = 'Name is required.'
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Enter a valid email address.'
  if (v.password.length < 6) errors.password = 'Use at least 6 characters.'
  if (v.initialCredits !== '') {
    const n = Number(v.initialCredits)
    if (!Number.isInteger(n) || n < 0 || n > MAX_RECHARGE) errors.initialCredits = `Use a whole number from 0 to ${MAX_RECHARGE.toLocaleString()}.`
  }
  return errors
}

/** Creates a regular reseller through POST /distributor/createReseller. */
export default function NewResellerDialog({ open, onClose }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  // Starting credits use the same duplicate protection as a recharge.
  const keyRef = useRef('')

  useEffect(() => {
    if (open) {
      setValues(EMPTY)
      setErrors({})
      keyRef.current = newIdempotencyKey()
    }
  }, [open])

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async () => {
    if (busy) return
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    const res = await distributorApi.createReseller({
      userName: values.userName.trim(),
      email: values.email.trim(),
      password: values.password,
      initialCredits: values.initialCredits === '' ? 0 : Number(values.initialCredits),
      idempotencyKey: keyRef.current,
    })
    setBusy(false)
    if (!res.ok) {
      // Inputs are kept so the manager can correct them (e.g. an email already in use).
      notify.error(res.message)
      return
    }
    const created = res.data?.reseller
    if (res.data?.creditsError) {
      notify.warning(`${created?.userName} was created, but the starting credits were not added: ${res.data.creditsError}. Use Recharge to add them.`)
    } else {
      notify.success(`${created?.userName} was created with ${formatNumber(created?.subscriptionsNum ?? 0)} credits. They can sign in to the reseller portal now.`)
    }
    invalidate('dm-resellers', 'dm-tx')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      onSubmit={submit}
      title="New reseller"
      description="Creates a regular reseller account that signs in to this portal and activates customers with credits."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" loading={busy}>Create reseller</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required error={errors.userName}>
          {(p) => <Input {...p} value={values.userName} onChange={set('userName')} autoComplete="off" placeholder="Reseller name" maxLength={100} />}
        </Field>
        <Field label="Email" required error={errors.email} hint="They sign in with this email.">
          {(p) => <Input {...p} type="email" value={values.email} onChange={set('email')} autoComplete="off" placeholder="name@company.com" />}
        </Field>
        <Field label="Password" required error={errors.password} hint="At least 6 characters. Share it with the reseller securely.">
          {(p) => <PasswordInput {...p} value={values.password} onChange={set('password')} autoComplete="new-password" />}
        </Field>
        <Field
          label="Starting credits"
          error={errors.initialCredits}
          hint="Optional. Added as a recharge and recorded in the credit history."
        >
          {(p) => (
            <Input
              {...p}
              type="number"
              min="0"
              max={MAX_RECHARGE}
              step="1"
              inputMode="numeric"
              placeholder="0"
              value={values.initialCredits}
              onChange={set('initialCredits')}
              className="tabular"
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}
