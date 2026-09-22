import { Bot, Send, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { buildAiSummary } from '@/features/chat/lib/aiSummary'
import { useChatStore } from '@/stores/chatStore'
import type { Message } from '@/types'
import { AI_USER_ID } from '@/types'

interface AiSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  roomName: string
  messages: Message[]
  meId: string
}

/**
 * AI要約モーダル（設計書 §13）。
 * バックエンドが無いため、実際のメッセージを分類して原文のまま並べ直すだけ。
 * 文章は創作しない。
 */
export function AiSummaryDialog({
  open,
  onOpenChange,
  roomId,
  roomName,
  messages,
  meId,
}: AiSummaryDialogProps) {
  const sendMessage = useChatStore((s) => s.sendMessage)
  const summary = useMemo(() => buildAiSummary(messages, meId), [messages, meId])

  const asText = () =>
    summary.sections
      .map((s) => `【${s.heading}】\n${s.items.map((i) => `・${i.who}：${i.text}`).join('\n')}`)
      .join('\n\n')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-ai text-sm">
              🤖
            </span>
            AI で要約
          </DialogTitle>
          <DialogDescription>
            {roomName}の{summary.targetCount} 件を整理しました。
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-slim max-h-[55vh] space-y-4 overflow-y-auto px-4">
          <p className="rounded-lg border border-ai-border bg-ai-soft px-3 py-2 text-xs leading-relaxed">
            <Sparkles className="mr-1 inline size-3.5 text-ai" aria-hidden />
            この要約は、ルーム内の発言を分類して<strong>原文のまま</strong>並べ直したデモです。
            AI が文章を作っているわけではありません。判断の前に必ず原文を確認してください。
          </p>

          {summary.sections.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              要約できるメッセージがありません。
            </p>
          )}

          {summary.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="mb-1.5 text-sm font-bold">【{section.heading}】</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm leading-relaxed">
                    <span aria-hidden className="text-muted-foreground">
                      ・
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium text-muted-foreground">{item.who}：</span>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(asText())
                toast.success('要約をコピーしました')
              } catch {
                toast.error('コピーできませんでした')
              }
            }}
          >
            コピー
          </Button>
          <Button
            disabled={summary.sections.length === 0}
            onClick={() => {
              sendMessage(roomId, { body: asText(), type: 'ai', senderId: AI_USER_ID })
              onOpenChange(false)
              toast.success('要約をルームに投稿しました')
            }}
          >
            <Send className="size-4" aria-hidden />
            ルームに投稿
          </Button>
        </DialogFooter>
        <p className="px-4 pb-4 text-[11px] text-muted-foreground">
          <Bot className="mr-1 inline size-3" aria-hidden />
          投稿すると AI アシスタントの発言として表示されます。
        </p>
      </DialogContent>
    </Dialog>
  )
}
