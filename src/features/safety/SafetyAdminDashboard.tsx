/**
 * 安否確認の集計（DEPARTMENT_ADMIN 以上）。
 * 「誰が支援を必要としているか」「誰から返事が無いか」をすぐ拾えることを優先する。
 */
import { CircleCheck, CircleHelp, LifeBuoy } from 'lucide-react'
import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDirectoryStore } from '@/stores/directoryStore'
import type { SafetyCondition, SafetyDrill, SafetyLocation, User } from '@/types'
import { SAFETY_CONDITION_LABEL, SAFETY_LOCATION_LABEL } from '@/types'

const LOCATIONS: SafetyLocation[] = ['hospital', 'home', 'other']
const CONDITIONS: SafetyCondition[] = ['ok', 'minor_injury', 'need_support']

/** 数と割合を横棒で示す（色だけに頼らず件数も必ず出す） */
function BreakdownRow({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {count} 名 ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </li>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CircleCheck
  label: string
  value: number
  tone: 'success' | 'muted' | 'danger'
}) {
  const toneClass =
    tone === 'success'
      ? 'bg-success-soft text-success'
      : tone === 'danger'
        ? 'bg-danger-soft text-danger'
        : 'bg-muted text-muted-foreground'
  return (
    <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <span className={cn('mb-2 inline-flex size-8 items-center justify-center rounded-lg', toneClass)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export function SafetyAdminDashboard({ drill }: { drill: SafetyDrill }) {
  const users = useDirectoryStore((s) => s.users)

  const summary = useMemo(() => {
    const byId = new Map<string, User>(users.map((u) => [u.id, u]))
    const respondedIds = new Set(drill.responses.map((r) => r.userId))
    const allIds = Array.from(new Set([...drill.targetUserIds, ...respondedIds]))
    const pending = allIds.filter((id) => !respondedIds.has(id)).map((id) => byId.get(id))
    const needSupport = drill.responses.filter((r) => r.condition === 'need_support')
    return {
      byId,
      total: allIds.length,
      responded: respondedIds.size,
      pending,
      needSupport,
      locationCounts: LOCATIONS.map((key) => ({
        key,
        count: drill.responses.filter((r) => r.location === key).length,
      })),
      conditionCounts: CONDITIONS.map((key) => ({
        key,
        count: drill.responses.filter((r) => r.condition === key).length,
      })),
    }
  }, [drill, users])

  const rate = summary.total > 0 ? Math.round((summary.responded / summary.total) * 100) : 0

  return (
    <section className="space-y-3" aria-labelledby="safety-admin">
      <h2 id="safety-admin" className="px-1 text-sm font-semibold text-muted-foreground">
        回答状況（管理者向け）
      </h2>

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={CircleCheck} label="回答済" value={summary.responded} tone="success" />
        <StatCard icon={CircleHelp} label="未回答" value={summary.pending.length} tone="muted" />
        <StatCard
          icon={LifeBuoy}
          label="支援が必要"
          value={summary.needSupport.length}
          tone="danger"
        />
      </div>

      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">回答率</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {summary.responded} / {summary.total} 名（{rate}%）
          </p>
        </div>
        <Progress value={rate} aria-label={`回答率 ${rate}%`} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="mb-2 text-sm font-semibold">場所の内訳</p>
          <ul className="space-y-2">
            {summary.locationCounts.map((item) => (
              <BreakdownRow
                key={item.key}
                label={SAFETY_LOCATION_LABEL[item.key]}
                count={item.count}
                total={summary.responded}
              />
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="mb-2 text-sm font-semibold">状態の内訳</p>
          <ul className="space-y-2">
            {summary.conditionCounts.map((item) => (
              <BreakdownRow
                key={item.key}
                label={SAFETY_CONDITION_LABEL[item.key]}
                count={item.count}
                total={summary.responded}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <LifeBuoy className="size-4 text-danger" aria-hidden />
          支援が必要な職員（{summary.needSupport.length} 名）
        </p>
        {summary.needSupport.length === 0 ? (
          <p className="text-sm text-muted-foreground">現在、支援が必要という回答はありません。</p>
        ) : (
          <ul className="space-y-2">
            {summary.needSupport.map((response) => {
              const user = summary.byId.get(response.userId)
              return (
                <li key={response.userId} className="rounded-lg bg-danger-soft px-3 py-2">
                  <p className="text-sm font-semibold">
                    {user?.name ?? response.userId}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {user?.department}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {SAFETY_LOCATION_LABEL[response.location]} /{' '}
                    {formatDateTime(response.respondedAt)}
                  </p>
                  {response.comment && (
                    <p className="mt-1 whitespace-pre-wrap text-sm">{response.comment}</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <p className="mb-2 text-sm font-semibold">未回答の職員（{summary.pending.length} 名）</p>
        {summary.pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">全員から回答がありました。</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {summary.pending.map((user, index) => (
              <li
                key={user?.id ?? index}
                className="rounded-lg bg-muted px-2.5 py-1.5 text-sm"
              >
                {user?.name ?? '—'}
                <span className="ml-1.5 text-xs text-muted-foreground">{user?.department}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
