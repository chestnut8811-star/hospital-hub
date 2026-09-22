import { formatBadgeCount } from '@/lib/format'
import { cn } from '@/lib/utils'

interface UnreadBadgeProps {
  count: number
  /** 未確認の緊急メッセージを含むときは赤にする */
  emergency?: boolean
  muted?: boolean
  className?: string
}

export function UnreadBadge({ count, emergency, muted, className }: UnreadBadgeProps) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold leading-none tabular-nums',
        emergency
          ? 'bg-danger text-danger-foreground'
          : muted
            ? 'bg-muted-foreground/70 text-white'
            : 'bg-primary text-primary-foreground',
        className,
      )}
      aria-label={`未読 ${count} 件`}
    >
      {formatBadgeCount(count)}
    </span>
  )
}
