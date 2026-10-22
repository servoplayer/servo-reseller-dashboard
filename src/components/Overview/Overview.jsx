import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Coins,
  Plus,
  Replace,
  Search,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { Card, CardHeader, PageHeader } from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { EmptyState, ErrorState, Skeleton } from '../ui/States'
import { SkeletonRows, Table, TableMessage, Td, Th, Tr } from '../ui/Table'
import { cx } from '../ui/cx'
import { useShell } from '../LayOut/ShellContext'
import { creditsOf, splitByExpiry, useCustomersFirstPage, useInfo, useSubResellers } from '../../lib/dashboardData'
import { isFullReseller } from '../../lib/role'
import {
  customerStatus,
  EXPIRING_SOON_DAYS,
  formatDate,
  formatNumber,
  isLifetime,
  packageLabel,
  relativeDays,
} from '../../lib/format'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function Kpi({ label, icon: Icon, value, sub, to, loading, error, tone }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="truncate text-[13px] font-semibold text-muted">{label}</p>
        <span
          className={cx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-warning-soft text-warning' : 'bg-brand-soft text-brand',
          )}
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-7 w-20" />
          <Skeleton className="mt-2 h-3 w-32" />
        </>
      ) : error ? (
        <p className="mt-3 text-[13px] text-danger">Unavailable — {error}</p>
      ) : (
        <>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-fg tabular sm:text-2xl">{value}</p>
          {sub && <p className="mt-1 line-clamp-2 text-xs text-muted sm:truncate">{sub}</p>}
        </>
      )}
    </>
  )
  const cls = 'block min-w-0 rounded-xl border border-line bg-surface p-3.5 shadow-card transition-colors sm:p-4'
  return to ? (
    <Link to={to} className={cx(cls, 'hover:border-brand/40')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default function Overview() {
  const { info: profile } = useShell()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const info = useInfo()
  const customers = useCustomersFirstPage()
  const full = isFullReseller()
  const subs = useSubResellers(full)

  useEffect(() => {
    if (hash === '#attention') document.getElementById('attention')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const credits = creditsOf(info.data)
  const n = Number(credits)
  const creditTone = credits === undefined || credits === null ? undefined : n <= 0 ? 'danger' : n < 2 ? 'warning' : undefined
  const creditSub =
    credits === undefined || credits === null
      ? ''
      : n <= 0
        ? 'No activations possible'
        : `Enough for ${formatNumber(n)} × 1 year or ${formatNumber(Math.floor(n / 2))} × lifetime`

  const list = customers.data?.subscriptions ?? []
  const totalPages = Number(customers.data?.totalPages) || 0
  const exactTotal = customers.data?.total ?? customers.data?.totalSubscriptions ?? customers.data?.count
  const customerValue =
    exactTotal !== undefined ? formatNumber(exactTotal) : `${formatNumber(list.length)}${totalPages > 1 ? '+' : ''}`
  const activeOnPage = list.filter((s) => s.isActive).length

  const { expiring, expired } = splitByExpiry(list)
  const attention = [...expired, ...expiring]
  const lowCredits = creditTone !== undefined

  const quickActions = [
    { label: 'New activation', hint: 'Activate a customer device', icon: Plus, to: '/layout/resellerCustomer?new=1' },
    { label: 'Find a customer', hint: 'Search by MAC address', icon: Search, to: '/layout/resellerCustomer', state: { focusSearch: true } },
    { label: 'Replace playlist URL', hint: 'Move customers to a new host', icon: Replace, to: '/layout/resellerCustomer?host=1' },
    ...(full ? [{ label: 'Add a sub-reseller', hint: 'Create a partner account', icon: UserPlus, to: '/layout/subReseller?new=1' }] : []),
  ]

  return (
    <>
      <PageHeader
        title={`${greeting()}${profile?.userName ? `, ${profile.userName}` : ''}`}
        description="Your balance, customers that need attention, and your latest activations."
        actions={
          <Button icon={Plus} onClick={() => navigate('/layout/resellerCustomer?new=1')}>
            New activation
          </Button>
        }
      />

      <div className={cx('grid grid-cols-2 gap-3', full ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
        <Kpi
          label="Available credits"
          icon={Coins}
          loading={info.loading}
          error={info.error}
          tone={creditTone}
          value={formatNumber(credits)}
          sub={creditSub}
        />
        <Kpi
          label="Customers"
          icon={Users}
          to="/layout/resellerCustomer"
          loading={customers.loading}
          error={customers.error}
          value={customerValue}
          sub={totalPages > 1 ? `${totalPages} pages · ${activeOnPage} of ${list.length} active on page 1` : `${activeOnPage} active`}
        />
        <Kpi
          label="Expiring soon"
          icon={CalendarClock}
          to="/layout#attention"
          loading={customers.loading}
          error={customers.error}
          tone={expired.length ? 'danger' : expiring.length ? 'warning' : undefined}
          value={formatNumber(expiring.length + expired.length)}
          sub={`Expired or within ${EXPIRING_SOON_DAYS} days, page 1`}
        />
        {full && (
          <Kpi
            label="Sub-resellers"
            icon={UserPlus}
            to="/layout/subReseller"
            loading={subs.loading}
            error={subs.error}
            value={formatNumber(subs.data?.subResellers?.length ?? 0)}
            sub="Accounts under you"
          />
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Card id="attention" className="scroll-mt-24">
            <CardHeader
              icon={CalendarClock}
              title="Needs attention"
              description={`Low balance, and subscriptions expired or expiring within ${EXPIRING_SOON_DAYS} days on the first page of customers.`}
            />
            {customers.loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : customers.error ? (
              <ErrorState message={customers.error} onRetry={customers.reload} className="py-8" />
            ) : attention.length === 0 && !lowCredits ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nothing needs attention"
                description="Your balance is healthy and no customers on the first page are expiring soon."
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-line">
                {lowCredits && (
                  <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span
                      className={cx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        creditTone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning',
                      )}
                    >
                      <Coins size={15} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-fg">
                        {n <= 0 ? 'No credits left' : `Low balance: ${formatNumber(n)} credit left`}
                      </p>
                      <p className="text-xs text-muted">
                        {n <= 0
                          ? 'Ask your account administrator to add credits before activating customers.'
                          : 'Enough for a 1-year activation only. Lifetime activations use 2 credits.'}
                      </p>
                    </div>
                  </li>
                )}
                {attention.map((s) => {
                  const status = customerStatus(s)
                  const mac = s.userId?.macAddress
                  return (
                    <li key={s._id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <span
                        className={cx(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          status.tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning',
                        )}
                      >
                        {status.tone === 'danger' ? <CircleAlert size={15} aria-hidden="true" /> : <CalendarClock size={15} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[13px] font-semibold text-fg">{mac ?? '—'}</p>
                        <p className="text-xs text-muted">
                          {status.tone === 'danger' ? 'Ended' : 'Ends'} {formatDate(s.subscriptionEndDate)} ({relativeDays(s.subscriptionEndDate)})
                        </p>
                      </div>
                      <Badge tone={status.tone} className="hidden sm:inline-flex">{status.label}</Badge>
                      {mac && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Zap}
                          onClick={() => navigate(`/layout/resellerCustomer?new=1&mac=${encodeURIComponent(mac)}`)}
                          aria-label={`Activate ${mac} again`}
                        >
                          <span className="max-sm:sr-only">Activate again</span>
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              icon={Users}
              title="Recent activations"
              description="Latest customers on your account."
              actions={
                <Link to="/layout/resellerCustomer" className="flex items-center gap-1 text-[13px] font-semibold text-brand hover:underline">
                  View all <ArrowRight size={14} aria-hidden="true" />
                </Link>
              }
            />
            <Table caption="Recent activations" minWidth={0}>
              <thead>
                <tr>
                  <Th>MAC address</Th>
                  <Th className="hidden sm:table-cell">Package</Th>
                  <Th className="hidden sm:table-cell">Expiry date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {customers.loading ? (
                  <SkeletonRows rows={5} cols={4} />
                ) : customers.error ? (
                  <TableMessage cols={4}>
                    <ErrorState message={customers.error} onRetry={customers.reload} />
                  </TableMessage>
                ) : list.length === 0 ? (
                  <TableMessage cols={4}>
                    <EmptyState title="No subscriptions found yet" description="Your customers appear here after their first activation." />
                  </TableMessage>
                ) : (
                  list.slice(0, 8).map((s, i) => {
                    const status = customerStatus(s)
                    const lifetime = isLifetime(s.subscriptionEndDate)
                    return (
                      <Tr key={s._id ?? i}>
                        <Td>
                          <span className="block font-mono text-[13px]">{s.userId?.macAddress ?? '—'}</span>
                          <span className="mt-0.5 block text-xs text-muted sm:hidden">
                            {packageLabel(s.subscriptionEndDate)} · {lifetime ? 'never expires' : formatDate(s.subscriptionEndDate)}
                          </span>
                        </Td>
                        <Td className="hidden sm:table-cell">
                          <Badge tone={lifetime ? 'brand' : 'neutral'} dot={false}>{packageLabel(s.subscriptionEndDate)}</Badge>
                        </Td>
                        <Td className="hidden whitespace-nowrap text-muted sm:table-cell">
                          {lifetime ? 'Never' : formatDate(s.subscriptionEndDate)}
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
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="Quick actions" description="Jump straight into frequent tasks." />
          <ul className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((a) => (
              <li key={a.label}>
                <Link
                  to={a.to}
                  state={a.state}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                    <a.icon size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-fg">{a.label}</span>
                    <span className="block truncate text-xs text-muted">{a.hint}</span>
                  </span>
                  <ArrowRight size={15} className="text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

