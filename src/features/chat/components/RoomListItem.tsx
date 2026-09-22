import { BellOff, EyeOff, MoreVertical, Pin, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Highlight } from '@/components/common/Highlight'
import { RoomAvatar } from '@/components/common/RoomAvatar'
import { UnreadBadge } from '@/components/common/UnreadBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatListTime, truncate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useLongPress } from '@/features/chat/hooks/useLongPress'
import { getRoomPeer, getRoomTitle } from '@/features/chat/lib/roomHelpers'
import { useChatStore, useLastMessage } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'
import type { Room } from '@/types'

interface RoomListItemProps {
  room: Room
  meId: string
  query: string
  active?: boolean
  onShowMembers: (room: Room) => void
}

/** チャット一覧の1行。長押し／右クリック／⋯ で操作メニューが開く（設計指示 §5） */
export function RoomListItem({ room, meId, query, active, onShowMembers }: RoomListItemProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const last = useLastMessage(room.id)
  const togglePin = useChatStore((s) => s.togglePin)
  const toggleMute = useChatStore((s) => s.toggleMute)
  const setHidden = useChatStore((s) => s.setHidden)
  const longPress = useLongPress(() => setMenuOpen(true))

  const title = getRoomTitle(room, meId)
  const peer = getRoomPeer(room, meId)
  const preview = last
    ? last.deleted
      ? 'メッセージは削除されました'
      : `${room.kind === 'group' && last.senderId !== meId ? `${getUser(last.senderId).name}：` : ''}${
          last.type === 'image'
            ? '📷 写真'
            : last.type === 'file'
              ? `📎 ${last.attachments?.[0]?.name ?? 'ファイル'}`
              : last.type === 'form'
                ? '📊 アンケート'
                : last.type === 'url'
                  ? `🔗 ${last.link?.title ?? 'リンク'}`
                : truncate(last.title ? `${last.title} ${last.body}` : last.body, 48)
        }`
    : 'まだメッセージはありません'

  return (
    <div className={cn('group relative', active && 'bg-accent')}>
      <button
        type="button"
        onClick={() => navigate(`/chat/${room.id}`)}
        {...longPress}
        className={cn(
          'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted lg:px-4',
          active && 'bg-accent hover:bg-accent',
        )}
      >
        <RoomAvatar room={room} peer={peer} size="md" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {room.pinned && <Pin className="size-3.5 shrink-0 text-muted-foreground" aria-label="ピン留め" />}
            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                room.unreadCount > 0 ? 'font-bold' : 'font-semibold',
              )}
            >
              <Highlight text={title} query={query} />
            </span>
            {room.muted && (
              <BellOff className="size-3.5 shrink-0 text-muted-foreground" aria-label="通知オフ" />
            )}
            <span className="shrink-0 text-xs text-muted-foreground">
              {last ? formatListTime(last.createdAt) : ''}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm',
                room.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <Highlight text={preview} query={query} />
            </span>
            <UnreadBadge
              count={room.unreadCount}
              emergency={room.hasEmergency}
              muted={room.muted}
            />
          </span>
        </span>
      </button>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            // タッチ端末には hover が無いため、見えていないときは当たり判定も消す
            // （見えないボタンが時刻・未読バッジを覆ってしまう）
            className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100"
            aria-label={`${title} の操作`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => togglePin(room.id)}>
            <Pin className="size-4" aria-hidden />
            {room.pinned ? 'ピン留めを解除' : 'ピン留め'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toggleMute(room.id)}>
            <BellOff className="size-4" aria-hidden />
            {room.muted ? '通知をオンにする' : '通知をオフにする'}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onShowMembers(room)}>
            <Users className="size-4" aria-hidden />
            メンバーを確認
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setHidden(room.id, true)
              toast('一覧から非表示にしました', {
                description: '一覧下部の「非表示のチャット」から戻せます',
                action: { label: '元に戻す', onClick: () => setHidden(room.id, false) },
              })
            }}
          >
            <EyeOff className="size-4" aria-hidden />
            一覧から非表示にする
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
