/**
 * アンケートの集計表示。
 * 終了したアンケート、または DEPARTMENT_ADMIN 以上のときだけ出す。
 * 匿名アンケートでは氏名を一切出さない。
 */
import { useMemo } from 'react'
import { formatDateTime } from '@/lib/format'
import { SCALE_VALUES } from '@/features/surveys/constants'
import { useDirectoryStore } from '@/stores/directoryStore'
import type { Survey, SurveyQuestion } from '@/types'

interface ChoiceCount {
  label: string
  count: number
}

interface QuestionStat {
  question: SurveyQuestion
  answered: number
  choices: ChoiceCount[]
  average: number | null
  texts: { key: string; name: string; at: string; value: string }[]
}

function CountBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {count} 件 ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </li>
  )
}

export function SurveyResults({ survey }: { survey: Survey }) {
  const users = useDirectoryStore((s) => s.users)

  const stats = useMemo<QuestionStat[]>(() => {
    const nameOf = (userId: string) => users.find((u) => u.id === userId)?.name ?? '不明'

    return survey.questions.map((question) => {
      const entries = survey.responses
        .map((response) => ({
          response,
          answer: response.answers.find((a) => a.questionId === question.id),
        }))
        .filter((entry) => entry.answer !== undefined)

      const choices: ChoiceCount[] = []
      let average: number | null = null
      const texts: QuestionStat['texts'] = []

      if (question.type === 'single' || question.type === 'multiple') {
        for (const option of question.options ?? []) {
          const count = entries.filter((entry) => {
            const value = entry.answer?.value
            return Array.isArray(value) ? value.includes(option) : value === option
          }).length
          choices.push({ label: option, count })
        }
      } else if (question.type === 'scale') {
        const numbers = entries
          .map((entry) => entry.answer?.value)
          .filter((value): value is number => typeof value === 'number')
        average = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null
        for (const scale of SCALE_VALUES) {
          choices.push({
            label: `${scale}`,
            count: numbers.filter((value) => value === scale).length,
          })
        }
      } else {
        for (const entry of entries) {
          const value = entry.answer?.value
          if (typeof value !== 'string' || value.trim().length === 0) continue
          texts.push({
            key: entry.response.userId,
            name: survey.anonymous ? '匿名' : nameOf(entry.response.userId),
            at: entry.response.answeredAt,
            value,
          })
        }
      }

      return { question, answered: entries.length, choices, average, texts }
    })
  }, [survey, users])

  return (
    <section className="space-y-3" aria-labelledby="survey-results">
      <h2 id="survey-results" className="px-1 text-sm font-semibold text-muted-foreground">
        集計結果（回答 {survey.responses.length} 件{survey.anonymous ? ' / 匿名' : ''}）
      </h2>

      {survey.responses.length === 0 && (
        <p className="rounded-xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/10">
          まだ回答がありません。
        </p>
      )}

      {stats.map((stat, index) => (
        <div key={stat.question.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">
            Q{index + 1} / 回答 {stat.answered} 件
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">{stat.question.text}</p>

          {stat.average !== null && (
            <p className="mt-2 text-sm">
              平均：
              <span className="text-lg font-bold tabular-nums">{stat.average.toFixed(1)}</span>
              <span className="text-muted-foreground"> / 5</span>
            </p>
          )}

          {stat.choices.length > 0 && (
            <ul className="mt-2 space-y-2">
              {stat.choices.map((choice) => (
                <CountBar
                  key={choice.label}
                  label={choice.label}
                  count={choice.count}
                  total={stat.answered}
                />
              ))}
            </ul>
          )}

          {stat.question.type === 'text' &&
            (stat.texts.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">記入された回答はありません。</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {stat.texts.map((text) => (
                  <li key={text.key} className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      {text.name}
                      {!survey.anonymous && ` / ${formatDateTime(text.at)}`}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{text.value}</p>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      ))}
    </section>
  )
}
