import { BookOpen, Megaphone, MessageSquare, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Highlight } from '@/components/common/Highlight'
import { RoomAvatar } from '@/components/common/RoomAvatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatListTime, truncate } from '@/lib/format'
import { matchesQuery } from '@/lib/search'
import { useChatStore } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'
import { useHubStore } from '@/stores/hubStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useUiStore } from '@/stores/uiStore'
import type { Room } from '@/types'

const LIMIT = 5

function roomLabel(room: Room, meId: string): string {
  if (room.kind !== 'direct') return room.name
  const peerId = room.memberIds.find((id) => id !== meId)
  return peerId ? `${getUser(peerId).name} さん` : room.name
}

/** ヘッダーの虫めがねから開く横断検索（ルーム・メッセージ・ナレッジ・お知らせ） */
export function GlobalSearchDialog() {
  const open = useUiStore((s) => s.searchOpen)
  const setOpen = useUiStore((s) => s.setSearchOpen)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const rooms = useChatStore((s) => s.rooms)
  const messages = useChatStore((s) => s.messages)
  const knowledge = useHubStore((s) => s.knowledge)
  const announcements = useHubStore((s) => s.announcements)
  const meId = useSessionStore((s) => s.currentUserId)

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return null
    return {
      rooms: rooms
        .filter((r) => !r.hidden && matchesQuery(q, roomLabel(r, meId), r.description))
        .slice(0, LIMIT),
      messages: messages
        .filter((m) => !m.deleted && matchesQuery(q, m.body, m.title))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, LIMIT),
      knowledge: knowledge
        .filter((k) => matchesQuery(q, k.title, k.summary, k.tags.join(' ')))
        .slice(0, LIMIT),
      announcements: announcements
        .filter((a) => matchesQuery(q, a.title, a.body))
        .slice(0, LIMIT),
    }
  }, [query, rooms, messages, knowledge, announcements, meId])

  const go = (to: string) => {
    setOpen(false)
    setQuery('')
    navigate(to)
  }

  const total = results
    ? results.rooms.length +
      results.messages.length +
      results.knowledge.length +
      results.announcements.length
    : 0

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <DialogContent className="top-[8%] translate-y-0 gap-0 p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">院内検索</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="グループ・メッセージ・マニュアル・お知らせを検索"
            className="h-12 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="scrollbar-slim max-h-[60vh] overflow-y-auto p-2">
          {!results && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              キーワードを入力してください。
              <br />
              例）TAVI、点検、輸液ポンプ、安否確認
            </p>
          )}
          {results && total === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              「{query}」に一致するものは見つかりませんでした。
            </p>
          )}

          {results && results.rooms.length > 0 && (
            <section className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">チャット</p>
              {results.rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => go(`/chat/${room.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                >
                  <RoomAvatar
                    room={room}
                    peer={
                      room.kind === 'direct'
                        ? getUser(room.memberIds.find((id) => id !== meId) ?? '')
                        : undefined
                    }
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Highlight text={roomLabel(room, meId)} query={query} />
                    </span>
                    {room.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {room.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </section>
          )}

          {results && results.messages.length > 0 && (
            <section className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">メッセージ</p>
              {results.messages.map((message) => {
                const room = rooms.find((r) => r.id === message.roomId)
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => go(`/chat/${message.roomId}`)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                  >
                    <MessageSquare
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        <Highlight text={truncate(message.body, 70)} query={query} />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {getUser(message.senderId).name}・
                        {room ? roomLabel(room, meId) : ''}・
                        {formatListTime(message.createdAt)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </section>
          )}

          {results && results.knowledge.length > 0 && (
            <section className="mb-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">院内ナレッジ</p>
              {results.knowledge.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => go(`/knowledge/${doc.id}`)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                >
                  <BookOpen className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Highlight text={doc.title} query={query} />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {doc.category}・{doc.source}
                    </span>
                  </span>
                </button>
              ))}
            </section>
          )}

          {results && results.announcements.length > 0 && (
            <section>
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">お知らせ</p>
              {results.announcements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(`/announcements/${item.id}`)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                >
                  <Megaphone className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Highlight text={item.title} query={query} />
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.category}・{formatListTime(item.publishedAt)}
                    </span>
                  </span>
                </button>
              ))}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
