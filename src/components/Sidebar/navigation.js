import { Coins, History, LayoutDashboard, UserPlus, Users } from 'lucide-react'
import { isDistributorManager, isFullReseller } from '../../lib/role'

const isReseller = () => !isDistributorManager()

// Single source of truth for the sidebar, page titles and breadcrumbs.
// Every route that existed before the redesign is still reachable.
// `visible` only decides what is shown; the API enforces every permission.
export const NAV = [
  {
    section: 'Overview',
    visible: isReseller,
    items: [
      { label: 'Dashboard', to: '/layout', icon: LayoutDashboard, match: (path) => path === '/layout' || path === '/layout/' },
    ],
  },
  {
    section: 'Customers',
    visible: isReseller,
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
    visible: () => isReseller() && isFullReseller(),
    items: [
      { label: 'Sub-resellers', to: '/layout/subReseller', icon: UserPlus, match: (path) => path === '/layout/subReseller' },
    ],
  },
  {
    section: 'Account',
    visible: isReseller,
    items: [
      { label: 'Credit history', to: '/layout/credit-history', icon: History, match: (path) => path === '/layout/credit-history' },
    ],
  },
  {
    // Distributor manager: recharge resellers and review the credit ledger.
    section: 'Credits',
    visible: isDistributorManager,
    items: [
      { label: 'Resellers', to: '/layout/resellers', icon: Coins, match: (path) => path === '/layout/resellers' },
      { label: 'Credit history', to: '/layout/credit-history', icon: History, match: (path) => path === '/layout/credit-history' },
    ],
  },
]

export const visibleNav = () => NAV.filter((group) => !group.visible || group.visible())

/** Where "home" is for the signed-in role. */
export const homePath = () => (isDistributorManager() ? '/layout/resellers' : '/layout')

/** Section + title for the current location. */
export function getPageMeta(pathname, params) {
  // The provider page has no menu entry (it was hidden before), but its URL still works.
  if (pathname === '/layout/provider') return { section: 'Customers', title: 'Provider codes' }
  for (const group of visibleNav()) {
    const item = group.items.find((i) => i.match(pathname, params))
    if (item) return { section: group.section, title: item.label }
  }
  return { section: '', title: 'Servo' }
}
