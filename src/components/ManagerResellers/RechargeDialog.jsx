import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Field, Input, Textarea } from '../ui/Field'
import { distributorApi } from '../../lib/services'
import { invalidate } from '../../lib/resource'
import { notify } from '../../lib/notify'
import { formatNumber } from '../../lib/format'
import { MAX_RECHARGE, newIdempotencyKey, rechargeAmountError } from '../../lib/credits'

/** Adds credits to one reseller through POST /distributor/recharge. */
export default function RechargeDialog({ reseller, onClose }) {
  const open = Boolean(reseller)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Kept for the whole dialog session so a retry after a failed request is deduplicated by the API.
  const keyRef = useRef('')

  useEffect(() => {
    if (open) {
      setAmount('')
      setNote('')
      setError('')
      keyRef.current = newIdempotencyKey()
    }
  }, [open, reseller?._id])

  const balance = Number(reseller?.subscriptionsNum) || 0
  const amountError = rechargeAmountError(amount)
  const after = amountError ? null : balance + Number(amount)

  const submit = async () => {
    if (busy) return
    if (amountError) return setError(amountError)
    setBusy(true)
    const res = await distributorApi.recharge(reseller._id, Number(amount), keyRef.current, note.trim())
    setBusy(false)
    if (!res.ok) {
      // Inputs and the idempotency key are kept, so trying again cannot double-credit.
      notify.error(res.message)
      return
    }
    const tx = res.data?.transaction
    if (res.data?.duplicate) notify.info(res.message)
    else notify.success(`Added ${formatNumber(tx?.amount)} credits to ${reseller.userName}. Reference ${tx?.reference}.`)
    invalidate('dm-resellers', 'dm-tx')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      onSubmit={submit}
      size="sm"
      title="Recharge credits"
      description={reseller ? `${reseller.userName} · ${reseller.email}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" loading={busy}>Add credits</Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line text-[13px]">
          <div className="bg-surface-2 px-3 py-2">
            <dt className="text-xs text-muted">Current balance</dt>
            <dd className="font-bold text-fg tabular">{formatNumber(balance)}</dd>
          </div>
          <div className="bg-surface-2 px-3 py-2">
            <dt className="text-xs text-muted">After recharge</dt>
            <dd className="font-bold text-fg tabular">{after === null ? '—' : formatNumber(after)}</dd>
          </div>
        </dl>
        <Field label="Credits to add" required error={error} hint={`Whole number, 1 to ${MAX_RECHARGE.toLocaleString()}.`}>
          {(p) => (
            <Input
              {...p}
              type="number"
              min="1"
              max={MAX_RECHARGE}
              step="1"
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
              className="tabular"
            />
          )}
        </Field>
        <Field label="Note" hint="Optional, e.g. payment method or receipt number. Visible to staff only.">
          {(p) => <Textarea {...p} rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
    </Modal>
  )
}
