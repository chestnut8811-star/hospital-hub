import { Bookmark, Copy, Info, Pencil, Pin, Reply, Siren, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UserAvatar } from '@/components/common/UserAvatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { formatFullDateTime } from '@/lib/format'
import { useChatStore } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'
import type { Message } from '@/types'

const QUICK_REACTIONS = ['👍', '🙏', '✅', '👀', '❗'] as const

interface MessageActionsMenuProps {
  message: Message
  meId: string
  canModerate: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onReply: (message: Message) => void
  onEdit: (message: Message) => void
  children: ReactNode
}

/** メッセージ長押しのメニュー（設計指示 §7） */
export function MessageActionsMenu({
  message,
  meId,
  canModerate,
  open,
  onOpenChange,
  onReply,
  onEdit,
  children,
}: MessageActionsMenuProps) {
  const toggleReaction = useChatStore((s) => s.toggleReaction)
  const toggleSaved = useChatStore((s) => s.toggleSaved)
  const togglePinnedMessage = useChatStore((s) => s.togglePinnedMessage)
  const setMessagePriority = useChatStore((s) => s.setMessagePriority)
  const deleteMessage = useChatStore((s) => s.deleteMessage)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isMine = message.senderId === meId

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.body)
      toast.success('コピーしました')
    } catch {
      toast.error('コピーできませんでした')
    }
  }

  return (
    <>
      {/*
        吹き出し自体を DropdownMenuTrigger にすると、Radix が pointerdown で開くため
        「軽くタップ・左クリックしただけ」でメニューが出てしまう。
        設計指示 §7 は「長押し」なので、トリガは見えないアンカーに任せ、
        開くかどうかは長押し・右クリック・キーボードの側で決める。
      */}
      <div className="relative">
        {children}
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger asChild>
            <span
              aria-hidden
              tabIndex={-1}
              className={`pointer-events-none absolute bottom-0 block size-0 ${isMine ? 'right-4' : 'left-4'}`}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isMine ? 'end' : 'start'} className="w-56">
          {/* 素の button だと Radix のフォーカス管理の外に出てキーボードで辿れないので Item にする */}
          <div className="flex justify-between px-1 py-1">
            {QUICK_REACTIONS.map((emoji) => (
              <DropdownMenuItem
                key={emoji}
                aria-label={`${emoji} のリアクション`}
                className="size-11 justify-center rounded-full p-0 text-lg"
                onSelect={() => toggleReaction(message.id, emoji)}
              >
                {emoji}
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onReply(message)}>
            <Reply className="size-4" aria-hidden />
            返信
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copy()}>
            <Copy className="size-4" aria-hidden />
            コピー
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toggleSaved(message.id)
              toast.success(message.saved ? '保存を解除しました' : '保存しました')
            }}
          >
            <Bookmark className="size-4" aria-hidden />
            {message.saved ? '保存を解除' : '保存'}
          </DropdownMenuItem>
          {isMine && (
            <DropdownMenuItem onSelect={() => onEdit(message)}>
              <Pencil className="size-4" aria-hidden />
              編集
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setDetailOpen(true)}>
            <Info className="size-4" aria-hidden />
            詳細
          </DropdownMenuItem>

          {canModerate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">管理者</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => togglePinnedMessage(message.id)}>
                <Pin className="size-4" aria-hidden />
                {message.pinned ? 'ピン留めを解除' : 'ピン留め'}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Siren className="size-4" aria-hidden />
                  重要メッセージ化
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={() => {
                      setMessagePriority(message.id, 'emergency', message.title ?? '緊急のお知らせ')
                      toast.success('緊急メッセージにしました')
                    }}
                  >
                    🔴 緊急にする
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setMessagePriority(message.id, 'important', message.title ?? '重要なお知らせ')
                      toast.success('重要メッセージにしました')
                    }}
                  >
                    🟠 重要にする
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setMessagePriority(message.id, undefined)
                      toast.success('通常のメッセージに戻しました')
                    }}
                  >
                    🔵 通常に戻す
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}

          {isMine && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" aria-hidden />
                削除
              </DropdownMenuItem>
            </>
          )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>メッセージの詳細</DialogTitle>
            <DialogDescription>
              {getUser(message.senderId).name}・{formatFullDateTime(message.createdAt)}
              {message.editedAt && `（${formatFullDateTime(message.editedAt)} に編集）`}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 pb-4">
            <p className="mb-2 text-sm font-medium">
              既読 {Math.max(message.readUserIds.length - 1, 0)} 人
            </p>
            <ul className="scrollbar-slim max-h-56 space-y-1.5 overflow-y-auto">
              {message.readUserIds
                .filter((id) => id !== message.senderId)
                .map((id) => {
                  const user = getUser(id)
                  return (
                    <li key={id} className="flex items-center gap-2">
                      <UserAvatar user={user} size="xs" />
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.department}</span>
                    </li>
                  )
                })}
              {message.readUserIds.filter((id) => id !== message.senderId).length === 0 && (
                <li className="text-sm text-muted-foreground">まだ誰も読んでいません</li>
              )}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="このメッセージを削除しますか？"
        description="削除すると「メッセージは削除されました」と表示され、本文は戻せません。"
        confirmLabel="削除する"
        destructive
        onConfirm={() => {
          deleteMessage(message.id)
          toast.success('削除しました')
        }}
      />
    </>
  )
}
