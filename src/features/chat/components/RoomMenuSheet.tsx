import {
  Bell,
  BellOff,
  FileText,
  ImageIcon,
  Info,
  LogOut,
  NotebookPen,
  Pin,
  Sparkles,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { formatDateTime, truncate } from '@/lib/format'
import { useChatStore, useNote, useRoomMessages } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'
import type { Room } from '@/types'
import { useState } from 'react'

interface RoomMenuSheetProps {
  room: Room
  meId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenAiSummary: () => void
}

/** チャットヘッダーの ⋯ から開くルームメニュー（設計指示 §9） */
export function RoomMenuSheet({
  room,
  meId,
  open,
  onOpenChange,
  onOpenAiSummary,
}: RoomMenuSheetProps) {
  const navigate = useNavigate()
  const toggleMute = useChatStore((s) => s.toggleMute)
  const leaveRoom = useChatStore((s) => s.leaveRoom)
  const messages = useRoomMessages(room.id)
  const note = useNote(room.id)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const files = useMemo(
    () => messages.flatMap((m) => (m.attachments ?? []).filter((a) => a.kind === 'file')),
    [messages],
  )
  const images = useMemo(
    () => messages.flatMap((m) => (m.attachments ?? []).filter((a) => a.kind === 'image')),
    [messages],
  )
  const pinned = useMemo(() => messages.filter((m) => m.pinned && !m.deleted), [messages])

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>
                {room.icon || '💬'}
              </span>
              {room.name || 'チャット'}
            </SheetTitle>
            <SheetDescription>{room.description || 'ルームの情報と設定'}</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-8">
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Info className="size-3.5" aria-hidden />
                グループ情報
              </h3>
              <dl className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">作成日</dt>
                  <dd>{formatDateTime(room.createdAt)}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">メッセージ数</dt>
                  <dd className="tabular-nums">{messages.length}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Users className="size-3.5" aria-hidden />
                メンバー（{room.memberIds.length}）
              </h3>
              <ul className="rounded-lg border border-border bg-card px-3 py-1">
                {room.memberIds.slice(0, 8).map((id) => {
                  const user = getUser(id)
                  return (
                    <li key={id} className="flex items-center gap-2 py-1.5">
                      <UserAvatar user={user} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {user.name}
                        {id === meId && (
                          <span className="ml-1 text-xs text-muted-foreground">（自分）</span>
                        )}
                      </span>
                      {room.adminIds.includes(id) && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                          管理者
                        </span>
                      )}
                    </li>
                  )
                })}
                {room.memberIds.length > 8 && (
                  <li className="py-1.5 text-xs text-muted-foreground">
                    ほか {room.memberIds.length - 8} 人
                  </li>
                )}
              </ul>
            </section>

            <Separator />

            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false)
                  navigate(`/chat/${room.id}/note`)
                }}
              >
                <NotebookPen className="size-4" aria-hidden />
                共有ノート
                {note && (
                  <span className="ml-auto text-xs text-muted-foreground">v{note.version}</span>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false)
                  navigate(`/chat/${room.id}/note?tab=files`)
                }}
              >
                <FileText className="size-4" aria-hidden />
                ファイル
                <span className="ml-auto text-xs text-muted-foreground">{files.length}</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false)
                  navigate(`/chat/${room.id}/note?tab=images`)
                }}
              >
                <ImageIcon className="size-4" aria-hidden />
                画像
                <span className="ml-auto text-xs text-muted-foreground">{images.length}</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false)
                  onOpenAiSummary()
                }}
              >
                <Sparkles className="size-4" aria-hidden />
                AI で要約
              </Button>
            </div>

            {pinned.length > 0 && (
              <section>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Pin className="size-3.5" aria-hidden />
                  ピン留めメッセージ（{pinned.length}）
                </h3>
                <ul className="space-y-1.5">
                  {pinned.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <p className="text-xs text-muted-foreground">{getUser(m.senderId).name}</p>
                      <p>{truncate(m.title ? `${m.title}：${m.body}` : m.body, 70)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Separator />

            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-3">
              {room.muted ? (
                <BellOff className="size-4 text-muted-foreground" aria-hidden />
              ) : (
                <Bell className="size-4 text-muted-foreground" aria-hidden />
              )}
              <span className="flex-1 text-sm">通知</span>
              <Switch
                checked={!room.muted}
                onCheckedChange={() => toggleMute(room.id)}
                aria-label="通知"
              />
            </label>

            {room.kind === 'group' && (
              <Button
                variant="ghost"
                className="w-full justify-start text-danger hover:bg-danger-soft hover:text-danger"
                onClick={() => setLeaveOpen(true)}
              >
                <LogOut className="size-4" aria-hidden />
                このグループから退出
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="このグループから退出しますか？"
        description="退出すると一覧から消えます。再参加にはグループ管理者の操作が必要です。"
        confirmLabel="退出する"
        destructive
        onConfirm={() => {
          leaveRoom(room.id)
          onOpenChange(false)
          navigate('/groups')
          toast.success('グループから退出しました')
        }}
      />
    </>
  )
}
