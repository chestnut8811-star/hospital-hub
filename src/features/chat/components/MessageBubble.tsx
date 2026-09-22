import { Bookmark, Bot, Pin, Reply } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Highlight } from '@/components/common/Highlight'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { UserAvatar } from '@/components/common/UserAvatar'
import { formatBubbleTime, truncate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MessageActionsMenu } from '@/features/chat/components/MessageActionsMenu'
import {
  AckPanel,
  AttachmentCard,
  LinkPreviewCard,
  PollCard,
} from '@/features/chat/components/MessageContent'
import { useLongPress } from '@/features/chat/hooks/useLongPress'
import { useChatStore } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'
import type { Message, Room } from '@/types'
import { AI_USER_ID, SYSTEM_USER_ID } from '@/types'

interface MessageBubbleProps {
  message: Message
  replyTo?: Message
  room: Room
  meId: string
  /** 送信者名とアバターを出すか（同じ人の連続発言では省く） */
  showHeader: boolean
  canModerate: boolean
  query: string
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
}

export function MessageBubble(props: MessageBubbleProps) {
  const { message, room, meId } = props
  // 削除済みは種別によらず同じ表示にする（重要カードやAI吹き出しが中身だけ空で残らないように）
  if (message.deleted) return <DeletedBubble isMine={message.senderId === meId} />
  if (message.type === 'system' || message.senderId === SYSTEM_USER_ID) {
    return <SystemLine message={message} />
  }
  // AI かどうかは senderId で判定する（type だけだと人間の吹き出し色に落ちうる）
  if (message.senderId === AI_USER_ID || message.type === 'ai') return <AiBubble {...props} />
  if (message.priority === 'emergency' || message.priority === 'important') {
    return <ImportantCard {...props} total={room.memberIds.length} />
  }
  return <NormalBubble {...props} isMine={message.senderId === meId} />
}

function DeletedBubble({ isMine }: { isMine: boolean }) {
  return (
    <div className={cn('flex px-3 py-0.5 lg:px-4', isMine ? 'justify-end' : 'justify-start')}>
      <p className="rounded-msg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
        メッセージは削除されました
      </p>
    </div>
  )
}

/**
 * 吹き出しは全体が「長押しメニュー」のトリガになっている。
 * その中にあるボタン（確認しました・投票・添付・リンク）まで
 * トリガに吸われると押せなくなるので、ここでイベントを止める。
 */
function Interactive({ children }: { children: ReactNode }) {
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()
  return (
    <div onPointerDown={stop} onPointerUp={stop} onClick={stop} onContextMenu={stop}>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ システム通知 */

function SystemLine({ message }: { message: Message }) {
  return (
    <p className="py-1.5 text-center text-xs text-muted-foreground">
      {message.body}
    </p>
  )
}

/* ------------------------------------------------------------- 共通の部品 */

function ReactionRow({ message, meId }: { message: Message; meId: string }) {
  const toggleReaction = useChatStore((s) => s.toggleReaction)
  if (!message.reactions || message.reactions.length === 0) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {message.reactions.map((reaction) => {
        const mine = reaction.userIds.includes(meId)
        return (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => toggleReaction(message.id, reaction.emoji)}
            aria-pressed={mine}
            className={cn(
              'flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors',
              mine ? 'border-primary bg-info-soft text-primary' : 'border-border bg-card hover:bg-muted',
            )}
          >
            <span>{reaction.emoji}</span>
            <span className="tabular-nums">{reaction.userIds.length}</span>
          </button>
        )
      })}
    </div>
  )
}

function ReplyQuote({ replyTo, isMine }: { replyTo: Message; isMine?: boolean }) {
  return (
    <p
      className={cn(
        'mb-1.5 flex items-start gap-1.5 border-l-2 border-border pl-2 text-xs',
        isMine ? 'text-bubble-me-muted' : 'text-muted-foreground',
      )}
    >
      <Reply className="mt-0.5 size-3 shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className="font-medium">{getUser(replyTo.senderId).name}</span>：
        {truncate(replyTo.deleted ? '削除されたメッセージ' : replyTo.body, 40)}
      </span>
    </p>
  )
}

function MetaLine({
  message,
  room,
  meId,
  align,
}: {
  message: Message
  room: Room
  meId: string
  align: 'left' | 'right'
}) {
  const isMine = message.senderId === meId
  const readCount = Math.max(message.readUserIds.length - 1, 0)
  return (
    <p
      className={cn(
        'mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground',
        align === 'right' ? 'justify-end' : 'justify-start',
      )}
    >
      {message.saved && <Bookmark className="size-3" aria-label="保存済み" />}
      {message.pinned && <Pin className="size-3" aria-label="ピン留め" />}
      {message.editedAt && <span>編集済み</span>}
      {isMine && room.kind !== 'myroom' && readCount > 0 && <span>既読 {readCount}</span>}
      <time dateTime={message.createdAt}>{formatBubbleTime(message.createdAt)}</time>
    </p>
  )
}

/* ------------------------------------------------------------- 通常の発言 */

function NormalBubble({
  message,
  replyTo,
  room,
  meId,
  showHeader,
  canModerate,
  query,
  onReply,
  onEdit,
  isMine,
}: MessageBubbleProps & { isMine: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const longPress = useLongPress(() => setMenuOpen(true))
  const sender = getUser(message.senderId)

  return (
    <div
      className={cn(
        'flex gap-2 px-3 py-0.5 lg:px-4',
        isMine ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {!isMine && room.kind === 'group' && (
        <span className="w-9 shrink-0">
          {showHeader && <UserAvatar user={sender} size="sm" />}
        </span>
      )}
      {/* items-start / items-end で吹き出しを中身の幅に合わせる（伸びきらないように） */}
      <div
        className={cn(
          'flex max-w-[min(78%,34rem)] flex-col',
          isMine ? 'items-end' : 'items-start',
        )}
      >
        {showHeader && !isMine && room.kind === 'group' && (
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">{sender.name}</p>
        )}

        <MessageActionsMenu
          message={message}
          meId={meId}
          canModerate={canModerate}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          onReply={onReply}
          onEdit={onEdit}
        >
          <div
            role="button"
            tabIndex={0}
            {...longPress}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setMenuOpen(true)
              }
            }}
            className={cn(
              'cursor-default rounded-msg px-3 py-2 text-left text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isMine
                ? 'bg-bubble-me text-bubble-me-foreground'
                : 'border border-border bg-card text-card-foreground',
            )}
          >
            {replyTo && <ReplyQuote replyTo={replyTo} isMine={isMine} />}
            {message.title && <p className="mb-1 font-semibold">{message.title}</p>}
            {message.body && (
              <p className="break-words whitespace-pre-wrap">
                <Highlight text={message.body} query={query} />
              </p>
            )}
            {(message.attachments?.length || message.link || message.poll) && (
              <Interactive>
                <div className={cn('space-y-2', message.body && 'mt-2')}>
                  {message.attachments?.map((attachment) => (
                    <AttachmentCard key={attachment.id} attachment={attachment} />
                  ))}
                  {message.link && <LinkPreviewCard link={message.link} />}
                  {message.poll && <PollCard message={message} meId={meId} />}
                </div>
              </Interactive>
            )}
          </div>
        </MessageActionsMenu>

        <ReactionRow message={message} meId={meId} />
        <MetaLine message={message} room={room} meId={meId} align={isMine ? 'right' : 'left'} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ AI発言 */

function AiBubble({ message, meId, query }: MessageBubbleProps) {
  return (
    <div className="flex gap-2 px-3 py-1 lg:px-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ai text-base ring-2 ring-ai-border">
        🤖
      </span>
      <div className="flex max-w-[min(85%,38rem)] flex-col">
        <p className="mb-0.5 flex items-center gap-1 text-xs font-medium text-ai">
          <Bot className="size-3.5" aria-hidden />
          AI アシスタント
        </p>
        <div className="rounded-msg border border-ai-border bg-ai-soft px-3 py-2 text-[15px] leading-relaxed">
          <p className="break-words whitespace-pre-wrap">
            <Highlight text={message.body} query={query} />
          </p>
          <p className="mt-2 border-t border-ai-border pt-1.5 text-xs text-muted-foreground">
            AI が生成した要約です。内容は必ず原文で確認してください。
          </p>
        </div>
        <ReactionRow message={message} meId={meId} />
        <p className="mt-0.5 text-xs text-muted-foreground">
          <time dateTime={message.createdAt}>{formatBubbleTime(message.createdAt)}</time>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------- 重要メッセージ §14 */

function ImportantCard({
  message,
  room,
  meId,
  canModerate,
  query,
  total,
  onReply,
  onEdit,
}: MessageBubbleProps & { total: number }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const longPress = useLongPress(() => setMenuOpen(true))
  const sender = getUser(message.senderId)
  const emergency = message.priority === 'emergency'

  return (
    <div className="px-3 py-2 lg:px-4">
      <MessageActionsMenu
        message={message}
        meId={meId}
        canModerate={canModerate}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onReply={onReply}
        onEdit={onEdit}
      >
        <div
          role="button"
          tabIndex={0}
          {...longPress}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setMenuOpen(true)
            }
          }}
          className={cn(
            'w-full cursor-default rounded-xl border-2 bg-card p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
            // 罫には設計書どおりの色（*-accent）を使う。文字が載らないため AA の対象外
            emergency ? 'border-danger-accent' : 'border-warning-accent',
          )}
        >
          <div className="mb-2 flex items-center gap-2">
            <PriorityBadge priority={message.priority ?? 'normal'} />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {sender.name}・{formatBubbleTime(message.createdAt)}
            </span>
          </div>
          {message.title && <p className="mb-1.5 text-base font-bold">{message.title}</p>}
          <p className="break-words whitespace-pre-wrap text-[15px] leading-relaxed">
            <Highlight text={message.body} query={query} />
          </p>
          <Interactive>
            <AckPanel message={message} meId={meId} total={total} />
          </Interactive>
        </div>
      </MessageActionsMenu>
      <ReactionRow message={message} meId={meId} />
      <MetaLine message={message} room={room} meId={meId} align="left" />
    </div>
  )
}
