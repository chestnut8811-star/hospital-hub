/**
 * 機器トラブル報告のバッジ。
 * 色だけで情報を伝えないよう、緊急度・状態ともにアイコンと文言を必ず添える。
 */
import { CircleCheck, Inbox, Info, Siren, TriangleAlert, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TroubleSeverity, TroubleStatus } from '@/types'
import { TROUBLE_STATUS_LABEL } from '@/types'

const CHIP = 'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold'

const SEVERITY: Record<TroubleSeverity, { chip: string; label: string; Icon: LucideIcon }> = {
  high: { chip: 'bg-danger text-danger-foreground', label: '緊急度 高', Icon: Siren },
  medium: { chip: 'bg-warning text-warning-foreground', label: '緊急度 中', Icon: TriangleAlert },
  low: { chip: 'bg-secondary text-secondary-foreground', label: '緊急度 低', Icon: Info },
}

export function TroubleSeverityBadge({
  severity,
  className,
}: {
  severity: TroubleSeverity
  className?: string
}) {
  const { chip, label, Icon } = SEVERITY[severity]
  return (
    <span className={cn(CHIP, chip, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}

const STATUS: Record<TroubleStatus, { chip: string; Icon: LucideIcon }> = {
  open: { chip: 'bg-danger-soft text-foreground', Icon: Inbox },
  in_progress: { chip: 'bg-warning-soft text-foreground', Icon: Wrench },
  resolved: { chip: 'bg-success-soft text-foreground', Icon: CircleCheck },
}

export function TroubleStatusBadge({
  status,
  className,
}: {
  status: TroubleStatus
  className?: string
}) {
  const { chip, Icon } = STATUS[status]
  return (
    <span className={cn(CHIP, chip, className)}>
      <Icon className="size-3.5" aria-hidden />
      {TROUBLE_STATUS_LABEL[status]}
    </span>
  )
}
