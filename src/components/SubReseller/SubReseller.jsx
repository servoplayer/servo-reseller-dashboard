import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, UserPlus } from 'lucide-react'
import { Card, PageHeader } from '../ui/Card'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Field, Input, PasswordInput, SearchInput } from '../ui/Field'
import { EmptyState, ErrorState } from '../ui/States'
import { SkeletonRows, Table, TableMessage, Td, Th, Tr } from '../ui/Table'
import { subResellersApi } from '../../lib/services'
import { invalidate } from '../../lib/resource'
import { notify } from '../../lib/notify'
import { creditsOf, useInfo, useSubResellers } from '../../lib/dashboardData'
import { formatDate, formatNumber } from '../../lib/format'

const EMPTY = { userName: '', email: '', password: '', subscriptionsNum: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SubResellerForm({ open, onClose }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const info = useInfo()
  const rawBalance = creditsOf(info.data)
  const available = rawBalance === undefined || rawBalance === null ? null : Number(rawBalance)

  useEffect(() => {
    if (open) {
      setValues(EMPTY)
      setErrors({})
    }
  }, [open])

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const submit = async () => {
    const found = {}
    if (!values.userName.trim()) found.userName = 'Name is required.'
    if (!values.email.trim()) found.email = 'Email is required.'
    else if (!EMAIL_RE.test(values.email.trim())) found.email = 'Enter a valid email address.'
    if (!values.password) found.password = 'Password is required.'
    if (values.subscriptionsNum === '') found.subscriptionsNum = 'Initial credits are required.'
    else if (!Number.isInteger(Number(values.subscriptionsNum)) || Number(values.subscriptionsNum) < 0)
      found.subscriptionsNum = 'Use a whole number of 0 or more.'
    // Same rule the server applies: you can only hand over credits you have.
    else if (available !== null && Number(values.subscriptionsNum) > available)
      found.subscriptionsNum = `You have ${formatNumber(available)} credits available.`
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    const res = await subResellersApi.create({
      email: values.email.trim(),
      password: values.password,
      userName: values.userName.trim(),
      subscriptionsNum: values.subscriptionsNum,
    })
    setSubmitting(false)
    if (!res.ok) {
      // This endpoint reports some failures in `error` rather than `message`.
      notify.error(res.data?.error || res.message)
      return
    }
    notify.success(res.message || 'Sub-reseller created.')
    // The parent balance may change when credits are assigned, so refresh it too.
    invalidate('subresellers', 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={submit}
      title="New sub-reseller"
      description="Create an account that can activate customers under you."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>Create sub-reseller</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required error={errors.userName}>
          {(p) => <Input {...p} value={values.userName} onChange={set('userName')} autoComplete="off" placeholder="Sub-reseller name" />}
        </Field>
        <Field label="Email" required error={errors.email}>
          {(p) => <Input {...p} type="email" value={values.email} onChange={set('email')} autoComplete="off" placeholder="name@company.com" />}
        </Field>
        <Field label="Password" required error={errors.password} hint="They use this to sign in to the reseller portal.">
          {(p) => <PasswordInput {...p} value={values.password} onChange={set('password')} autoComplete="new-password" />}
        </Field>
        <Field
          label="Initial credits"
          required
          error={errors.subscriptionsNum}
          hint={
            available === null
              ? 'Moved from your balance to the new account.'
              : `Moved from your balance · ${formatNumber(available)} credits available`
          }
        >
          {(p) => (
            <Input {...p} type="number" min="0" step="1" inputMode="numeric" value={values.subscriptionsNum} onChange={set('subscriptionsNum')} className="tabular" />
          )}
        </Field>
      </div>
    </Modal>
  )
}

export default function SubReseller() {
  const [params, setParams] = useSearchParams()
  const subs = useSubResellers()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  // Deep link from the dashboard: ?new=1 opens the form.
  useEffect(() => {
    if (params.get('new') === '1') {
      setFormOpen(true)
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('new')
        return next
      }, { replace: true })
    }
  }, [params, setParams])

  const all = subs.data?.subResellers ?? []
  const q = search.trim().toLowerCase()
  const rows = q ? all.filter((r) => r?.userName?.toLowerCase().includes(q) || r?.email?.toLowerCase().includes(q)) : all

  return (
    <>
      <PageHeader
        title="Sub-resellers"
        description="Accounts that activate customers under your reseller account."
        actions={<Button icon={Plus} onClick={() => setFormOpen(true)}>New sub-reseller</Button>}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email" className="w-full sm:max-w-sm" />
          {!subs.loading && !subs.error && (
            <p className="text-xs text-muted tabular">
              {q ? `${rows.length} of ${formatNumber(all.length)} sub-resellers` : `${formatNumber(all.length)} sub-resellers`}
            </p>
          )}
        </div>
        <Table caption="Sub-resellers" minWidth={0}>
          <thead>
            <tr>
              <Th>Sub-reseller</Th>
              <Th align="right">Credits</Th>
              <Th className="hidden sm:table-cell">Created</Th>
            </tr>
          </thead>
          <tbody>
            {subs.loading ? (
              <SkeletonRows cols={3} />
            ) : subs.error ? (
              <TableMessage cols={3}>
                <ErrorState message={subs.error} onRetry={subs.reload} />
              </TableMessage>
            ) : rows.length === 0 ? (
              <TableMessage cols={3}>
                {q ? (
                  <EmptyState title="No matching sub-resellers" description="Try a different name or email." />
                ) : (
                  <EmptyState
                    icon={UserPlus}
                    title="No sub-resellers yet"
                    description="Create a sub-reseller to let a partner activate customers under you."
                    action={<Button size="sm" icon={Plus} onClick={() => setFormOpen(true)}>New sub-reseller</Button>}
                  />
                )}
              </TableMessage>
            ) : (
              rows.map((item, i) => (
                <Tr key={item._id ?? i}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold uppercase text-brand">
                        {(item.userName || item.email || '?').charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.userName}</p>
                        <p className="truncate text-xs text-muted">{item.email}</p>
                        <p className="mt-0.5 text-xs text-muted sm:hidden">Created {formatDate(item.currentDate)}</p>
                      </div>
                    </div>
                  </Td>
                  <Td align="right" className="font-semibold tabular">{formatNumber(item.subscriptionsNum)}</Td>
                  <Td className="hidden whitespace-nowrap text-muted sm:table-cell">{formatDate(item.currentDate)}</Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
      <SubResellerForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}
