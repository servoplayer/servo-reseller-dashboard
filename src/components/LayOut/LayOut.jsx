import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import Footer from '../Footer/Footer';
import { ShellContext } from './ShellContext';
import { notify } from '../../lib/notify';
import { useAlerts, useInfo } from '../../lib/dashboardData';
import { cx } from '../ui/cx';

const COLLAPSE_KEY = 'servo-sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export default function LayOut() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const infoRes = useInfo()
  const alerts = useAlerts()
  const info = infoRes.data?.info ?? null

  useEffect(() => {
    if (infoRes.error) notify.error(infoRes.error)
  }, [infoRes.error])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        // Preference only; ignore storage failures.
      }
      return !c
    })
  }
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const shell = useMemo(() => ({ info, alerts }), [info, alerts])

  return (
    <ShellContext.Provider value={shell}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-fg"
      >
        Skip to content
      </a>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />
      <div className={cx('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-[248px]')}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 focus:outline-none sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ShellContext.Provider>
  )
}
