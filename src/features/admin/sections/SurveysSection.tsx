/**
 * 管理画面 / アンケート。
 * 回答状況の確認と、受付の締め切り・再開（確認ダイアログを挟む）。
 */
import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFullDateTime } from '@/lib/format'
import { useHubStore } from '@/stores/hubStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { useUserLookup } from '@/features/admin/useUserLookup'

interface PendingChange {
  surveyId: string
  title: string
  next: 'open' | 'closed'
}

export function SurveysSection() {
  const surveys = useHubStore((s) => s.surveys)
  const setSurveyStatus = useHubStore((s) => s.setSurveyStatus)
  const lookup = useUserLookup()

  const [pending, setPending] = useState<PendingChange | null>(null)

  const rows = useMemo(
    () => [...surveys].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [surveys],
  )

  const applyChange = () => {
    if (!pending) return
    setSurveyStatus(pending.surveyId, pending.next)
    toast.success(
      pending.next === 'closed'
        ? `「${pending.title}」を締め切りました`
        : `「${pending.title}」の受付を再開しました`,
    )
  }

  return (
    <>
      <AdminPanel
        title="アンケート一覧"
        description={`${rows.length} 件のアンケートがあります。`}
        padded={false}
      >
        {rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="アンケートがありません" className="py-10" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">タイトル</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead className="text-right">回答数</TableHead>
                  <TableHead>作成者</TableHead>
                  <TableHead>締め切り</TableHead>
                  <TableHead className="pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="max-w-72 truncate pl-4 font-medium text-foreground">
                      {survey.title}
                    </TableCell>
                    <TableCell>
                      {survey.status === 'open' ? (
                        <Badge className="bg-success text-success-foreground">受付中</Badge>
                      ) : (
                        <Badge variant="secondary">締め切り済</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {survey.responses.length} 件
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lookup(survey.createdBy).name}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {survey.closesAt ? formatFullDateTime(survey.closesAt) : '設定なし'}
                    </TableCell>
                    <TableCell className="pr-4">
                      <span className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/surveys/${survey.id}`}>詳細</Link>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setPending({
                              surveyId: survey.id,
                              title: survey.title,
                              next: survey.status === 'open' ? 'closed' : 'open',
                            })
                          }
                        >
                          {survey.status === 'open' ? '締め切る' : '再開する'}
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminPanel>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(next) => {
          if (!next) setPending(null)
        }}
        title={pending?.next === 'closed' ? 'アンケートを締め切りますか？' : '受付を再開しますか？'}
        description={
          pending?.next === 'closed'
            ? `「${pending.title}」への新しい回答を受け付けなくなります。`
            : `「${pending?.title ?? ''}」への回答を再び受け付けます。`
        }
        confirmLabel={pending?.next === 'closed' ? '締め切る' : '再開する'}
        onConfirm={applyChange}
      />
    </>
  )
}
