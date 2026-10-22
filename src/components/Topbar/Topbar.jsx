import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCheck, ChevronDown, ChevronRight, CircleAlert, Coins, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import Popover from '../ui/Popover'
import { getPageMeta } from '../Sidebar/navigation'
import { useShell } from '../LayOut/ShellContext'
import { roleLabel } from '../../lib/role'
import { formatNumber } from '../../lib/format'
import { useTheme } from '../../lib/theme'
import { logOut } from '../../lib/api'
import { cx } from '../ui/cx'

const iconBtn = 'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg'

/** Global search: finds customers by MAC address through the real customer search. */
function MacSearch() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !document.activeElement?.isContentEditable) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const q = value.trim()
    navigate(`/layout/resellerCustomer${q ? `?q=${encodeURIComponent(q)}` : ''}`)
    setValue('')
    inputRef.current?.blur()
  }

  return (
    <form onSubmit={submit} role="search" className="relative hidden w-full max-w-xs md:block">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Find customer by MAC address"
        aria-label="Find customer by MAC address"
        className="h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-9 text-sm text-fg placeholder:text-subtle focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/25 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-1.5 text-2xs font-semibold text-subtle">/</kbd>
    </form>
  )
}

function AlertsMenu() {
  const { alerts } = useShell()
  const navigate = useNavigate()
  const { unread } = alerts

  return (
    <Popover
      panelLabel="Alerts"
      className="w-[380px] max-sm:fixed max-sm:inset-x-3 max-sm:top-[60px] max-sm:w-auto"
      trigger={(p) => (
        <button type="button" {...p} className={iconBtn} aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'}>
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface dark:text-canvas">
              {unread}
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold text-fg">Alerts</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={alerts.markAllRead}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-brand hover:bg-brand-soft"
              >
                <CheckCheck size={14} aria-hidden="true" /> Mark all as read
              </button>
            )}
          </div>
          {alerts.loading && !alerts.alerts.length ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">Checking account status…</p>
          ) : alerts.alerts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold text-fg">All clear</p>
              <p className="mt-1 text-[13px] text-muted">Your balance is healthy and no customers on the first page are expiring soon.</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
              {alerts.alerts.map((a) => (
                <li key={a.id} className={cx('flex gap-3 px-4 py-3', !a.read && 'bg-brand-soft/40')}>
                  <span
                    className={cx(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      a.tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning',
                    )}
                  >
                    {a.tone === 'danger' ? <CircleAlert size={15} /> : <AlertTriangle size={15} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-fg">
                      {a.title}
                      {!a.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{a.body}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          alerts.markRead(a)
                          close()
                          navigate(a.to)
                        }}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        {a.cta}
                      </button>
                      {!a.read && (
                        <button type="button" onClick={() => alerts.markRead(a)} className="text-xs font-medium text-muted hover:text-fg">
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-4 py-2.5 text-2xs text-subtle">
            Alerts are calculated from live account data each time the dashboard loads.
          </p>
        </div>
      )}
    </Popover>
  )
}

function UserMenu() {
  const { info } = useShell()
  const initial = (info?.userName || info?.email || '').charAt(0) || '·'
  const item = 'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-fg hover:bg-surface-2'
  return (
    <Popover
      panelLabel="Account"
      className="w-60 p-1.5"
      trigger={(p) => (
        <button type="button" {...p} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 hover:bg-surface-2" aria-label="Account menu">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[13px] font-bold uppercase text-brand-fg">
            {initial}
          </span>
          <span className="hidden max-w-[140px] truncate text-[13px] font-semibold text-fg lg:block">{info?.userName}</span>
          <ChevronDown size={15} className="hidden text-muted lg:block" aria-hidden="true" />
        </button>
      )}
    >
      {() => (
        <>
          <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-[13px] font-semibold text-fg">{info?.userName || roleLabel()}</p>
            <p className="truncate text-xs text-muted">{info?.email ? `${info.email} · ${roleLabel()}` : roleLabel()}</p>
          </div>
          <div className="pt-1.5">
            <button type="button" onClick={logOut} className={cx(item, 'text-danger hover:bg-danger-soft')}>
              <LogOut size={16} aria-hidden="true" /> Log out
            </button>
          </div>
        </>
      )}
    </Popover>
  )
}

/** Always-visible credit balance; turns amber/red when low. */
function CreditPill() {
  const { info } = useShell()
  const credits = info?.subscriptionsNum
  if (credits === undefined || credits === null) return null
  const n = Number(credits)
  const tone = n <= 0 ? 'bg-danger-soft text-danger' : n < 2 ? 'bg-warning-soft text-warning' : 'bg-brand-soft text-brand'
  return (
    <Link
      to="/layout"
      className={cx('mr-1 flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold tabular', tone)}
      title="Available credits"
      aria-label={`${formatNumber(n)} credits available`}
    >
      <Coins size={15} aria-hidden="true" />
      {formatNumber(n)}
      <span className="hidden sm:inline">credits</span>
    </Link>
  )
}

export default function Topbar({ onOpenMobile }) {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const meta = getPageMeta(pathname, params)
  const { dark, toggle } = useTheme()

  useEffect(() => {
    document.title = meta.title && meta.title !== 'Servo' ? `${meta.title} · Servo Reseller` : 'Servo Reseller'
  }, [meta.title])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobile}
          className={cx(iconBtn, '-ml-1.5 lg:hidden')}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs font-medium text-subtle sm:flex">
            {meta.section && <span>{meta.section}</span>}
            {meta.parent && (
              <>
                <ChevronRight size={12} aria-hidden="true" />
                <Link to={meta.parent.to} className="hover:text-brand">{meta.parent.label}</Link>
              </>
            )}
          </nav>
          <p className="truncate text-[15px] font-bold text-fg sm:text-base">{meta.title}</p>
        </div>

        <MacSearch />

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link to="/layout/resellerCustomer" className={cx(iconBtn, 'md:hidden')} aria-label="Find a customer">
            <Search size={18} />
          </Link>
          <CreditPill />
          <button type="button" onClick={toggle} className={iconBtn} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <AlertsMenu />
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
