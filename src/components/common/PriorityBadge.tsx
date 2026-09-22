import { AlertTriangle, CircleAlert, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types'
import { PRIORITY_LABEL } from '@/types'

const STYLES: Record<Priority, { chip: string; Icon: typeof Info }> = {
  emergency: { chip: 'bg-danger text-danger-foreground', Icon: CircleAlert },
  important: { chip: 'bg-warning text-warning-foreground', Icon: AlertTriangle },
  normal: { chip: 'bg-secondary text-secondary-foreground', Icon: Info },
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
  showIcon?: boolean
}

/** 緊急＝赤 / 重要＝橙 / 通常＝青。色だけに頼らずアイコンと文言も出す（アクセシビリティ） */
export function PriorityBadge({ priority, className, showIcon = true }: PriorityBadgeProps) {
  const { chip, Icon } = STYLES[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
        chip,
        className,
      )}
    >
      {showIcon && <Icon className="size-3.5" aria-hidden />}
      {PRIORITY_LABEL[priority]}
    </span>
  )
}
