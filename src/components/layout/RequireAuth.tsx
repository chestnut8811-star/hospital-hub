import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/stores/sessionStore'

/** 未ログインならログイン画面へ送る。プロトタイプなので認証そのものは行わない。 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
