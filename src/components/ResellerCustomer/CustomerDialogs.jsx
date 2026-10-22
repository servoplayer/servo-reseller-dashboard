import { useEffect, useState } from 'react'
import { ArrowRight, Zap } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Field, Input } from '../ui/Field'
import { Callout } from '../ui/States'
import { cx } from '../ui/cx'
import { customersApi } from '../../lib/services'
import { invalidate } from '../../lib/resource'
import { notify } from '../../lib/notify'
import { creditsOf, PACKAGES, useInfo } from '../../lib/dashboardData'
import { formatMacInput, formatNumber } from '../../lib/format'

/**
 * New subscription for a customer device. Uses credits from the reseller's
 * balance, so the cost and the balance afterwards are shown before confirming.
 */
export function ActivateDialog({ open, initialMac = '', onClose, onDone }) {
  const info = useInfo()
  const credits = creditsOf(info.data)
  const [mac, setMac] = useState('')
  const [pkg, setPkg] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setMac(formatMacInput(initialMac))
      setPkg('')
      setErrors({})
    }
  }, [open, initialMac])

  const selected = PACKAGES.find((p) => p.value === pkg)
  const hasBalance = credits !== undefined && credits !== null
  const after = hasBalance && selected ? Number(credits) - selected.credits : null

  const submit = async () => {
    const found = {}
    if (!mac) found.mac = 'MAC address is required.'
    if (!pkg) found.pkg = 'Choose a package.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSubmitting(true)
    const res = await customersApi.activate(mac, pkg)
    setSubmitting(false)
    if (!res.ok) {
      // Input is kept so the reseller can correct it and retry.
      notify.error(res.message)
      return
    }
    notify.success(res.message || `Activated ${mac}.`)
    invalidate('info', 'customers')
    onDone?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={submit}
      title="New activation"
      description="Activate Servo on a customer's device using your credits."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" icon={Zap} loading={submitting}>
            {selected ? `Activate · ${selected.credits} credit${selected.credits > 1 ? 's' : ''}` : 'Activate'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="MAC address" required error={errors.mac} hint="Shown on the customer's TV in the Servo app.">
          {(p) => (
            <Input
              {...p}
              value={mac}
              onChange={(e) => {
                setMac(formatMacInput(e.target.value))
                if (errors.mac) setErrors((er) => ({ ...er, mac: undefined }))
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="aa:bb:cc:dd:ee:ff"
              className="font-mono"
            />
          )}
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-fg">
            Package<span className="ml-0.5 text-danger" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {PACKAGES.map((p) => {
              const active = pkg === p.value
              return (
                <label
                  key={p.value}
                  className={cx(
                    'flex cursor-pointer flex-col rounded-lg border px-3.5 py-3 transition-colors',
                    'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand',
                    active ? 'border-brand bg-brand-soft' : 'border-line-strong hover:border-subtle',
                  )}
                >
                  <input
                    type="radio"
                    name="package"
                    value={p.value}
                    checked={active}
                    onChange={() => {
                      setPkg(p.value)
                      if (errors.pkg) setErrors((er) => ({ ...er, pkg: undefined }))
                    }}
                    className="sr-only"
                  />
                  <span className={cx('text-sm font-bold', active ? 'text-brand' : 'text-fg')}>{p.label}</span>
                  <span className="text-xs text-muted">
                    {p.credits} credit{p.credits > 1 ? 's' : ''}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.pkg && <p className="mt-1.5 text-xs font-medium text-danger">{errors.pkg}</p>}
        </fieldset>

        {hasBalance && (
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[13px]">
            <span className="text-muted">Balance</span>
            <span className="flex items-center gap-2 font-semibold tabular text-fg">
              {formatNumber(credits)}
              {after !== null && (
                <>
                  <ArrowRight size={14} className="text-subtle" aria-hidden="true" />
                  <span className={after < 0 ? 'text-danger' : ''}>{formatNumber(after)}</span>
                </>
              )}
              <span className="font-normal text-muted">credits</span>
            </span>
          </div>
        )}
        {after !== null && after < 0 && (
          <Callout tone="warning" title="Not enough credits">
            This package needs {selected.credits} credits and you have {formatNumber(credits)}. The server will reject the activation.
          </Callout>
        )}
      </div>
    </Modal>
  )
}

/** Replaces a playlist host across the reseller's customers (`/reseller/changeHost`). */
export function ChangeHostDialog({ open, onClose, onDone }) {
  const [oldHost, setOldHost] = useState('')
  const [newHost, setNewHost] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setOldHost('')
      setNewHost('')
      setErrors({})
    }
  }, [open])

  const submit = async () => {
    const found = {}
    if (!oldHost.trim()) found.oldHost = 'Old URL is required.'
    if (!newHost.trim()) found.newHost = 'New URL is required.'
    else if (newHost.trim() === oldHost.trim()) found.newHost = 'The new URL must be different from the old one.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSubmitting(true)
    const res = await customersApi.changeHost(oldHost.trim(), newHost.trim())
    setSubmitting(false)
    if (!res.ok) {
      notify.error(res.message)
      return
    }
    notify.success(res.message || 'Playlist URL replaced.')
    invalidate('customers')
    onDone?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={submit}
      title="Replace playlist URL"
      description="Changes the playlist host for your customers who use the old URL. Check both values carefully before saving."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>Replace URL</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Old URL" required error={errors.oldHost}>
          {(p) => (
            <Input {...p} value={oldHost} onChange={(e) => setOldHost(e.target.value)} spellCheck={false} placeholder="http://old-host.com:8080" className="font-mono text-[13px]" />
          )}
        </Field>
        <Field label="New URL" required error={errors.newHost}>
          {(p) => (
            <Input {...p} value={newHost} onChange={(e) => setNewHost(e.target.value)} spellCheck={false} placeholder="http://new-host.com:8080" className="font-mono text-[13px]" />
          )}
        </Field>
      </div>
    </Modal>
  )
}
