import { createContext, useContext } from 'react'

/** Reseller profile and live alerts, shared by the sidebar, top bar and pages. */
export const ShellContext = createContext({
  info: null,
  alerts: { alerts: [], unread: 0, loading: true, markRead: () => {}, markAllRead: () => {} },
})

export const useShell = () => useContext(ShellContext)
