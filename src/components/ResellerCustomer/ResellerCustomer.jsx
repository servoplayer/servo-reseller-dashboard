import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Plus, Replace, Users } from 'lucide-react'
import { Card, PageHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { SearchInput } from '../ui/Field'
import { EmptyState, ErrorState } from '../ui/States'
import { Pagination, SkeletonRows, Table, TableMessage, Td, Th, Tr } from '../ui/Table'
import { ActivateDialog, ChangeHostDialog } from './CustomerDialogs'
import usePagedList from '../../lib/usePagedList'
import { customersApi } from '../../lib/services'
import { customerStatus, formatDate, isLifetime, packageLabel, relativeDays } from '../../lib/format'

const pick = (data) => ({ items: data?.subscriptions, totalPages: data?.totalPages })

export default function ResellerCustomer() {
  const { state } = useLocation()
  const [params, setParams] = useSearchParams()
  const list = usePagedList({
    list: customersApi.list,
    search: customersApi.searchByMac,
    pick,
    getType: () => null,
  })
  const [activate, setActivate] = useState({ open: false, mac: '' })
  const [hostOpen, setHostOpen] = useState(false)

  // Deep links from the dashboard: ?new=1[&mac=...] opens the activation
  // dialog, ?host=1 opens the replace-URL dialog.
  useEffect(() => {
    const wantsNew = params.get('new') === '1'
    const wantsHost = params.get('host') === '1'
    if (wantsNew || wantsHost) {
      if (wantsNew) setActivate({ open: true, mac: params.get('mac') ?? '' })
      if (wantsHost) setHostOpen(true)
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('new')
        next.delete('mac')
        next.delete('host')
        return next
      }, { replace: true })
    }
  }, [params, setParams])

  return (
    <>
      <PageHeader
        title="Customers"
        description="Devices you have activated. Search by MAC address or start a new activation."
        actions={
          <>
            <Button variant="secondary" icon={Replace} onClick={() => setHostOpen(true)}>Replace URL</Button>
            <Button icon={Plus} onClick={() => setActivate({ open: true, mac: '' })}>New activation</Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <SearchInput
            value={list.query}
            onChange={list.setQuery}
            placeholder="Search by MAC address"
            loading={list.pendingQuery || (list.searching && list.loading)}
            className="w-full sm:max-w-sm"
            autoFocus={Boolean(state?.focusSearch) || Boolean(list.query)}
          />
          {list.searching && !list.loading && !list.error && (
            <p className="text-xs text-muted">
              {list.items.length} match{list.items.length === 1 ? '' : 'es'} for “{list.query.trim()}”
            </p>
          )}
        </div>
        <Table caption="Customers" minWidth={0}>
          <thead>
            <tr>
              <Th>MAC address</Th>
              <Th className="hidden sm:table-cell">Package</Th>
              <Th className="hidden sm:table-cell">Expiry date</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {list.loading ? (
              <SkeletonRows cols={4} />
            ) : list.error ? (
              <TableMessage cols={4}>
                <ErrorState message={list.error} onRetry={list.reload} />
              </TableMessage>
            ) : list.items.length === 0 ? (
              <TableMessage cols={4}>
                {list.searching ? (
                  <EmptyState title="No matching customers" description="Check the MAC address and try again." />
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No subscriptions found yet"
                    description="Activate your first customer's device to see it here."
                    action={<Button size="sm" icon={Plus} onClick={() => setActivate({ open: true, mac: '' })}>New activation</Button>}
                  />
                )}
              </TableMessage>
            ) : (
              list.items.map((item, i) => {
                const status = customerStatus(item)
                const lifetime = isLifetime(item.subscriptionEndDate)
                return (
                  <Tr key={item._id ?? i}>
                    <Td>
                      <span className="block font-mono text-[13px] font-semibold">{item.userId?.macAddress ?? '—'}</span>
                      {/* Package and expiry collapse under the MAC address on small screens. */}
                      <span className="mt-0.5 block text-xs text-muted sm:hidden">
                        {packageLabel(item.subscriptionEndDate)} · {lifetime ? 'never expires' : `expires ${formatDate(item.subscriptionEndDate)}`}
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell">
                      <Badge tone={lifetime ? 'brand' : 'neutral'} dot={false}>{packageLabel(item.subscriptionEndDate)}</Badge>
                    </Td>
                    <Td className="hidden whitespace-nowrap sm:table-cell">
                      {lifetime ? (
                        <span className="text-muted">Never</span>
                      ) : (
                        <>
                          <span className="block text-[13px]">{formatDate(item.subscriptionEndDate)}</span>
                          <span className="block text-xs text-muted">{relativeDays(item.subscriptionEndDate)}</span>
                        </>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Td>
                  </Tr>
                )
              })
            )}
          </tbody>
        </Table>
        {!list.searching && (
          <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} disabled={list.loading} />
        )}
      </Card>

      <ActivateDialog
        open={activate.open}
        initialMac={activate.mac}
        onClose={() => setActivate({ open: false, mac: '' })}
        onDone={list.reload}
      />
      <ChangeHostDialog open={hostOpen} onClose={() => setHostOpen(false)} onDone={list.reload} />
    </>
  )
}
