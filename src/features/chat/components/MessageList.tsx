import { MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDateSeparator } from '@/lib/format'
import { MessageBubble } from '@/features/chat/components/MessageBubble'
import type { Message, Room } from '@/types'

interface MessageListProps {
  messages: Message[]
  room: Room
  meId: string
  canModerate: boolean
  query: string
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
}

/** 同じ人の5分以内の連続発言は、名前とアバターをまとめる */
const GROUP_WINDOW_MS = 5 * 60 * 1000

export function MessageList({
  messages,
  room,
  meId,
  canModerate,
  query,
  onReply,
  onEdit,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages])

  const rows = useMemo(() => {
    const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return sorted.map((message, index) => {
      const prev = sorted[index - 1]
      const newDay =
        !prev ||
        new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString()
      const showHeader =
        newDay ||
        !prev ||
        prev.senderId !== message.senderId ||
        prev.type === 'system' ||
        new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() > GROUP_WINDOW_MS
      return { message, newDay, showHeader }
    })
  }, [messages])

  // 新しい発言が増えたら最下部まで送る
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="まだメッセージはありません"
        description={
          room.kind === 'myroom'
            ? 'メモやTODO、あとで見たいリンクを自分宛てに送れます。'
            : '最初のメッセージを送ってみましょう。'
        }
      />
    )
  }

  return (
    <div className="py-3">
      {rows.map(({ message, newDay, showHeader }) => (
        <div key={message.id}>
          {newDay && (
            <div className="my-3 flex items-center justify-center">
              <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-muted-foreground">
                {formatDateSeparator(message.createdAt)}
              </span>
            </div>
          )}
          <MessageBubble
            message={message}
            replyTo={message.replyToId ? byId.get(message.replyToId) : undefined}
            room={room}
            meId={meId}
            showHeader={showHeader}
            canModerate={canModerate}
            query={query}
            onReply={onReply}
            onEdit={onEdit}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
