/**
 * アンケートの新規作成ダイアログ（DEPARTMENT_ADMIN 以上）。
 * 質問は「種別を選ぶ → 文面を書く → 追加」の3手で足せる簡易フォームにする。
 */
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { QUESTION_TYPE_LABEL } from '@/features/surveys/constants'
import { SurveyQuestionBuilder } from '@/features/surveys/SurveyQuestionBuilder'
import { useDirectoryStore } from '@/stores/directoryStore'
import { useHubStore } from '@/stores/hubStore'
import type { SurveyQuestion } from '@/types'

const ALL_STAFF = '全職員'

interface SurveyComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SurveyComposeDialog({ open, onOpenChange }: SurveyComposeDialogProps) {
  const createSurvey = useHubStore((s) => s.createSurvey)
  const departments = useDirectoryStore((s) => s.departments)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [allStaff, setAllStaff] = useState(true)
  const [targets, setTargets] = useState<string[]>([])
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])

  const chosenTargets = allStaff ? [ALL_STAFF] : targets
  const canSubmit =
    title.trim().length > 0 && questions.length > 0 && chosenTargets.length > 0

  function reset() {
    setTitle('')
    setDescription('')
    setAnonymous(false)
    setAllStaff(true)
    setTargets([])
    setQuestions([])
  }

  function submit() {
    createSurvey({
      title: title.trim(),
      description: description.trim(),
      targets: chosenTargets,
      anonymous,
      questions,
    })
    toast.success('アンケートを作成しました')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>アンケートを新規作成</DialogTitle>
          <DialogDescription>
            設問は運用に関する内容（連絡手段・研修・業務の困りごとなど）にとどめてください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="survey-title">タイトル</Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例：連絡手段についてのアンケート"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="survey-description">説明</Label>
            <Textarea
              id="survey-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="目的と所要時間を書いておくと回答率が上がります。"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">対象</legend>
            <Label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal">
              <Checkbox
                checked={allStaff}
                onCheckedChange={(checked) => setAllStaff(checked === true)}
              />
              <span className="text-sm">{ALL_STAFF}</span>
            </Label>
            {!allStaff && (
              <div className="grid gap-2 sm:grid-cols-2">
                {departments.map((department) => (
                  <Label
                    key={department.id}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal"
                  >
                    <Checkbox
                      checked={targets.includes(department.name)}
                      onCheckedChange={(next) =>
                        setTargets((prev) =>
                          next === true
                            ? [...prev, department.name]
                            : prev.filter((name) => name !== department.name),
                        )
                      }
                    />
                    <span className="text-sm">{department.name}</span>
                  </Label>
                ))}
              </div>
            )}
          </fieldset>

          <Label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 font-normal">
            <span className="text-sm">匿名で集計する（氏名を表示しない）</span>
            <Switch
              checked={anonymous}
              onCheckedChange={(checked) => setAnonymous(checked === true)}
              aria-label="匿名で集計する"
            />
          </Label>

          {/* 追加済みの質問 */}
          <div className="space-y-2">
            <p className="text-sm font-medium">質問（{questions.length} 問）</p>
            {questions.length === 0 ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                まだ質問がありません。下の欄から追加してください。
              </p>
            ) : (
              <ul className="space-y-2">
                {questions.map((question, index) => (
                  <li
                    key={question.id}
                    className="flex items-start gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Q{index + 1} / {QUESTION_TYPE_LABEL[question.type]}
                        {question.required ? ' / 必須' : ' / 任意'}
                      </p>
                      <p className="text-sm">{question.text}</p>
                      {question.options && (
                        <p className="text-xs text-muted-foreground">
                          選択肢：{question.options.join('・')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Q${index + 1} を削除`}
                      onClick={() =>
                        setQuestions((prev) => prev.filter((item) => item.id !== question.id))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SurveyQuestionBuilder onAdd={(question) => setQuestions((prev) => [...prev, question])} />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            作成する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
