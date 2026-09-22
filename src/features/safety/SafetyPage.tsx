/**
 * 安否確認（設計書 §16）。
 *
 * 訓練であることを取り違えないよう、画面上部で必ず「訓練」と明示する。
 * 自分の回答 → 管理者向けの集計、の順に置く。
 */
import { CircleCheck, Pencil, Siren } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { SafetyAdminDashboard } from '@/features/safety/SafetyAdminDashboard'
import { SafetyResponseForm } from '@/features/safety/SafetyResponseForm'
import { formatDateTime } from '@/lib/format'
import { useActiveDrill, useHubStore } from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'
import { SAFETY_CONDITION_LABEL, SAFETY_LOCATION_LABEL, hasRole } from '@/types'

export function SafetyPage() {
  const me = useCurrentUser()
  const drill = useActiveDrill()
  const drills = useHubStore((s) => s.safetyDrills)
  const setDrillActive = useHubStore((s) => s.setDrillActive)
  const isAdmin = hasRole(me.role, 'DEPARTMENT_ADMIN')

  const [editing, setEditing] = useState(false)

  const myResponse = useMemo(
    () => drill?.responses.find((r) => r.userId === me.id),
    [drill, me.id],
  )

  /** 訓練が止まっているときに、管理者が再開できる最新の訓練 */
  const latestDrill = useMemo(
    () => [...drills].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0],
    [drills],
  )

  if (!drill) {
    return (
      <div className="scrollbar-slim h-full overflow-y-auto">
        <PageHeader title="安否確認" backTo="/menu" />
        <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
          <EmptyState
            icon={Siren}
            title="進行中の安否確認はありません"
            description="災害や訓練の際に、対象の職員へ安否確認が配信されます。"
            action={
              isAdmin && latestDrill ? (
                <Button variant="outline" onClick={() => setDrillActive(latestDrill.id, true)}>
                  デモ用：「{latestDrill.title}」を再開する
                </Button>
              ) : undefined
            }
          />
          <DemoNotice />
        </div>
      </div>
    )
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="安否確認" backTo="/menu" />
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        {/* 配信内容 */}
        <section className="rounded-xl bg-danger-soft p-4 ring-1 ring-danger/30">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-danger text-danger-foreground">
              <Siren className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              {drill.isDrill && (
                <p className="text-xs font-bold text-danger">これは訓練です（実災害ではありません）</p>
              )}
              <h2 className="text-base font-semibold leading-snug">{drill.title}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                配信：{formatDateTime(drill.startedAt)}
              </p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{drill.body}</p>
        </section>

        {/* 自分の回答 */}
        {myResponse && !editing ? (
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CircleCheck className="size-4" aria-hidden />
              回答済みです
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted px-3 py-2">
                <dt className="text-xs text-muted-foreground">現在の場所</dt>
                <dd className="font-medium">{SAFETY_LOCATION_LABEL[myResponse.location]}</dd>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <dt className="text-xs text-muted-foreground">現在の状態</dt>
                <dd className="font-medium">{SAFETY_CONDITION_LABEL[myResponse.condition]}</dd>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <dt className="text-xs text-muted-foreground">参集</dt>
                <dd className="font-medium">{myResponse.canCome ? '可能' : '困難'}</dd>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <dt className="text-xs text-muted-foreground">回答日時</dt>
                <dd className="font-medium">{formatDateTime(myResponse.respondedAt)}</dd>
              </div>
            </dl>
            {myResponse.comment && (
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted px-3 py-2 text-sm">
                {myResponse.comment}
              </p>
            )}
            <Button variant="outline" className="mt-3 w-full" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden />
              回答を修正する
            </Button>
          </section>
        ) : (
          <SafetyResponseForm
            drillId={drill.id}
            {...(myResponse ? { current: myResponse } : {})}
            onSubmitted={() => setEditing(false)}
            {...(myResponse ? { onCancel: () => setEditing(false) } : {})}
          />
        )}

        {isAdmin && <SafetyAdminDashboard drill={drill} />}

        <DemoNotice />
      </div>
    </div>
  )
}
