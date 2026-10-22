import { LayoutDashboard, UserPlus, Users } from 'lucide-react'
import { isFullReseller } from '../../lib/role'

// Single source of truth for the sidebar, page titles and breadcrumbs.
// Every route that existed before the redesign is still reachable.
export const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', to: '/layout', icon: LayoutDashboard, match: (path) => path === '/layout' || path === '/layout/' },
    ],
  },
  {
    section: 'Customers',
    items: [
      {
        label: 'Customers',
        to: '/layout/resellerCustomer',
        icon: Users,
        alertIds: ['expiring', 'expired'],
        match: (path) => path === '/layout/resellerCustomer',
      },
    ],
  },
  {
    section: 'Partners',
    // Only full resellers can manage sub-resellers (same rule as before).
    visible: isFullReseller,
    items: [
      { label: 'Sub-resellers', to: '/layout/subReseller', icon: UserPlus, match: (path) => path === '/layout/subReseller' },
    ],
  },
]

export const visibleNav = () => NAV.filter((group) => !group.visible || group.visible())

/** Section + title for the current location. */
export function getPageMeta(pathname, params) {
  // The provider page has no menu entry (it was hidden before), but its URL still works.
  if (pathname === '/layout/provider') return { section: 'Customers', title: 'Provider codes' }
  for (const group of NAV) {
    const item = group.items.find((i) => i.match(pathname, params))
    if (item) return { section: group.section, title: item.label }
  }
  return { section: '', title: 'Servo' }
}
