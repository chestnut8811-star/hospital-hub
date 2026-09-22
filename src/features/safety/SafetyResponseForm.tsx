/**
 * 安否確認の回答フォーム（設計指示 §16）。
 * 災害時に片手で30秒で終えられるよう、選択肢は大きく・項目は最小限にする。
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useHubStore } from '@/stores/hubStore'
import type { SafetyCondition, SafetyLocation, SafetyResponse } from '@/types'
import { SAFETY_CONDITION_LABEL, SAFETY_LOCATION_LABEL } from '@/types'

const LOCATIONS: SafetyLocation[] = ['hospital', 'home', 'other']
const CONDITIONS: SafetyCondition[] = ['ok', 'minor_injury', 'need_support']

interface SafetyResponseFormProps {
  drillId: string
  /** 修正のときは既存の回答を初期値にする */
  current?: SafetyResponse
  onSubmitted: () => void
  onCancel?: () => void
}

export function SafetyResponseForm({
  drillId,
  current,
  onSubmitted,
  onCancel,
}: SafetyResponseFormProps) {
  const submitSafetyResponse = useHubStore((s) => s.submitSafetyResponse)

  const [location, setLocation] = useState<SafetyLocation>(current?.location ?? 'hospital')
  const [condition, setCondition] = useState<SafetyCondition>(current?.condition ?? 'ok')
  const [comment, setComment] = useState(current?.comment ?? '')
  const [canCome, setCanCome] = useState(current?.canCome ?? true)

  function submit() {
    const trimmed = comment.trim()
    submitSafetyResponse(drillId, {
      location,
      condition,
      canCome,
      ...(trimmed ? { comment: trimmed } : {}),
    })
    toast.success(current ? '回答を修正しました' : '安否の回答を送信しました')
    onSubmitted()
  }

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">現在の場所</legend>
        <RadioGroup
          value={location}
          onValueChange={(value) => setLocation(value as SafetyLocation)}
          className="gap-2"
        >
          {LOCATIONS.map((key) => (
            <Label
              key={key}
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal has-data-checked:border-primary has-data-checked:bg-secondary"
            >
              <RadioGroupItem value={key} />
              <span className="text-sm">{SAFETY_LOCATION_LABEL[key]}</span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">現在の状態</legend>
        <RadioGroup
          value={condition}
          onValueChange={(value) => setCondition(value as SafetyCondition)}
          className="gap-2"
        >
          {CONDITIONS.map((key) => (
            <Label
              key={key}
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal has-data-checked:border-primary has-data-checked:bg-secondary"
            >
              <RadioGroupItem value={key} />
              <span className="text-sm">{SAFETY_CONDITION_LABEL[key]}</span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      <Label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 font-normal">
        <span className="text-sm">これから参集できる</span>
        <Switch
          checked={canCome}
          onCheckedChange={(checked) => setCanCome(checked === true)}
          aria-label="これから参集できる"
        />
      </Label>

      <div className="space-y-1.5">
        <Label htmlFor="safety-comment">コメント（任意）</Label>
        <Textarea
          id="safety-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          placeholder="例：交通機関が止まっており到着に時間がかかります"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button className="sm:flex-1" onClick={submit}>
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
