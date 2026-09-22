/** 機器トラブル報告 1 件分のカード。押すと詳細へ移動する。 */
import { Barcode, ChevronRight, MapPin, User, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TroubleSeverityBadge, TroubleStatusBadge } from '@/features/trouble/TroubleBadges'
import { formatDateTime, truncate } from '@/lib/format'
import { useUser } from '@/stores/directoryStore'
import type { TroubleReport } from '@/types'

export function TroubleCard({ trouble }: { trouble: TroubleReport }) {
  const reporter = useUser(trouble.reporterId)
  // フックは条件分岐の中で呼べないため、担当者未割当でも呼んでおく（表示は下で出し分ける）
  const assignee = useUser(trouble.assigneeId ?? '')

  return (
    <Link
      to={`/trouble/${trouble.id}`}
      className="block rounded-xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <TroubleSeverityBadge severity={trouble.severity} />
        <TroubleStatusBadge status={trouble.status} />
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{trouble.id}</span>
      </div>

      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-semibold text-foreground">
            {trouble.deviceName}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Barcode className="size-3.5" aria-hidden />
              管理番号 {trouble.assetNo}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {trouble.location}
            </span>
          </p>
        </div>
        <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {truncate(trouble.symptom, 70)}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="size-3.5" aria-hidden />
          報告 {reporter.name}・{formatDateTime(trouble.reportedAt)}
        </span>
        <span className="inline-flex items-center gap-1">
          <UserCog className="size-3.5" aria-hidden />
          担当 {trouble.assigneeId ? assignee.name : '未割当'}
        </span>
      </div>
    </Link>
  )
}
