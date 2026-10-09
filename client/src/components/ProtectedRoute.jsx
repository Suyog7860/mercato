import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner } from './ui.jsx'

export default function ProtectedRoute({ admin = false, children }) {
  const { user, ready, isAdmin } = useAuth()
  const loc = useLocation()
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}
