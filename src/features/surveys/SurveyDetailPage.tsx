/**
 * アンケート詳細。回答 → 回答済み表示 → 集計、の順に出す。
 * 集計は「終了済み」または DEPARTMENT_ADMIN 以上のときだけ表示する。
 */
import { CircleCheck, ClipboardList, Lock, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { SurveyAnswerForm } from '@/features/surveys/SurveyAnswerForm'
import { SurveyResults } from '@/features/surveys/SurveyResults'
import { formatDateTime } from '@/lib/format'
import { useHubStore } from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'
import type { SurveyAnswer, SurveyQuestion } from '@/types'
import { hasRole } from '@/types'

/** 自分の回答を読みやすい文字列にする */
function answerText(question: SurveyQuestion, answer: SurveyAnswer | undefined): string {
  if (!answer) return '（未回答）'
  if (Array.isArray(answer.value)) return answer.value.join('・')
  if (question.type === 'scale') return `${answer.value} / 5`
  return String(answer.value)
}

export function SurveyDetailPage() {
  const { surveyId } = useParams<{ surveyId: string }>()
  const me = useCurrentUser()
  const surveys = useHubStore((s) => s.surveys)
  const isAdmin = hasRole(me.role, 'DEPARTMENT_ADMIN')

  const [editing, setEditing] = useState(false)

  const survey = useMemo(() => surveys.find((s) => s.id === surveyId), [surveys, surveyId])
  const myResponse = useMemo(
    () => survey?.responses.find((r) => r.userId === me.id),
    [survey, me.id],
  )

  if (!survey) {
    return (
      <div className="scrollbar-slim h-full overflow-y-auto">
        <PageHeader title="アンケート" backTo="/surveys" />
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <EmptyState
            icon={ClipboardList}
            title="アンケートが見つかりません"
            description="削除されたか、リンクが正しくない可能性があります。一覧から選び直してください。"
          />
        </div>
      </div>
    )
  }

  const closed = survey.status === 'closed'
  const showResults = closed || isAdmin
  const showForm = !closed && (!myResponse || editing)

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="アンケート" backTo="/surveys" />
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                closed
                  ? 'inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground'
                  : 'inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold text-success'
              }
            >
              {closed ? <Lock className="size-3.5" aria-hidden /> : null}
              {closed ? '終了' : '実施中'}
            </span>
            {survey.anonymous && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                匿名
              </span>
            )}
          </div>
          <h2 className="mt-2 text-lg font-bold leading-snug">{survey.title}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {survey.description}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            対象：{survey.targets.join('・')}
            {survey.closesAt && ` / 締め切り：${formatDateTime(survey.closesAt)}`}
          </p>
        </section>

        {closed && !myResponse && (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            このアンケートは締め切られています。新しい回答は受け付けていません。
          </p>
        )}

        {myResponse && !editing && (
          <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CircleCheck className="size-4" aria-hidden />
              回答済みです（{formatDateTime(myResponse.answeredAt)}）
            </p>
            <dl className="mt-3 space-y-2">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="rounded-lg bg-muted px-3 py-2">
                  <dt className="text-xs text-muted-foreground">
                    Q{index + 1}. {question.text}
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm font-medium">
                    {answerText(
                      question,
                      myResponse.answers.find((a) => a.questionId === question.id),
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {!closed && (
              <Button variant="outline" className="mt-3 w-full" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden />
                回答を修正する
              </Button>
            )}
          </section>
        )}

        {showForm && (
          <SurveyAnswerForm
            survey={survey}
            {...(myResponse ? { current: myResponse } : {})}
            onSubmitted={() => setEditing(false)}
            {...(myResponse ? { onCancel: () => setEditing(false) } : {})}
          />
        )}

        {showResults && <SurveyResults survey={survey} />}

        <DemoNotice />
      </div>
    </div>
  )
}
