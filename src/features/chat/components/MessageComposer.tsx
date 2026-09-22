import { Camera, FileText, ImageIcon, Plus, Send, Sparkles, SquarePen, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { truncate } from '@/lib/format'
import { uid } from '@/lib/id'
import { QUICK_PHRASES } from '@/features/chat/lib/quickPhrases'
import { useChatStore } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'
import type { Message } from '@/types'

interface MessageComposerProps {
  roomId: string
  replyTo: Message | null
  onCancelReply: () => void
  editing: Message | null
  onCancelEdit: () => void
  onOpenAiSummary: () => void
}

/** 下部固定の入力欄（設計指示 §8）。Enter=改行 / Ctrl+Enter=送信 */
export function MessageComposer({
  roomId,
  replyTo,
  onCancelReply,
  editing,
  onCancelEdit,
  onOpenAiSummary,
}: MessageComposerProps) {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const editMessage = useChatStore((s) => s.editMessage)
  const [text, setText] = useState('')
  const [attachOpen, setAttachOpen] = useState<null | 'image' | 'file'>(null)
  const [pollOpen, setPollOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 編集を始めたら本文を読み込み、編集をやめたら消す。
  // （返信に切り替えたときに編集中の本文が残って、そのまま新規投稿されるのを防ぐ）
  useEffect(() => {
    setText(editing ? editing.body : '')
    if (editing) textareaRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  const submit = () => {
    const body = text.trim()
    if (!body) return
    if (editing) {
      editMessage(editing.id, body)
      onCancelEdit()
      toast.success('編集しました')
    } else {
      sendMessage(roomId, { body, ...(replyTo ? { replyToId: replyTo.id } : {}) })
      onCancelReply()
    }
    setText('')
  }

  return (
    <div className="shrink-0 border-t border-border bg-card pb-safe">
      {(replyTo || editing) && (
        <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {editing ? (
              <>編集中：{truncate(editing.body, 40)}</>
            ) : replyTo ? (
              <>
                <span className="font-medium">{getUser(replyTo.senderId).name}</span> に返信：
                {truncate(replyTo.body, 34)}
              </>
            ) : null}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="やめる"
            onClick={() => {
              if (editing) {
                onCancelEdit()
                setText('')
              } else {
                onCancelReply()
              }
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-1.5 px-2 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="追加">
              <Plus className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52">
            <DropdownMenuItem onSelect={() => setAttachOpen('image')}>
              <ImageIcon className="size-4" aria-hidden />
              写真
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAttachOpen('file')}>
              <FileText className="size-4" aria-hidden />
              ファイル
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                toast('プロトタイプではカメラを使えません', {
                  description: '「写真」からダミーの画像を送れます',
                })
              }
            >
              <Camera className="size-4" aria-hidden />
              カメラ
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setPollOpen(true)}>
              <SquarePen className="size-4" aria-hidden />
              アンケート
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileText className="size-4" aria-hidden />
                定型文
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-64 overflow-y-auto">
                {QUICK_PHRASES.map((phrase) => (
                  <DropdownMenuItem
                    key={phrase}
                    onSelect={() => {
                      setText((prev) => (prev ? `${prev}\n${phrase}` : phrase))
                      textareaRef.current?.focus()
                    }}
                  >
                    <span className="whitespace-normal text-sm">{phrase}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">AI</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onOpenAiSummary}>
              <Sparkles className="size-4" aria-hidden />
              このルームを要約
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              submit()
            }
          }}
          rows={1}
          placeholder="メッセージを入力"
          aria-label="メッセージ（Ctrl + Enter で送信）"
          title="Ctrl + Enter で送信"
          className="max-h-40 min-h-11 flex-1 resize-none rounded-lg py-2.5"
        />

        <Button size="icon" aria-label="送信" disabled={!text.trim()} onClick={submit}>
          <Send className="size-5" />
        </Button>
      </div>

      <AttachmentDialog
        kind={attachOpen}
        roomId={roomId}
        onClose={() => setAttachOpen(null)}
      />
      <PollDialog open={pollOpen} roomId={roomId} onOpenChange={setPollOpen} />
    </div>
  )
}

/** 実ファイルは扱えないので、名前と説明を入力してダミーの添付を送る */
function AttachmentDialog({
  kind,
  roomId,
  onClose,
}: {
  kind: null | 'image' | 'file'
  roomId: string
  onClose: () => void
}) {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [name, setName] = useState('')
  const [caption, setCaption] = useState('')

  useEffect(() => {
    if (kind) {
      setName(kind === 'image' ? '院内で撮影した写真.jpg' : '資料.pdf')
      setCaption('')
    }
  }, [kind])

  return (
    <Dialog open={!!kind} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{kind === 'image' ? '写真を送る' : 'ファイルを送る'}</DialogTitle>
          <DialogDescription>
            プロトタイプでは実際のファイルを扱えません。名前と説明だけのダミーを送ります。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="attach-name">ファイル名</Label>
            <Input id="attach-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="attach-caption">説明（任意）</Label>
            <Input
              id="attach-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={kind === 'image' ? '何が写っているか' : '資料の内容'}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline">キャンセル</Button>
          </DialogClose>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              sendMessage(roomId, {
                body: caption.trim(),
                type: kind === 'image' ? 'image' : 'file',
                attachments: [
                  {
                    id: uid('a'),
                    kind: kind === 'image' ? 'image' : 'file',
                    name: name.trim(),
                    size: kind === 'image' ? '1.4 MB' : '256 KB',
                    accent: '#3157b7',
                    ...(caption.trim() ? { caption: caption.trim() } : {}),
                  },
                ],
              })
              onClose()
              toast.success('送信しました')
            }}
          >
            送信
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** グループ内の簡易アンケート */
function PollDialog({
  open,
  roomId,
  onOpenChange,
}: {
  open: boolean
  roomId: string
  onOpenChange: (open: boolean) => void
}) {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiple, setMultiple] = useState(false)

  const valid = question.trim() && options.filter((o) => o.trim()).length >= 2

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setQuestion('')
          setOptions(['', ''])
          setMultiple(false)
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>アンケートを作成</DialogTitle>
          <DialogDescription>このルームのメンバーが回答できます。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="poll-q">質問</Label>
            <Input
              id="poll-q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例）勉強会に参加できる日"
            />
          </div>
          <div className="space-y-1.5">
            <Label>選択肢</Label>
            {options.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) =>
                  setOptions((prev) => prev.map((o, i) => (i === index ? e.target.value : o)))
                }
                placeholder={`選択肢 ${index + 1}`}
                aria-label={`選択肢 ${index + 1}`}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOptions((prev) => [...prev, ''])}
              disabled={options.length >= 6}
            >
              選択肢を追加
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={multiple}
              onChange={(e) => setMultiple(e.target.checked)}
              className="size-4"
            />
            複数選択を許可する
          </label>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline">キャンセル</Button>
          </DialogClose>
          <Button
            disabled={!valid}
            onClick={() => {
              sendMessage(roomId, {
                body: '',
                type: 'form',
                poll: {
                  question: question.trim(),
                  multiple,
                  options: options
                    .filter((o) => o.trim())
                    .map((label) => ({ id: uid('o'), label: label.trim(), voterIds: [] })),
                },
              })
              onOpenChange(false)
              toast.success('アンケートを送信しました')
            }}
          >
            送信
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
