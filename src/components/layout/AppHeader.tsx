import { Bell, Hospital, LogOut, RefreshCw, Search, Siren, UserCog } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UnreadBadge } from '@/components/common/UnreadBadge'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatListTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getRoomTitle } from '@/features/chat/lib/roomHelpers'
import { useChatStore } from '@/stores/chatStore'
import { useDirectoryStore, useStaff } from '@/stores/directoryStore'
import { useActiveDrill, useAnnouncements, useHubStore } from '@/stores/hubStore'
import { useCurrentUser, useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import { ROLE_LABEL } from '@/types'

/** 共通ヘッダー（56px）。設計指示 §4 */
export function AppHeader({ className }: { className?: string }) {
  const navigate = useNavigate()
  const me = useCurrentUser()
  const staff = useStaff()
  const switchUser = useSessionStore((s) => s.switchUser)
  const logout = useSessionStore((s) => s.logout)
  const setSearchOpen = useUiStore((s) => s.setSearchOpen)
  const announcements = useAnnouncements()
  const drill = useActiveDrill()
  const rooms = useChatStore((s) => s.rooms)
  const messages = useChatStore((s) => s.messages)
  const [resetOpen, setResetOpen] = useState(false)

  const unreadAnnouncements = announcements.filter((a) => !a.readUserIds.includes(me.id))
  // 「未読かどうか」ではなく「確認したかどうか」で出す。
  // 一度開いただけで緊急表示が消えると、確認操作が漏れるため。
  const unconfirmedRoomIds = useMemo(() => {
    const ids = new Set<string>()
    for (const m of messages) {
      if (m.deleted || m.priority !== 'emergency') continue
      if (!m.ack?.required || m.ack.confirmedUserIds.includes(me.id)) continue
      ids.add(m.roomId)
    }
    return ids
  }, [messages, me.id])
  const emergencyRooms = rooms.filter(
    (r) => !r.hidden && r.memberIds.includes(me.id) && unconfirmedRoomIds.has(r.id),
  )
  const needsSafetyAnswer = drill ? !drill.responses.some((r) => r.userId === me.id) : false
  const notificationCount =
    unreadAnnouncements.length + emergencyRooms.length + (needsSafetyAnswer ? 1 : 0)

  const resetAll = () => {
    useChatStore.getState().resetDemoData()
    useHubStore.getState().resetDemoData()
    useDirectoryStore.getState().resetDemoData()
    toast.success('デモデータを初期状態に戻しました')
  }

  return (
    <header
      className={cn(
        'z-30 h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 lg:px-4',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => navigate('/groups')}
        className="flex min-w-0 items-center gap-2 rounded-lg py-1 pr-2 text-left"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Hospital className="size-[18px]" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold leading-tight">院内ハブ</span>
          <span className="hidden truncate text-xs leading-tight text-muted-foreground lg:block">
            Hospital Communication Hub
          </span>
        </span>
      </button>

      {/* PC のみ中央に検索 */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="mx-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted lg:flex"
      >
        <Search className="size-4" aria-hidden />
        院内を検索
      </button>

      <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="検索"
        >
          <Search className="size-5" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="通知">
              <Bell className="size-5" />
              {notificationCount > 0 && (
                <UnreadBadge
                  count={notificationCount}
                  emergency={emergencyRooms.length > 0}
                  className="absolute top-1.5 right-1.5"
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">通知</p>
            <div className="scrollbar-slim max-h-80 overflow-y-auto py-1">
              {notificationCount === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  新しい通知はありません
                </p>
              )}
              {needsSafetyAnswer && drill && (
                <button
                  type="button"
                  onClick={() => navigate('/safety')}
                  className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted"
                >
                  <Siren className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{drill.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      未回答です。タップして回答してください
                    </span>
                  </span>
                </button>
              )}
              {emergencyRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => navigate(`/chat/${room.id}`)}
                  className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted"
                >
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-danger text-xs font-bold text-danger-foreground">
                    !
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {getRoomTitle(room, me.id)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      未確認の緊急メッセージがあります
                    </span>
                  </span>
                </button>
              ))}
              {unreadAnnouncements.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/announcements/${item.id}`)}
                  className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-muted"
                >
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      お知らせ・{formatListTime(item.publishedAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="アカウント">
              <UserAvatar user={me} size="xs" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <p className="font-semibold">{me.name}</p>
              <p className="text-xs text-muted-foreground">
                {me.department}・{me.jobTitle}
              </p>
              <p className="mt-1 inline-flex rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {ROLE_LABEL[me.role]}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserCog className="size-4" aria-hidden />
                利用者を切り替え（デモ）
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                {staff.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onSelect={() => {
                      switchUser(user.id)
                      toast.success(`${user.name} として表示します（${ROLE_LABEL[user.role]}）`)
                    }}
                  >
                    <UserAvatar user={user} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {ROLE_LABEL[user.role]}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onSelect={() => setResetOpen(true)}>
              <RefreshCw className="size-4" aria-hidden />
              デモデータを初期化
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut className="size-4" aria-hidden />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="デモデータを初期化しますか？"
        description="送信したメッセージ・報告・回答など、この端末に保存されている操作結果がすべて消えます。"
        confirmLabel="初期化する"
        destructive
        onConfirm={resetAll}
      />
    </header>
  )
}
