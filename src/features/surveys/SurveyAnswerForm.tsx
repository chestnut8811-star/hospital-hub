/**
 * アンケートの回答フォーム。
 * 質問の種別ごとに入力部品を切り替え、必須が埋まるまで送信できないようにする。
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { SCALE_HINT, SCALE_VALUES } from '@/features/surveys/constants'
import { cn } from '@/lib/utils'
import { useHubStore } from '@/stores/hubStore'
import type { Survey, SurveyAnswer, SurveyQuestion, SurveyResponse } from '@/types'

type AnswerValue = string | string[] | number

/** 未入力（空文字・空配列）を「回答なし」として扱う */
function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

interface SurveyAnswerFormProps {
  survey: Survey
  current?: SurveyResponse
  onSubmitted: () => void
  onCancel?: () => void
}

export function SurveyAnswerForm({
  survey,
  current,
  onSubmitted,
  onCancel,
}: SurveyAnswerFormProps) {
  const submitSurveyResponse = useHubStore((s) => s.submitSurveyResponse)

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => {
    const initial: Record<string, AnswerValue> = {}
    for (const answer of current?.answers ?? []) initial[answer.questionId] = answer.value
    return initial
  })

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleMultiple(question: SurveyQuestion, option: string, checked: boolean) {
    const previous = answers[question.id]
    const list = Array.isArray(previous) ? previous : []
    setAnswer(question.id, checked ? [...list, option] : list.filter((item) => item !== option))
  }

  const missingRequired = survey.questions.filter(
    (question) => question.required && !isAnswered(answers[question.id]),
  )

  function submit() {
    const payload: SurveyAnswer[] = survey.questions
      .filter((question) => isAnswered(answers[question.id]))
      .map((question) => ({
        questionId: question.id,
        value: answers[question.id] as AnswerValue,
      }))
    submitSurveyResponse(survey.id, payload)
    toast.success(current ? '回答を修正しました' : 'アンケートに回答しました')
    onSubmitted()
  }

  return (
    <div className="space-y-3">
      {survey.questions.map((question, index) => {
        const value = answers[question.id]
        return (
          <fieldset
            key={question.id}
            className="rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <legend className="sr-only">{question.text}</legend>
            <p className="text-xs text-muted-foreground">
              Q{index + 1}
              <span
                className={cn(
                  'ml-2 rounded-md px-1.5 py-0.5 text-xs font-semibold',
                  question.required
                    ? 'bg-danger-soft text-danger'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {question.required ? '必須' : '任意'}
              </span>
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug">{question.text}</p>

            {question.type === 'single' && (
              <RadioGroup
                className="mt-3 gap-2"
                value={typeof value === 'string' ? value : ''}
                onValueChange={(next) => setAnswer(question.id, next)}
              >
                {(question.options ?? []).map((option) => (
                  <Label
                    key={option}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal has-data-checked:border-primary has-data-checked:bg-secondary"
                  >
                    <RadioGroupItem value={option} />
                    <span className="text-sm">{option}</span>
                  </Label>
                ))}
              </RadioGroup>
            )}

            {question.type === 'multiple' && (
              <div className="mt-3 space-y-2">
                {(question.options ?? []).map((option) => (
                  <Label
                    key={option}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal has-data-checked:border-primary has-data-checked:bg-secondary"
                  >
                    <Checkbox
                      checked={Array.isArray(value) && value.includes(option)}
                      onCheckedChange={(checked) =>
                        toggleMultiple(question, option, checked === true)
                      }
                    />
                    <span className="text-sm">{option}</span>
                  </Label>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <Textarea
                className="mt-3"
                rows={4}
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => setAnswer(question.id, event.target.value)}
                placeholder="自由にご記入ください"
                aria-label={question.text}
              />
            )}

            {question.type === 'scale' && (
              <div className="mt-3">
                <div className="flex gap-2" role="group" aria-label={question.text}>
                  {SCALE_VALUES.map((scale) => {
                    const selected = value === scale
                    return (
                      <Button
                        key={scale}
                        type="button"
                        size="icon"
                        variant={selected ? 'default' : 'outline'}
                        aria-pressed={selected}
                        onClick={() => setAnswer(question.id, scale)}
                      >
                        {scale}
                      </Button>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{SCALE_HINT}</p>
              </div>
            )}
          </fieldset>
        )
      })}

      {missingRequired.length > 0 && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm">
          未回答の必須項目が {missingRequired.length} 問あります。
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button className="sm:flex-1" disabled={missingRequired.length > 0} onClick={submit}>
          {current ? '回答を更新する' : '回答を送信する'}
        </Button>
        {onCancel && (
          <Button variant="outline" className="sm:flex-1" onClick={onCancel}>
            キャンセル
          </Button>
        )}
      </div>
    </div>
  )
}
