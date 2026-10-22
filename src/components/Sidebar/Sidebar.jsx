import { useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import logo from '../../assets/Image/servologo.png'
import { visibleNav } from './navigation'
import { useShell } from '../LayOut/ShellContext'
import { roleLabel } from '../../lib/role'
import { cx } from '../ui/cx'
import { logOut } from '../../lib/api'

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { pathname, search } = useLocation()
  const [params] = useSearchParams()
  const { info, alerts } = useShell()
  const unreadIds = new Set(alerts.alerts.filter((a) => !a.read).map((a) => a.id))

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    onCloseMobile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => e.key === 'Escape' && onCloseMobile()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, onCloseMobile])

  // On mobile the drawer is always shown expanded.
  const compact = collapsed && !mobileOpen

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 animate-fade-in bg-navy/60 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}
      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-navy text-white transition-[width,transform] duration-200',
          'w-[264px] lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full',
          compact ? 'lg:w-[72px]' : 'lg:w-[248px]',
        )}
      >
        <div className={cx('flex h-16 shrink-0 items-center gap-3 border-b border-white/10', compact ? 'justify-center px-2' : 'px-5')}>
          <Link to="/layout" className="flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="Servo dashboard home">
            <img src={logo} alt="" className="h-8 w-8 shrink-0 object-contain" />
            {!compact && (
              <span className="min-w-0 leading-tight">
                <span className="block text-[15px] font-bold tracking-tight">Servo</span>
                <span className="block text-2xs font-medium uppercase tracking-[0.14em] text-sky">Reseller</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {visibleNav().map((group) => (
            <div key={group.section} className="mb-4 last:mb-0">
              {compact ? (
                <div className="mx-auto mb-2 h-px w-6 bg-white/10" aria-hidden="true" />
              ) : (
                <p className="mb-1.5 px-3 text-2xs font-semibold uppercase tracking-[0.12em] text-white/55">{group.section}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.match(pathname, params)
                  const Icon = item.icon
                  const hasAlert = item.alertIds?.some((id) => unreadIds.has(id))
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        aria-current={active ? 'page' : undefined}
                        title={compact ? item.label : undefined}
                        aria-label={compact ? item.label : undefined}
                        className={cx(
                          'group relative flex h-10 items-center gap-3 rounded-lg text-[13.5px] font-medium transition-colors',
                          compact ? 'justify-center' : 'px-3',
                          active ? 'bg-servo text-white' : 'text-white/70 hover:bg-white/[0.07] hover:text-white',
                        )}
                      >
                        {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r bg-sky" aria-hidden="true" />}
                        <Icon size={18} className="shrink-0" aria-hidden="true" />
                        {!compact && <span className="truncate">{item.label}</span>}
                        {hasAlert && (
                          <span
                            className={cx('h-2 w-2 rounded-full bg-attention ring-2 ring-navy', compact ? 'absolute right-2 top-2' : 'ml-auto')}
                            aria-label="Needs attention"
                          />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          {!compact && info && (
            <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-line text-[13px] font-bold uppercase">
                {(info.userName || info.email || '?').charAt(0)}
              </span>
              <div className="min-w-0 text-[13px] leading-tight">
                <p className="truncate font-semibold">{info.userName}</p>
                <p className="truncate text-white/55">{info.email || roleLabel()}</p>
              </div>
            </div>
          )}
          <div className={cx('flex gap-1', compact && 'flex-col')}>
            <button
              type="button"
              onClick={logOut}
              title={compact ? 'Log out' : undefined}
              aria-label="Log out"
              className={cx(
                'flex h-10 items-center gap-3 rounded-lg text-[13.5px] font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white',
                compact ? 'justify-center' : 'flex-1 px-3',
              )}
            >
              <LogOut size={18} aria-hidden="true" />
              {!compact && 'Log out'}
            </button>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-white/60 hover:bg-white/[0.07] hover:text-white lg:flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
