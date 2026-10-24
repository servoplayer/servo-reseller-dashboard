import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound, Plus } from 'lucide-react'
import { Card, PageHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { Field, Input, SearchInput } from '../ui/Field'
import { EmptyState, ErrorState } from '../ui/States'
import { Pagination, SkeletonRows, Table, TableMessage, Td, Th, Tr } from '../ui/Table'
import usePagedList from '../../lib/usePagedList'
import { providerApi } from '../../lib/services'
import { invalidate } from '../../lib/resource'
import { notify } from '../../lib/notify'
import { creditsOf, useInfo } from '../../lib/dashboardData'
import { formatDate, formatDeviceType, formatNumber } from '../../lib/format'

const pick = (data) => ({ items: data?.subscriptions, totalPages: data?.totalPages })

function CodeCell({ code }) {
  const [copied, setCopied] = useState(false)
  if (!code) return <span className="text-subtle">—</span>
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard can be blocked; the code is still visible.
    }
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-[13px] font-semibold">{code}</span>
      <button
        type="button"
        onClick={copy}
        className="flex h-7 w-7 items-center justify-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg"
        aria-label={copied ? 'Copied' : `Copy code ${code}`}
      >
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
      </button>
    </span>
  )
}

function GenerateCodeDialog({ open, onClose, onDone }) {
  const [playlist, setPlaylist] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setPlaylist('')
      setError('')
    }
  }, [open])

  const submit = async () => {
    if (!playlist.trim()) return setError('Playlist URL is required.')
    setSubmitting(true)
    const res = await providerApi.generateCode(playlist.trim())
    setSubmitting(false)
    if (!res.ok) {
      notify.error(res.message)
      return
    }
    notify.success(res.message || 'Code generated.')
    invalidate('info', 'stats')
    onDone?.()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      onSubmit={submit}
      title="Generate code"
      description="Creates an activation code linked to a playlist. Uses 1 credit."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>Generate · 1 credit</Button>
        </>
      }
    >
      <Field label="Playlist URL" required error={error}>
        {(p) => (
          <Input
            {...p}
            value={playlist}
            onChange={(e) => {
              setPlaylist(e.target.value)
              setError('')
            }}
            spellCheck={false}
            placeholder="http://host.com/get.php?username=…"
            className="font-mono text-[13px]"
          />
        )}
      </Field>
    </Modal>
  )
}

export default function Provider() {
  const info = useInfo()
  const list = usePagedList({ list: providerApi.list, search: providerApi.searchByMac, pick, getType: () => null })
  const [open, setOpen] = useState(false)
  const credits = creditsOf(info.data)

  return (
    <>
      <PageHeader
        title="Provider codes"
        description={
          credits !== undefined && credits !== null
            ? `Activation codes linked to playlists. ${formatNumber(credits)} credits available.`
            : 'Activation codes linked to playlists.'
        }
        actions={<Button icon={Plus} onClick={() => setOpen(true)}>Generate code</Button>}
      />
      <Card>
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <SearchInput
            value={list.query}
            onChange={list.setQuery}
            placeholder="Search by MAC address"
            loading={list.pendingQuery || (list.searching && list.loading)}
            className="w-full sm:max-w-sm"
          />
        </div>
        <Table caption="Provider codes" minWidth={0}>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th className="hidden sm:table-cell">MAC address</Th>
              <Th className="hidden md:table-cell">Device</Th>
              <Th className="hidden md:table-cell">Expiry date</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {list.loading ? (
              <SkeletonRows cols={5} />
            ) : list.error ? (
              <TableMessage cols={5}>
                <ErrorState message={list.error} onRetry={list.reload} />
              </TableMessage>
            ) : list.items.length === 0 ? (
              <TableMessage cols={5}>
                <EmptyState
                  icon={KeyRound}
                  title={list.searching ? 'No matching codes' : 'No codes yet'}
                  description={list.searching ? 'Check the MAC address and try again.' : 'Generate a code to share a playlist with a customer.'}
                />
              </TableMessage>
            ) : (
              list.items.map((item, i) => (
                <Tr key={item._id ?? i}>
                  <Td>
                    <CodeCell code={item?.code} />
                    <span className="block font-mono text-xs text-muted sm:hidden">{item?.userId?.macAddress ?? 'Not used yet'}</span>
                  </Td>
                  <Td className="hidden font-mono text-[13px] sm:table-cell">{item?.userId?.macAddress ?? <span className="font-sans text-subtle">Not used yet</span>}</Td>
                  <Td className="hidden text-muted md:table-cell">{formatDeviceType(item?.userId?.type)}</Td>
                  <Td className="hidden whitespace-nowrap md:table-cell">{item?.userId?.endDate ? formatDate(item.userId.endDate) : '—'}</Td>
                  <Td>
                    {item?.userId?.isSubscribed ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Not active</Badge>}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
        {!list.searching && (
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} disabled={list.loading} />
        )}
      </Card>
      <GenerateCodeDialog open={open} onClose={() => setOpen(false)} onDone={list.reload} />
    </>
  )
}
