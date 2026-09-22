/**
 * 管理画面 / 安否確認。
 * 回答状況の集計と、訓練の開始・終了（確認ダイアログを挟む）。
 */
import { CircleCheck, Clock, LifeBuoy, Siren } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatFullDateTime } from '@/lib/format'
import { useHubStore } from '@/stores/hubStore'
import { SAFETY_CONDITION_LABEL, SAFETY_LOCATION_LABEL } from '@/types'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { StatCard } from '@/features/admin/components/StatCard'
import { useUserLookup } from '@/features/admin/useUserLookup'

export function SafetySection() {
  const safetyDrills = useHubStore((s) => s.safetyDrills)
  const setDrillActive = useHubStore((s) => s.setDrillActive)
  const lookup = useUserLookup()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const drill = safetyDrills.find((d) => d.active) ?? safetyDrills[0]

  const stats = useMemo(() => {
    const target = drill?.targetUserIds.length ?? 0
    const responses = drill?.responses ?? []
    const needSupport = responses.filter((r) => r.condition === 'need_support')
    const minorInjury = responses.filter((r) => r.condition === 'minor_injury').length
    return {
      target,
      answered: responses.length,
      pending: Math.max(target - responses.length, 0),
      needSupport,
      minorInjury,
      rate: target > 0 ? Math.round((responses.length / target) * 100) : 0,
    }
  }, [drill])

  if (!drill) {
    return (
      <AdminPanel title="安否確認" description="実施中・過去の安否確認はありません。">
        <EmptyState
          icon={Siren}
          title="安否確認がありません"
          description="デモデータに安否確認が登録されていません。"
          className="py-10"
        />
      </AdminPanel>
    )
  }

  const toggleDrill = () => {
    setDrillActive(drill.id, !drill.active)
    toast.success(drill.active ? '安否確認を終了しました' : '安否確認を開始しました')
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPanel
        title={drill.title}
        description={`${formatFullDateTime(drill.startedAt)} 開始 ・ 対象 ${stats.target} 名`}
        actions={
          <Button
            size="sm"
            variant={drill.active ? 'outline' : 'default'}
            onClick={() => setConfirmOpen(true)}
          >
            {drill.active ? '訓練を終了する' : '訓練を開始する'}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {drill.active ? (
              <Badge className="bg-danger text-danger-foreground">実施中</Badge>
            ) : (
              <Badge variant="secondary">終了</Badge>
            )}
            {drill.isDrill && <Badge variant="outline">訓練</Badge>}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={CircleCheck}
              label="回答済"
              value={`${stats.answered} 名`}
              tone="success"
            />
            <StatCard
              icon={Clock}
              label="未回答"
              value={`${stats.pending} 名`}
              tone={stats.pending > 0 ? 'warning' : 'default'}
            />
            <StatCard
              icon={LifeBuoy}
              label="支援が必要"
              value={`${stats.needSupport.length} 名`}
              hint={stats.minorInjury > 0 ? `ほかに軽傷 ${stats.minorInjury} 名` : undefined}
              tone={stats.needSupport.length > 0 ? 'danger' : 'default'}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-foreground">回答率</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {stats.rate}%（{stats.answered} / {stats.target} 名）
              </span>
            </div>
            <Progress value={stats.rate} className="h-2.5" aria-label="安否確認の回答率" />
          </div>
        </div>
      </AdminPanel>

      <AdminPanel
        title="支援が必要な職員"
        description="「支援が必要」と回答した職員です。連絡と対応の優先度が高い順に確認してください。"
        padded={false}
      >
        {stats.needSupport.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            title="支援が必要な職員はいません"
            description="現時点で「支援が必要」の回答はありません。"
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-border">
            {stats.needSupport.map((response) => {
              const user = lookup(response.userId)
              return (
                <li key={response.userId} className="flex items-start gap-3 px-4 py-3">
                  <UserAvatar user={user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-foreground">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.department} / {user.jobTitle}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge className="bg-danger text-danger-foreground">
                        {SAFETY_CONDITION_LABEL[response.condition]}
                      </Badge>
                      <Badge variant="outline">
                        {SAFETY_LOCATION_LABEL[response.location]}
                      </Badge>
                      <Badge variant="outline">
                        {response.canCome ? '参集できる' : '参集できない'}
                      </Badge>
                    </div>
                    {response.comment && (
                      <p className="mt-1 text-sm leading-relaxed text-foreground">
                        {response.comment}
                      </p>
                    )}
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      回答 {formatFullDateTime(response.respondedAt)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </AdminPanel>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={drill.active ? '安否確認を終了しますか？' : '安否確認を開始しますか？'}
        description={
          drill.active
            ? '職員の回答フォームが閉じます。集計結果は残ります。'
            : '対象の職員に回答フォームが表示されます。これは訓練用のデモ操作です。'
        }
        confirmLabel={drill.active ? '終了する' : '開始する'}
        onConfirm={toggleDrill}
      />
    </div>
  )
}
