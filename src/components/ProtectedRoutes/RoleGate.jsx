import { Navigate } from 'react-router-dom'
import { isDistributorManager } from '../../lib/role'
import { homePath } from '../Sidebar/navigation'

/**
 * Sends an account to its own home when it opens a page meant for the other
 * role. This is navigation only: the API refuses those requests regardless.
 * `only`: 'reseller' (resellers and sub-resellers) or 'manager' (distributor manager).
 */
export default function RoleGate({ only, children }) {
  const manager = isDistributorManager()
  const allowed = only === 'manager' ? manager : !manager
  return allowed ? children : <Navigate to={homePath()} replace />
}
