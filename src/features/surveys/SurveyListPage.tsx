/**
 * アンケート一覧。実施中と終了をタブで分け、自分が回答済みかを一目で分かるようにする。
 */
import { CircleCheck, ClipboardList, Plus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SurveyComposeDialog } from '@/features/surveys/SurveyComposeDialog'
import { formatDateTime } from '@/lib/format'
import { useHubStore } from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'
import type { Survey } from '@/types'
import { hasRole } from '@/types'

function SurveyCard({ survey, answered }: { survey: Survey; answered: boolean }) {
  return (
    <li>
      <Link
        to={`/surveys/${survey.id}`}
        className="block rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-raised"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{survey.title}</h3>
          <span
            className={
              answered
                ? 'inline-flex shrink-0 items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold text-success'
                : 'inline-flex shrink-0 items-center gap-1 rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning'
            }
          >
            {answered ? <CircleCheck className="size-3.5" aria-hidden /> : null}
            {answered ? '回答済み' : '未回答'}
          </span>
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{survey.description}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden />
            回答 {survey.responses.length} 件
          </span>
          {survey.closesAt && (
            <span>
              {survey.status === 'open' ? '締め切り' : '締め切り済み'}：
              {formatDateTime(survey.closesAt)}
            </span>
          )}
          {survey.anonymous && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">匿名</span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          対象：{survey.targets.join('・')}
        </p>
      </Link>
    </li>
  )
}

export function SurveyListPage() {
  const me = useCurrentUser()
  const surveys = useHubStore((s) => s.surveys)
  const canCreate = hasRole(me.role, 'DEPARTMENT_ADMIN')

  const [tab, setTab] = useState('open')
  const [composeOpen, setComposeOpen] = useState(false)

  const openSurveys = useMemo(() => surveys.filter((s) => s.status === 'open'), [surveys])
  const closedSurveys = useMemo(() => surveys.filter((s) => s.status === 'closed'), [surveys])

  function answeredBy(survey: Survey) {
    return survey.responses.some((r) => r.userId === me.id)
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader
        title="アンケート"
        description={`実施中 ${openSurveys.length} 件`}
        backTo="/menu"
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Plus className="size-4" aria-hidden />
              新規作成
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="open">実施中（{openSurveys.length}）</TabsTrigger>
            <TabsTrigger value="closed">終了（{closedSurveys.length}）</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {openSurveys.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="実施中のアンケートはありません"
                description="新しいアンケートが配信されるとここに表示されます。"
              />
            ) : (
              <ul className="space-y-3">
                {openSurveys.map((survey) => (
                  <SurveyCard key={survey.id} survey={survey} answered={answeredBy(survey)} />
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="closed">
            {closedSurveys.length === 0 ? (
              <EmptyState icon={ClipboardList} title="終了したアンケートはありません" />
            ) : (
              <ul className="space-y-3">
                {closedSurveys.map((survey) => (
                  <SurveyCard key={survey.id} survey={survey} answered={answeredBy(survey)} />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <DemoNotice />
      </div>

      {canCreate && <SurveyComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />}
    </div>
  )
}
