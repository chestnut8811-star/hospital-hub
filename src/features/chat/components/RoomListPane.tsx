import { Eye, MessageSquarePlus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { matchesQuery } from '@/lib/search'
import { cn } from '@/lib/utils'
import { MemberSheet } from '@/features/chat/components/MemberSheet'
import { RoomListItem } from '@/features/chat/components/RoomListItem'
import { getRoomTitle } from '@/features/chat/lib/roomHelpers'
import { useChatStore, useHiddenRooms, useRoomList } from '@/stores/chatStore'
import { useStaff } from '@/stores/directoryStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { Room, RoomKind } from '@/types'
import { MessageSquare, Users } from 'lucide-react'

interface RoomListPaneProps {
  kind: RoomKind
  title: string
  activeRoomId?: string
  className?: string
}

/** グループ／個人 の一覧。PC ではチャット画面の左ペインとしても使う。 */
export function RoomListPane({ kind, title, activeRoomId, className }: RoomListPaneProps) {
  const meId = useSessionStore((s) => s.currentUserId)
  const rooms = useRoomList(kind)
  const hidden = useHiddenRooms(kind)
  const setHidden = useChatStore((s) => s.setHidden)
  const [query, setQuery] = useState('')
  const [memberRoom, setMemberRoom] = useState<Room | null>(null)

  const filtered = useMemo(
    () => rooms.filter((room) => matchesQuery(query, getRoomTitle(room, meId), room.description)),
    [rooms, query, meId],
  )

  return (
    // min-w-0 が無いと flex 子要素の min-width:auto で中身の幅まで広がる（375px で破綻する）
    <div className={cn('flex min-h-0 min-w-0 flex-col bg-card', className)}>
      <div className="shrink-0 border-b border-border px-3 py-2.5 lg:px-4">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="flex-1 text-base font-semibold">{title}</h1>
          {kind === 'direct' && <NewDirectDialog />}
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === 'group' ? 'グループを検索' : '相手を検索'}
            aria-label={kind === 'group' ? 'グループを検索' : '相手を検索'}
            className="pl-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="検索をクリア"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          長押し（PC は右クリック）でピン留め・通知オフ・非表示
        </p>
      </div>

      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={query ? Search : MessageSquare}
            title={query ? '見つかりませんでした' : 'チャットがありません'}
            description={
              query
                ? `「${query}」に一致するチャットはありません。`
                : kind === 'group'
                  ? '参加しているグループがありません。'
                  : '個人チャットを始めると、ここに表示されます。'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((room) => (
              <li key={room.id}>
                <RoomListItem
                  room={room}
                  meId={meId}
                  query={query}
                  active={room.id === activeRoomId}
                  onShowMembers={setMemberRoom}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="px-3 pt-3 lg:px-4">
          <DemoNotice />
        </div>

        {hidden.length > 0 && (
          <details className="border-t border-border px-3 py-3 lg:px-4">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
              非表示のチャット（{hidden.length}）
            </summary>
            <ul className="mt-2 space-y-1">
              {hidden.map((room) => (
                <li key={room.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {getRoomTitle(room, meId)}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setHidden(room.id, false)}>
                    <Eye className="size-4" aria-hidden />
                    表示に戻す
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <MemberSheet
        room={memberRoom}
        meId={meId}
        onOpenChange={(open) => !open && setMemberRoom(null)}
      />
    </div>
  )
}

/** 新しい個人チャットを開始する */
function NewDirectDialog() {
  const navigate = useNavigate()
  const staff = useStaff()
  const meId = useSessionStore((s) => s.currentUserId)
  const createDirectRoom = useChatStore((s) => s.createDirectRoom)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const candidates = useMemo(
    () => staff.filter((u) => u.id !== meId && matchesQuery(query, u.name, u.kana, u.department, u.jobTitle)),
    [staff, meId, query],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageSquarePlus className="size-4" aria-hidden />
          新規
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>個人チャットを始める</DialogTitle>
          <DialogDescription>相手を選ぶとチャットが開きます。</DialogDescription>
        </DialogHeader>
        <div className="px-4">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="氏名・所属・職種で絞り込む"
            aria-label="相手を検索"
          />
        </div>
        <ul className="scrollbar-slim max-h-80 overflow-y-auto px-2 pb-4">
          {candidates.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              該当する職員がいません
            </li>
          )}
          {candidates.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => {
                  const roomId = createDirectRoom(user.id)
                  setOpen(false)
                  navigate(`/chat/${roomId}`)
                }}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
              >
                <UserAvatar user={user} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.department}・{user.jobTitle}
                  </span>
                </span>
                <Users className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
