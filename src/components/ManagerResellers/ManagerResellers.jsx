import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CornerDownRight, History, Plus, Users } from 'lucide-react'
import { Card, PageHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { SearchInput } from '../ui/Field'
import { EmptyState, ErrorState } from '../ui/States'
import { SkeletonRows, Table, TableMessage, Td, Th, Tr } from '../ui/Table'
import { cx } from '../ui/cx'
import RechargeDialog from './RechargeDialog'
import NewResellerDialog from './NewResellerDialog'
import { useManagedResellers } from '../../lib/dashboardData'
import { formatDate, formatNumber } from '../../lib/format'

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'main', label: 'Main' },
  { value: 'sub', label: 'Sub-resellers' },
]

/** Distributor manager home: reseller balances with a recharge action. */
export default function ManagerResellers() {
  const resellers = useManagedResellers()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [target, setTarget] = useState(null)
  const [creating, setCreating] = useState(false)

  const all = resellers.data?.resellers ?? []
  const q = search.trim().toLowerCase()
  const rows = all.filter(
    (r) =>
      (type === 'all' || r.type === type) &&
      (!q || [r.userName, r.email, r.parentName].some((v) => v?.toLowerCase().includes(q))),
  )
  const held = all.reduce((acc, r) => acc + (Number(r.subscriptionsNum) || 0), 0)

  return (
    <>
      <PageHeader
        title="Resellers"
        description={
          resellers.loading || resellers.error
            ? 'Create resellers, recharge their balances and review their credit history.'
            : `${formatNumber(all.length)} resellers · ${formatNumber(held)} credits held in total`
        }
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>New reseller</Button>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or parent" className="w-full sm:max-w-sm" />
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by type">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={type === t.value}
                onClick={() => setType(t.value)}
                className={cx(
                  'h-8 rounded-full px-3 text-[13px] font-semibold transition-colors',
                  type === t.value ? 'bg-brand text-brand-fg' : 'bg-surface-2 text-muted ring-1 ring-inset ring-line hover:text-fg',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Table caption="Resellers" minWidth={0}>
          <thead>
            <tr>
              <Th>Reseller</Th>
              <Th className="hidden md:table-cell">Type</Th>
              <Th align="right">Balance</Th>
              <Th className="hidden lg:table-cell">Created</Th>
              <Th className="hidden sm:table-cell">Status</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {resellers.loading ? (
              <SkeletonRows cols={6} />
            ) : resellers.error ? (
              <TableMessage cols={6}>
                <ErrorState message={resellers.error} onRetry={resellers.reload} />
              </TableMessage>
            ) : rows.length === 0 ? (
              <TableMessage cols={6}>
                <EmptyState
                  icon={Users}
                  title={all.length ? 'No matching resellers' : 'No resellers yet'}
                  description={all.length ? 'Try a different search or filter.' : 'Create the first reseller to get started.'}
                  action={all.length ? undefined : <Button size="sm" icon={Plus} onClick={() => setCreating(true)}>New reseller</Button>}
                />
              </TableMessage>
            ) : (
              rows.map((r) => (
                <Tr key={r._id}>
                  <Td>
                    <p className="truncate font-semibold">{r.userName || r.email}</p>
                    <p className="truncate text-xs text-muted">{r.email}</p>
                    {r.parentName && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted md:hidden">
                        <CornerDownRight size={12} aria-hidden="true" /> under {r.parentName}
                      </p>
                    )}
                    {r.block && <Badge tone="danger" className="mt-1 sm:hidden">Blocked</Badge>}
                  </Td>
                  <Td className="hidden md:table-cell">
                    {r.type === 'sub' ? <Badge tone="info" dot={false}>Sub-reseller</Badge> : <Badge tone="brand" dot={false}>Main</Badge>}
                    {r.parentName && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <CornerDownRight size={12} aria-hidden="true" /> {r.parentName}
                      </span>
                    )}
                  </Td>
                  <Td align="right" className="font-semibold tabular">{formatNumber(r.subscriptionsNum)}</Td>
                  <Td className="hidden whitespace-nowrap text-muted lg:table-cell">{formatDate(r.currentDate)}</Td>
                  <Td className="hidden sm:table-cell">{r.block ? <Badge tone="danger">Blocked</Badge> : <Badge tone="success">Active</Badge>}</Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/layout/credit-history?reseller=${r._id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                        aria-label={`Credit history for ${r.userName}`}
                        title="Credit history"
                      >
                        <History size={15} />
                      </Link>
                      <Button
                        size="sm"
                        icon={Plus}
                        onClick={() => setTarget(r)}
                        disabled={r.block}
                        title={r.block ? 'Blocked accounts cannot be recharged' : undefined}
                        aria-label={`Recharge ${r.userName}`}
                      >
                        <span className="max-sm:sr-only">Recharge</span>
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      <RechargeDialog reseller={target} onClose={() => setTarget(null)} />
      <NewResellerDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
