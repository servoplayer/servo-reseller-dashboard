import { useState } from 'react'
import { BarChart3, PieChart, ServerCog } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, ErrorState, Skeleton } from '../ui/States'
import { ColumnChart, StatusBreakdown } from '../ui/Charts'
import { cx } from '../ui/cx'
import { useStats } from '../../lib/dashboardData'
import { monthLabel } from '../../lib/chartScale'
import { formatNumber } from '../../lib/format'

const MEASURES = [
  { value: 'count', label: 'Activations', unit: 'activations' },
  { value: 'credits', label: 'Credits used', unit: 'credits' },
]

/** Shown instead of a chart when the stats endpoint is not available on the server yet. */
function StatsUnavailable({ stats }) {
  if (stats.status === 404) {
    return (
      <EmptyState
        icon={ServerCog}
        title="Charts are not available yet"
        description="They appear once the Servo server is updated. Everything else keeps working."
        className="py-8"
      />
    )
  }
  return <ErrorState message={stats.error} onRetry={stats.reload} className="py-8" />
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div className="flex rounded-lg bg-surface-2 p-0.5 ring-1 ring-inset ring-line" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'h-7 rounded-md px-2.5 text-xs font-semibold transition-colors',
            value === o.value ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function OverviewCharts() {
  const stats = useStats()
  const [measure, setMeasure] = useState('count')
  const m = MEASURES.find((x) => x.value === measure)
  const subs = stats.data?.subscriptions
  const monthly = subs?.monthly ?? []

  const columns = monthly.map((row) => {
    const label = monthLabel(row.month)
    return {
      key: row.month,
      label: label.long,
      short: label.short,
      value: Number(row[measure]) || 0,
      detail: row.lifetime ? `${formatNumber(row.lifetime)} lifetime` : undefined,
    }
  })
  const periodTotal = columns.reduce((acc, c) => acc + c.value, 0)

  return (
    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader
          icon={BarChart3}
          title={`${m.label} per month`}
          description={
            measure === 'credits'
              ? 'Credits spent on your activations: 1 per 1-year, 2 per lifetime. Credits given to sub-resellers are not included.'
              : 'Customers you activated in the last 6 months, including provider-code activations.'
          }
          actions={<Segmented value={measure} onChange={setMeasure} options={MEASURES} label="Chart measure" />}
        />
        <div className="p-4 sm:p-5">
          {stats.loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : stats.error ? (
            <StatsUnavailable stats={stats} />
          ) : (
            <>
              <p className="mb-4 text-[13px] text-muted">
                <span className="text-lg font-bold text-fg tabular">{formatNumber(periodTotal)}</span> {m.unit} in this period
              </p>
              <ColumnChart height={220} data={columns} unit={m.unit} format={formatNumber} caption={`${m.label} per month`} />
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader icon={PieChart} title="Customer status" description="Every subscription you activated, as of today." />
        <div className="p-4 sm:p-5">
          {stats.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : stats.error ? (
            <StatsUnavailable stats={stats} />
          ) : !subs?.total ? (
            <EmptyState title="No customers yet" description="Activate your first customer to see their status here." className="py-6" />
          ) : (
            <>
              <p className="mb-4 text-[13px] text-muted">
                <span className="text-lg font-bold text-fg tabular">{formatNumber(subs.total)}</span> activations all time
              </p>
              <StatusBreakdown
                total={subs.total}
                items={[
                  { key: 'active', label: 'Active', hint: 'End date not reached', value: subs.active, tone: 'success' },
                  { key: 'expired', label: 'Expired', hint: 'End date has passed', value: subs.expired, tone: 'danger' },
                  { key: 'stopped', label: 'Stopped', hint: 'Turned off by an administrator', value: subs.stopped, tone: 'neutral' },
                ]}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
