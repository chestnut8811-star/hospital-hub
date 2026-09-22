/**
 * 管理画面 / ダッシュボード。
 * 院内ハブの使われ方を数字で示し、直近の動き（監査ログ）を並べる。
 */
import { Activity, MessageSquare, Siren, TriangleAlert, Users, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { Progress } from '@/components/ui/progress'
import { todayKey } from '@/lib/demoDay'
import { formatFullDateTime } from '@/lib/format'
import { useChatStore } from '@/stores/chatStore'
import { useDirectoryStore } from '@/stores/directoryStore'
import { useHubStore } from '@/stores/hubStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { StatCard } from '@/features/admin/components/StatCard'
import { useUserLookup } from '@/features/admin/useUserLookup'

/** ISO 日時をローカルの「YYYY-MM-DD」にする（todayKey と比べるため） */
function localDayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DashboardSection() {
  const users = useDirectoryStore((s) => s.users)
  const rooms = useChatStore((s) => s.rooms)
  const messages = useChatStore((s) => s.messages)
  const troubles = useHubStore((s) => s.troubles)
  const safetyDrills = useHubStore((s) => s.safetyDrills)
  const auditLogs = useHubStore((s) => s.auditLogs)
  const lookup = useUserLookup()

  const activeStaff = useMemo(
    () => users.filter((u) => u.kind === 'human' && u.active).length,
    [users],
  )

  const todayMessages = useMemo(() => {
    const key = todayKey()
    return messages.filter((m) => !m.deleted && localDayKey(m.createdAt) === key).length
  }, [messages])

  /** 確認要求つきの重要／緊急メッセージのうち、まだ全員が確認していないもの */
  const unconfirmed = useMemo(() => {
    const memberCount = new Map(rooms.map((r) => [r.id, r.memberIds.length]))
    return messages.filter((m) => {
      if (m.deleted || !m.priority || m.priority === 'normal') return false
      if (!m.ack?.required) return false
      return m.ack.confirmedUserIds.length < (memberCount.get(m.roomId) ?? 0)
    }).length
  }, [messages, rooms])

  const troubleStats = useMemo(() => {
    const open = troubles.filter((t) => t.status === 'open').length
    const inProgress = troubles.filter((t) => t.status === 'in_progress').length
    return { open, inProgress, total: open + inProgress }
  }, [troubles])

  const drill = safetyDrills.find((d) => d.active) ?? safetyDrills[0]
  const answered = drill?.responses.length ?? 0
  const target = drill?.targetUserIds.length ?? 0
  const rate = target > 0 ? Math.round((answered / target) * 100) : 0

  const recent = useMemo(() => auditLogs.slice(0, 5), [auditLogs])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Users}
          label="アクティブ職員数"
          value={`${activeStaff} 名`}
          hint="名簿に在籍ありで登録されている職員"
        />
        <StatCard
          icon={MessageSquare}
          label="今日のメッセージ数"
          value={`${todayMessages} 件`}
          hint="全ルームの合計（削除済みを除く）"
        />
        <StatCard
          icon={TriangleAlert}
          label="未確認の重要メッセージ"
          value={`${unconfirmed} 件`}
          hint="「確認しました」が全員そろっていないもの"
          tone={unconfirmed > 0 ? 'warning' : 'default'}
        />
        <StatCard
          icon={Wrench}
          label="対応中のトラブル"
          value={`${troubleStats.total} 件`}
          hint={`受付 ${troubleStats.open} 件 / 対応中 ${troubleStats.inProgress} 件`}
          tone={troubleStats.total > 0 ? 'danger' : 'default'}
        />
        <StatCard
          icon={Siren}
          label="安否確認の回答率"
          value={`${rate}%`}
          hint={drill ? `${drill.title}（${answered} / ${target} 名）` : '実施中の安否確認はありません'}
          tone={rate >= 80 ? 'success' : 'warning'}
        >
          <Progress value={rate} className="h-2" aria-label="安否確認の回答率" />
        </StatCard>
      </div>

      <AdminPanel title="最近の動き" description="院内ハブ上で行われた直近の操作です。" padded={false}>
        {recent.length === 0 ? (
          <EmptyState icon={Activity} title="記録がありません" className="py-10" />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((log) => (
              <li key={log.id} className="flex flex-col gap-0.5 px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-foreground">{log.action}</span>
                  <span className="text-sm text-muted-foreground">{log.target}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {lookup(log.actorId).name} ・ {formatFullDateTime(log.at)} ・ {log.detail}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  )
}
