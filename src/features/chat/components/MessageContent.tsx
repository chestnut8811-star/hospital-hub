import { BarChart3, ExternalLink, FileText, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chatStore'
import type { Attachment, LinkPreview, Message } from '@/types'

/** 添付ファイル。実ファイルは持たないので、種類が分かる見た目にとどめる。 */
export function AttachmentCard({ attachment }: { attachment: Attachment }) {
  if (attachment.kind === 'image') {
    return (
      <figure className="overflow-hidden rounded-lg border border-border bg-card">
        <div
          className="flex h-40 items-center justify-center"
          style={{ backgroundColor: `${attachment.accent ?? '#717784'}1f` }}
        >
          <ImageIcon
            className="size-10"
            style={{ color: attachment.accent ?? '#717784' }}
            aria-hidden
          />
        </div>
        <figcaption className="px-3 py-2 text-xs text-muted-foreground">
          {attachment.caption ?? attachment.name}
        </figcaption>
      </figure>
    )
  }
  return (
    <button
      type="button"
      onClick={() => toast('プロトタイプではファイルを開けません', { description: attachment.name })}
      className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
        <FileText className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{attachment.name}</span>
        {attachment.size && (
          <span className="block text-xs text-muted-foreground">{attachment.size}</span>
        )}
      </span>
    </button>
  )
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** URL のプレビュー。院内ポータルなど、実際には開けないリンクを示す。 */
export function LinkPreviewCard({ link }: { link: LinkPreview }) {
  return (
    <button
      type="button"
      onClick={() =>
        toast('プロトタイプではリンクを開けません', { description: link.url })
      }
      className="flex w-full flex-col gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <ExternalLink className="size-3" aria-hidden />
        {link.site ?? hostOf(link.url)}
      </span>
      <span className="text-sm font-medium">{link.title}</span>
      {link.description && (
        <span className="text-xs leading-relaxed text-muted-foreground">{link.description}</span>
      )}
    </button>
  )
}

/** アンケート（メッセージ内の簡易投票） */
export function PollCard({ message, meId }: { message: Message; meId: string }) {
  const votePoll = useChatStore((s) => s.votePoll)
  const poll = message.poll
  if (!poll) return null
  const total = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0)

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-0.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <BarChart3 className="size-3.5" aria-hidden />
        アンケート{poll.multiple ? '（複数選択可）' : ''}
      </p>
      <p className="mb-2.5 text-sm font-semibold">{poll.question}</p>
      <ul className="space-y-2">
        {poll.options.map((option) => {
          const voted = option.voterIds.includes(meId)
          const ratio = total === 0 ? 0 : Math.round((option.voterIds.length / total) * 100)
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => votePoll(message.id, option.id)}
                aria-pressed={voted}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left transition-colors',
                  voted ? 'border-primary bg-info-soft' : 'border-border hover:bg-muted',
                )}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className={cn('min-w-0 flex-1', voted && 'font-semibold')}>
                    {option.label}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {option.voterIds.length}人・{ratio}%
                  </span>
                </span>
                <Progress value={ratio} className="mt-1.5 h-1.5" />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">回答 {total} 件</p>
    </div>
  )
}

/** 「確認しました」ボタン。重要メッセージに付く（設計書 §14） */
export function AckPanel({ message, meId, total }: { message: Message; meId: string; total: number }) {
  const acknowledge = useChatStore((s) => s.acknowledge)
  const ack = message.ack
  if (!ack?.required) return null
  const confirmed = ack.confirmedUserIds.length
  const done = ack.confirmedUserIds.includes(meId)

  return (
    <div className="mt-3 border-t border-border pt-3">
      {done ? (
        <p className="text-sm font-medium text-success">✓ 確認済みです</p>
      ) : (
        <Button
          className="w-full"
          onClick={() => {
            acknowledge(message.id)
            toast.success('確認しました')
          }}
        >
          確認しました
        </Button>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        確認 {confirmed} / {total}
      </p>
      <Progress value={total === 0 ? 0 : (confirmed / total) * 100} className="mt-1 h-1.5" />
    </div>
  )
}
