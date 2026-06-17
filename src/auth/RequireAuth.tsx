import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function AuthLoader() {
  return (
    <div className="min-h-screen bg-brand-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-brand-200 text-sm">Carregando...</p>
      </div>
    </div>
  )
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoader />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
