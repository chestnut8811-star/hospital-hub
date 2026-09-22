import { useEffect } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomNav } from '@/components/layout/BottomNav'
import { DesktopSidebar } from '@/components/layout/DesktopSidebar'
import { GlobalSearchDialog } from '@/components/layout/GlobalSearchDialog'
import type { RouteHandle } from '@/components/layout/routeHandle'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chatStore'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * 画面の骨組み（設計書 §5）。
 * - スマホ: ヘッダー(56px) + 本文 + 下部ナビ(64px)
 * - PC:     サイドバー(280px) + ヘッダー + 本文
 * チャット画面はスマホで全画面にしたいので、ルートの handle で共通部分を隠す。
 */
export function AppShell() {
  const matches = useMatches()
  const currentUserId = useSessionStore((s) => s.currentUserId)
  const recalcForViewer = useChatStore((s) => s.recalcForViewer)

  // デモで利用者を切り替えたとき、未読バッジをその人の視点で計算し直す
  useEffect(() => {
    recalcForViewer(currentUserId)
  }, [currentUserId, recalcForViewer])

  const fullscreenOnMobile = matches.some(
    (m) => (m.handle as RouteHandle | undefined)?.fullscreenOnMobile,
  )

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <AppHeader className={cn(fullscreenOnMobile ? 'hidden lg:flex' : 'flex')} />
      <div className="flex min-h-0 flex-1">
        <DesktopSidebar className="hidden lg:flex" />
        <main className="min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <BottomNav className={cn(fullscreenOnMobile ? 'hidden' : 'block lg:hidden')} />
      <GlobalSearchDialog />
    </div>
  )
}
