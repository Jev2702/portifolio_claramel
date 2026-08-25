import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="bg-background min-h-svh flex items-center justify-center p-6">
        <p className="text-textSecondary">Carregando...</p>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
