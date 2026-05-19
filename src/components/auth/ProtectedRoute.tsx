import { Navigate, Outlet } from 'react-router-dom'
import { useCrm } from '../../context/CrmContext'

export function ProtectedRoute() {
  const { session } = useCrm()
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
