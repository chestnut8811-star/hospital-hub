/**
 * アンケート作成ダイアログの「質問を1問追加する」部分。
 * 種別を選ぶと必要な入力欄だけが出るようにして、迷う余地を減らす。
 */
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { QUESTION_TYPE_LABEL } from '@/features/surveys/constants'
import { uid } from '@/lib/id'
import type { SurveyQuestion, SurveyQuestionType } from '@/types'

export function SurveyQuestionBuilder({ onAdd }: { onAdd: (question: SurveyQuestion) => void }) {
  const [type, setType] = useState<SurveyQuestionType>('single')
  const [text, setText] = useState('')
  const [options, setOptions] = useState('')
  const [required, setRequired] = useState(true)

  const needsOptions = type === 'single' || type === 'multiple'
  // 同じ選択肢が並ぶと集計が読めなくなるので重複は落とす
  const parsedOptions = Array.from(
    new Set(
      options
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  )
  const canAdd = text.trim().length > 0 && (!needsOptions || parsedOptions.length >= 2)

  function add() {
    onAdd({
      id: uid('q'),
      type,
      text: text.trim(),
      required,
      ...(needsOptions ? { options: parsedOptions } : {}),
    })
    setText('')
    setOptions('')
  }

  return (
    <div className="space-y-3 rounded-lg bg-muted p-3">
      <div className="space-y-1.5">
        <Label htmlFor="survey-question-type">質問の種類</Label>
        <Select value={type} onValueChange={(value) => setType(value as SurveyQuestionType)}>
          <SelectTrigger id="survey-question-type" className="w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">{QUESTION_TYPE_LABEL.single}</SelectItem>
            <SelectItem value="multiple">{QUESTION_TYPE_LABEL.multiple}</SelectItem>
            <SelectItem value="text">{QUESTION_TYPE_LABEL.text}</SelectItem>
            <SelectItem value="scale">{QUESTION_TYPE_LABEL.scale}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="survey-question-text">質問文</Label>
        <Input
          id="survey-question-text"
          className="bg-card"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="例：部署内の連絡で一番よく使う手段はどれですか"
        />
      </div>

      {needsOptions && (
        <div className="space-y-1.5">
          <Label htmlFor="survey-question-options">選択肢（1行に1つ・2つ以上）</Label>
          <Textarea
            id="survey-question-options"
            className="bg-card"
            value={options}
            onChange={(event) => setOptions(event.target.value)}
            rows={4}
            placeholder={'PHS・電話\n口頭・掲示板\nその他'}
          />
        </div>
      )}

      <Label className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-card px-3 font-normal">
        <span className="text-sm">回答を必須にする</span>
        <Switch
          checked={required}
          onCheckedChange={(checked) => setRequired(checked === true)}
          aria-label="回答を必須にする"
        />
      </Label>

      <Button variant="outline" className="w-full" disabled={!canAdd} onClick={add}>
        <Plus className="size-4" aria-hidden />
        この質問を追加する
      </Button>
    </div>
  )
}
