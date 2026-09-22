import { ArrowLeft, MoreHorizontal, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RoomAvatar } from '@/components/common/RoomAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { matchesQuery } from '@/lib/search'
import { cn } from '@/lib/utils'
import { AiSummaryDialog } from '@/features/chat/components/AiSummaryDialog'
import { MessageComposer } from '@/features/chat/components/MessageComposer'
import { MessageList } from '@/features/chat/components/MessageList'
import { RoomMenuSheet } from '@/features/chat/components/RoomMenuSheet'
import { getRoomPeer, getRoomSubtitle, getRoomTitle } from '@/features/chat/lib/roomHelpers'
import { useChatStore, useRoomMessages } from '@/stores/chatStore'
import { useCurrentUser } from '@/stores/sessionStore'
import type { Message, Room } from '@/types'
import { hasRole } from '@/types'

/** チャット画面本体。グループ・DM・マイルームで共通（設計指示 §6） */
export function ChatRoom({ room, className }: { room: Room; className?: string }) {
  const navigate = useNavigate()
  const me = useCurrentUser()
  const messages = useRoomMessages(room.id)
  const markRoomRead = useChatStore((s) => s.markRoomRead)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editing, setEditing] = useState<Message | null>(null)

  // ルームを開いた瞬間の未読を控える（この直後に markRoomRead で全既読になるため）。
  // ChatRoom は key={room.id} で作り直されるので、初期化関数は1ルームにつき1回だけ走る。
  const [unreadIdsAtOpen] = useState<string[]>(() =>
    messages
      .filter((m) => !m.deleted && m.senderId !== me.id && !m.readUserIds.includes(me.id))
      .map((m) => m.id),
  )

  useEffect(() => {
    markRoomRead(room.id)
  }, [room.id, markRoomRead])

  const visible = useMemo(
    () => (query.trim() ? messages.filter((m) => matchesQuery(query, m.body, m.title)) : messages),
    [messages, query],
  )

  const canModerate = hasRole(me.role, 'GROUP_ADMIN') || room.adminIds.includes(me.id)
  const title = getRoomTitle(room, me.id)
  const peer = getRoomPeer(room, me.id)

  const unconfirmed = useMemo(
    () =>
      messages.filter(
        (m) =>
          !m.deleted &&
          m.priority === 'emergency' &&
          m.ack?.required &&
          !m.ack.confirmedUserIds.includes(me.id),
      ),
    [messages, me.id],
  )

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col bg-surface-sunken', className)}>
      {/* ヘッダー */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-2 lg:px-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="戻る"
          onClick={() => navigate(room.kind === 'direct' ? '/direct' : room.kind === 'myroom' ? '/menu' : '/groups')}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <RoomAvatar room={room} peer={peer} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{title}</p>
          <p className="truncate text-sm leading-tight text-muted-foreground">
            {getRoomSubtitle(room, me.id)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="AI で要約"
          className="text-ai"
          onClick={() => setAiOpen(true)}
        >
          <Sparkles className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="このルームを検索"
          onClick={() => setSearchOpen((v) => !v)}
        >
          <Search className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="ルームメニュー"
          onClick={() => setMenuOpen(true)}
        >
          <MoreHorizontal className="size-5" />
        </Button>
      </header>

      {/* ルーム内検索 */}
      {searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="このルームのメッセージを検索"
            aria-label="このルームのメッセージを検索"
          />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {query.trim() ? `${visible.length} 件` : ''}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="検索を閉じる"
            onClick={() => {
              setSearchOpen(false)
              setQuery('')
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* 配布物として取り違えられないよう、チャット画面にも常時表示する */}
      <p className="shrink-0 border-b border-border bg-warning-soft px-3 py-1.5 text-sm leading-snug text-foreground">
        デモ用のダミーデータです。臨床判断には使用しないでください。
      </p>

      {/* 未確認の緊急メッセージ */}
      {unconfirmed.length > 0 && !query && (
        <div className="shrink-0 border-b border-danger/40 bg-danger-soft px-3 py-2 text-sm">
          <p className="font-semibold text-danger">
            未確認の緊急メッセージが {unconfirmed.length} 件あります
          </p>
          <p className="text-xs text-muted-foreground">
            内容を読んで「確認しました」を押してください。
          </p>
        </div>
      )}

      {/* メッセージ */}
      <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={visible}
          allMessages={messages}
          room={room}
          meId={me.id}
          canModerate={canModerate}
          query={query}
          autoScroll={!query.trim()}
          onReply={(m) => {
            setEditing(null)
            setReplyTo(m)
          }}
          onEdit={(m) => {
            setReplyTo(null)
            setEditing(m)
          }}
        />
      </div>

      <MessageComposer
        roomId={room.id}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onOpenAiSummary={() => setAiOpen(true)}
      />

      <RoomMenuSheet
        room={room}
        meId={me.id}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onOpenAiSummary={() => setAiOpen(true)}
      />
      <AiSummaryDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        roomId={room.id}
        roomName={title}
        messages={messages}
        meId={me.id}
        unreadIds={unreadIdsAtOpen}
      />
    </div>
  )
}
