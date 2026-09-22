/**
 * 機器トラブル報告の詳細（設計書 §18）。
 * 対応記録の追記は全員、状態の変更と担当者の割り当てはグループ管理者以上に出す。
 */
import { MessagesSquare, Send, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { UserAvatar } from '@/components/common/UserAvatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TroubleSeverityBadge, TroubleStatusBadge } from '@/features/trouble/TroubleBadges'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useStaff, useUser } from '@/stores/directoryStore'
import { useHubStore } from '@/stores/hubStore'
import { useHasRole } from '@/stores/sessionStore'
import type { TroubleStatus, TroubleUpdate } from '@/types'
import { TROUBLE_STATUS_LABEL } from '@/types'

const STATUSES: TroubleStatus[] = ['open', 'in_progress', 'resolved']

/** 詳細の 1 行 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-b-0 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground sm:w-32 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-foreground">{children}</dd>
    </div>
  )
}

/** 対応履歴の 1 件。最後の 1 件だけ、下へ伸びる縦線を出さない */
function UpdateRow({ update, isLast }: { update: TroubleUpdate; isLast: boolean }) {
  const user = useUser(update.byUserId)
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <UserAvatar user={user} size="xs" />
        {!isLast && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
      </div>
      <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-4')}>
        <p className="text-xs text-muted-foreground">
          {user.name}・{formatDateTime(update.at)}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {update.text}
        </p>
      </div>
    </li>
  )
}

export function TroubleDetailPage() {
  const { troubleId } = useParams<{ troubleId: string }>()
  const trouble = useHubStore((s) => s.troubles.find((t) => t.id === troubleId))
  const addTroubleUpdate = useHubStore((s) => s.addTroubleUpdate)
  const updateTroubleStatus = useHubStore((s) => s.updateTroubleStatus)
  const assignTrouble = useHubStore((s) => s.assignTrouble)
  const canManage = useHasRole('GROUP_ADMIN')
  const staff = useStaff()
  const reporter = useUser(trouble?.reporterId ?? '')
  const assignee = useUser(trouble?.assigneeId ?? '')
  const [note, setNote] = useState('')

  if (!trouble) {
    return (
      <div className="scrollbar-slim h-full overflow-y-auto">
        <PageHeader title="報告の詳細" backTo="/trouble" />
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <EmptyState
            icon={Wrench}
            title="報告が見つかりません"
            description="削除されたか、URL が正しくない可能性があります。"
            action={
              <Button asChild variant="outline">
                <Link to="/trouble">機器トラブル一覧へ戻る</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const submitNote = () => {
    const text = note.trim()
    if (!text) return
    addTroubleUpdate(trouble.id, text)
    setNote('')
    toast.success('対応記録を追記しました')
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title={trouble.deviceName} description={trouble.id} backTo="/trouble" />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <DemoNotice />

        {/* 概要 */}
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex flex-wrap items-center gap-1.5">
            <TroubleSeverityBadge severity={trouble.severity} />
            <TroubleStatusBadge status={trouble.status} />
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{trouble.id}</span>
          </div>

          <dl className="mt-3">
            <Row label="機器カテゴリー">{trouble.category}</Row>
            <Row label="機器名">{trouble.deviceName}</Row>
            <Row label="管理番号">{trouble.assetNo}</Row>
            <Row label="場所">{trouble.location}</Row>
            <Row label="症状">
              <span className="whitespace-pre-wrap">{trouble.symptom}</span>
            </Row>
            {trouble.photoNote && (
              <Row label="写真の説明">
                <span className="whitespace-pre-wrap">{trouble.photoNote}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  プロトタイプのため、写真そのものは添付されていません。
                </span>
              </Row>
            )}
            <Row label="報告者">
              {reporter.name}（{reporter.department}）
            </Row>
            <Row label="報告日時">{formatDateTime(trouble.reportedAt)}</Row>
            <Row label="担当者">{trouble.assigneeId ? assignee.name : '未割当'}</Row>
          </dl>

          <Button asChild variant="outline" className="mt-3 w-full gap-2">
            <Link to={`/chat/${trouble.roomId}`}>
              <MessagesSquare aria-hidden />
              自動投稿された「医療機器トラブル」を開く
            </Link>
          </Button>
        </section>

        {/* 管理者だけの操作 */}
        {canManage && (
          <section className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-border">
            <h2 className="text-sm font-semibold">対応の管理（グループ管理者以上）</h2>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">状態</p>
              <div className="flex gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    variant={trouble.status === status ? 'default' : 'outline'}
                    className="flex-1 px-2"
                    aria-pressed={trouble.status === status}
                    onClick={() => {
                      if (trouble.status === status) return
                      updateTroubleStatus(trouble.id, status)
                      toast.success(`状態を「${TROUBLE_STATUS_LABEL[status]}」に変更しました`)
                    }}
                  >
                    {TROUBLE_STATUS_LABEL[status]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trouble-assignee">担当者</Label>
              <Select
                value={trouble.assigneeId ?? ''}
                onValueChange={(userId) => {
                  assignTrouble(trouble.id, userId)
                  toast.success('担当者を割り当てました')
                }}
              >
                <SelectTrigger id="trouble-assignee" className="w-full">
                  <SelectValue placeholder="担当者を選んでください" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}（{user.department}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        {/* 対応履歴 */}
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <h2 className="text-sm font-semibold">対応履歴</h2>
          {trouble.updates.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">まだ対応記録はありません。</p>
          ) : (
            <ul className="mt-3">
              {trouble.updates.map((update, index) => (
                <UpdateRow
                  key={`${update.at}-${index}`}
                  update={update}
                  isLast={index === trouble.updates.length - 1}
                />
              ))}
            </ul>
          )}

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <Label htmlFor="trouble-note">対応記録を追記する</Label>
            <Textarea
              id="trouble-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="対応した内容・連絡した相手・次の予定などを書いてください"
            />
            <Button className="w-full gap-2" disabled={!note.trim()} onClick={submitNote}>
              <Send aria-hidden />
              追記する
            </Button>
          </div>
        </section>

        <div className="pb-6" />
      </div>
    </div>
  )
}
