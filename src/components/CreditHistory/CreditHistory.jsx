import { useSearchParams } from 'react-router-dom'
import { History } from 'lucide-react'
import { Card, PageHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import { EmptyState, ErrorState } from '../ui/States'
import { Pagination, SkeletonRows, Table, TableMessage, Td, Th, Tr } from '../ui/Table'
import { cx } from '../ui/cx'
import { useManagedResellers } from '../../lib/dashboardData'
import { useResource } from '../../lib/resource'
import { creditsApi, distributorApi } from '../../lib/services'
import { isDistributorManager } from '../../lib/role'
import { formatDate, formatNumber } from '../../lib/format'
import { actorLabel, signedAmount } from '../../lib/credits'

const STATUS = {
  succeeded: { tone: 'success', label: 'Completed' },
  failed: { tone: 'danger', label: 'Failed' },
  pending: { tone: 'warning', label: 'Processing' },
}

function ResellerFilter({ value, onChange }) {
  const resellers = useManagedResellers()
  const list = resellers.data?.resellers ?? []
  return (
    <label className="flex items-center gap-2 text-[13px] font-medium text-muted">
      Reseller
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-0 max-w-[240px] rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
      >
        <option value="">All resellers</option>
        {list.map((r) => (
          <option key={r._id} value={r._id}>{r.userName || r.email}</option>
        ))}
      </select>
    </label>
  )
}

/**
 * Credit ledger. A distributor manager sees every reseller's recharges (with an
 * optional reseller filter); a reseller sees only their own balance changes.
 */
export default function CreditHistory() {
  const manager = isDistributorManager()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const resellerId = manager ? params.get('reseller') ?? '' : ''

  const history = useResource(`dm-tx:${manager ? 'all' : 'mine'}:${resellerId}:${page}`, () =>
    manager ? distributorApi.transactions(page, resellerId || undefined) : creditsApi.mine(page),
  )
  const rows = history.data?.transactions ?? []
  const cols = manager ? 7 : 5

  const setParam = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!value || value === 1) next.delete(key)
      else next.set(key, value)
      if (key !== 'page') next.delete('page')
      return next
    })

  return (
    <>
      <PageHeader
        title="Credit history"
        description={
          manager
            ? 'Every recorded credit change: who made it, for which reseller, and the resulting balance.'
            : 'Credits added to or removed from your balance by Servo staff.'
        }
      />
      <Card>
        {manager && (
          <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <ResellerFilter value={resellerId} onChange={(v) => setParam('reseller', v)} />
            {!history.loading && !history.error && (
              <p className="text-xs text-muted tabular">{formatNumber(history.data?.totalItems ?? rows.length)} records</p>
            )}
          </div>
        )}
        <Table caption="Credit history" minWidth={0}>
          <thead>
            <tr>
              <Th>Date</Th>
              {manager && <Th>Reseller</Th>}
              <Th align="right">Change</Th>
              <Th align="right" className="hidden sm:table-cell">Balance after</Th>
              <Th className="hidden md:table-cell">By</Th>
              <Th className="hidden lg:table-cell">Reference</Th>
              {manager && <Th>Status</Th>}
            </tr>
          </thead>
          <tbody>
            {history.loading ? (
              <SkeletonRows cols={cols} />
            ) : history.error ? (
              <TableMessage cols={cols}>
                <ErrorState message={history.error} onRetry={history.reload} />
              </TableMessage>
            ) : rows.length === 0 ? (
              <TableMessage cols={cols}>
                <EmptyState
                  icon={History}
                  title="No credit changes recorded yet"
                  description={
                    manager
                      ? 'Recharges appear here as soon as they are made. Changes made before this history existed are not listed.'
                      : 'When Servo staff add credits to your balance, they appear here.'
                  }
                />
              </TableMessage>
            ) : (
              rows.map((tx) => {
                const status = STATUS[tx.status] ?? STATUS.pending
                const done = tx.status === 'succeeded'
                return (
                  <Tr key={tx._id}>
                    <Td className="whitespace-nowrap">
                      <span className="block text-[13px]">{formatDate(tx.createdAt, { withTime: true })}</span>
                      <span className="block font-mono text-2xs text-muted lg:hidden">{tx.reference}</span>
                    </Td>
                    {manager && (
                      <Td>
                        <span className="block truncate font-semibold">{tx.resellerName ?? '—'}</span>
                        {tx.note && <span className="block max-w-[260px] truncate text-xs text-muted" title={tx.note}>{tx.note}</span>}
                      </Td>
                    )}
                    <Td
                      align="right"
                      className={cx('font-bold tabular', !done ? 'text-muted line-through' : tx.type === 'deduction' ? 'text-danger' : 'text-success')}
                    >
                      {signedAmount(tx)}
                    </Td>
                    <Td align="right" className="hidden tabular sm:table-cell">{done ? formatNumber(tx.balanceAfter) : '—'}</Td>
                    <Td className="hidden md:table-cell">
                      <span className="block text-[13px]">{manager && tx.actorName ? tx.actorName : actorLabel(tx.actorRole)}</span>
                      {manager && tx.actorName && <span className="block text-xs text-muted">{actorLabel(tx.actorRole)}</span>}
                    </Td>
                    <Td className="hidden font-mono text-xs text-muted lg:table-cell">{tx.reference}</Td>
                    {manager && (
                      <Td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {tx.error && <span className="mt-0.5 block text-xs text-muted">{tx.error}</span>}
                      </Td>
                    )}
                  </Tr>
                )
              })
            )}
          </tbody>
        </Table>
        <Pagination page={page} totalPages={Number(history.data?.totalPages) || 0} onChange={(p) => setParam('page', p)} disabled={history.loading} />
      </Card>
    </>
  )
}
