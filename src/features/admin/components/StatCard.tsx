/** ダッシュボードの統計カード。色だけに頼らずアイコンと文言も出す。 */
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatTone = 'default' | 'danger' | 'warning' | 'success'

const TONES: Record<StatTone, string> = {
  default: 'bg-secondary text-secondary-foreground',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  /** 内訳や補足（「受付 2 件 / 対応中 1 件」など） */
  hint?: string
  tone?: StatTone
  /** 進捗バーなどを足したいとき */
  children?: ReactNode
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
  children,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span
          className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', TONES[tone])}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl leading-tight font-bold tabular-nums text-foreground">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
