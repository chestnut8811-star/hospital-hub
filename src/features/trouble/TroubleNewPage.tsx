/**
 * 機器トラブルの新規報告（設計指示 §18）。
 * 送信すると報告が作られ、「医療機器トラブル」グループへ自動投稿される。
 */
import { Camera, Phone, Send, Siren, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DemoNotice } from '@/components/common/DemoNotice'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TroubleSeverityBadge } from '@/features/trouble/TroubleBadges'
import { cn } from '@/lib/utils'
import { useHubStore } from '@/stores/hubStore'
import type { TroubleSeverity } from '@/types'
import { TROUBLE_SEVERITY_LABEL } from '@/types'

const SEVERITIES: TroubleSeverity[] = ['high', 'medium', 'low']

/** 必須項目の見出しに添える印 */
function RequiredMark() {
  return (
    <span className="rounded bg-danger-soft px-1.5 py-0.5 text-xs font-semibold text-danger">
      必須
    </span>
  )
}

export function TroubleNewPage() {
  const navigate = useNavigate()
  const troubleOptions = useHubStore((s) => s.troubleOptions)
  const createTrouble = useHubStore((s) => s.createTrouble)

  const [category, setCategory] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [assetNo, setAssetNo] = useState('')
  const [location, setLocation] = useState('')
  const [symptom, setSymptom] = useState('')
  const [severity, setSeverity] = useState<TroubleSeverity>('medium')
  const [photoNote, setPhotoNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const missing = useMemo(() => {
    const out: string[] = []
    if (!category) out.push('機器カテゴリー')
    if (!deviceName.trim()) out.push('機器名')
    if (!assetNo.trim()) out.push('管理番号')
    if (!location) out.push('場所')
    if (!symptom.trim()) out.push('症状')
    return out
  }, [category, deviceName, assetNo, location, symptom])

  const handleSubmit = () => {
    if (missing.length > 0 || submitting) return
    setSubmitting(true)
    const id = createTrouble({
      category,
      deviceName: deviceName.trim(),
      assetNo: assetNo.trim(),
      location,
      symptom: symptom.trim(),
      severity,
      ...(photoNote.trim() ? { photoNote: photoNote.trim() } : {}),
    })
    toast.success('報告しました。「医療機器トラブル」グループへ自動投稿されました')
    navigate(`/trouble/${id}`, { replace: true })
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="機器トラブル報告" backTo="/trouble" />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <DemoNotice />

        {/* 投稿先の説明 */}
        <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2.5 text-xs leading-relaxed text-foreground">
          <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            報告すると、内容が
            <strong className="font-semibold">「医療機器トラブル」グループ</strong>
            へ自動で投稿されます。臨床工学室のメンバーがそこで受け付けます。
          </span>
        </p>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          {/* 機器カテゴリー */}
          <div className="space-y-1.5">
            <Label htmlFor="trouble-category">
              機器カテゴリー <RequiredMark />
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="trouble-category" className="w-full">
                <SelectValue placeholder="選んでください" />
              </SelectTrigger>
              <SelectContent>
                {troubleOptions.categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 機器名 */}
          <div className="space-y-1.5">
            <Label htmlFor="trouble-device">
              機器名 <RequiredMark />
            </Label>
            <Input
              id="trouble-device"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="例：輸液ポンプ（汎用）"
            />
          </div>

          {/* 管理番号 */}
          <div className="space-y-1.5">
            <Label htmlFor="trouble-asset">
              管理番号 <RequiredMark />
            </Label>
            <Input
              id="trouble-asset"
              value={assetNo}
              onChange={(e) => setAssetNo(e.target.value)}
              placeholder="例：P-1234"
            />
            <p className="text-xs text-muted-foreground">
              ラベルが読めないときは、貼り替えずに臨床工学室（内線 5120）へ連絡してください。
            </p>
          </div>

          {/* 場所 */}
          <div className="space-y-1.5">
            <Label htmlFor="trouble-location">
              場所 <RequiredMark />
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="trouble-location" className="w-full">
                <SelectValue placeholder="選んでください" />
              </SelectTrigger>
              <SelectContent>
                {troubleOptions.locations.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 症状 */}
          <div className="space-y-1.5">
            <Label htmlFor="trouble-symptom">
              症状 <RequiredMark />
            </Label>
            <Textarea
              id="trouble-symptom"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="どの操作で、どのような表示・動作になったかを書いてください"
              className="min-h-28"
            />
          </div>

          {/* 緊急度 */}
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              緊急度 <RequiredMark />
            </legend>
            <RadioGroup
              value={severity}
              onValueChange={(v) => setSeverity(v as TroubleSeverity)}
              className="gap-2"
            >
              {SEVERITIES.map((item) => (
                <label
                  key={item}
                  htmlFor={`severity-${item}`}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors',
                    severity === item && 'border-primary bg-secondary/50',
                  )}
                >
                  <RadioGroupItem value={item} id={`severity-${item}`} className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <TroubleSeverityBadge severity={item} />
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {TROUBLE_SEVERITY_LABEL[item]}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>

            {severity === 'high' && (
              <p className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-xs leading-relaxed text-foreground">
                <Siren className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <span>
                  <strong className="font-semibold">使用を中止し、臨床工学室（内線 5120）へも電話してください。</strong>
                  <span className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                    <Phone className="size-3.5" aria-hidden />
                    このアプリの報告だけで完了させないでください。
                  </span>
                </span>
              </p>
            )}
          </fieldset>

          {/* 写真（プロトタイプでは説明文で代替） */}
          <div className="space-y-1.5">
            <Label htmlFor="trouble-photo">写真の説明（任意）</Label>
            <Textarea
              id="trouble-photo"
              value={photoNote}
              onChange={(e) => setPhotoNote(e.target.value)}
              placeholder="例：本体前面のアラーム表示"
            />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Camera className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              プロトタイプでは写真そのものは添付できません。写っている内容を文章で書いてください。
            </p>
          </div>

          <div className="space-y-2 pb-6">
            <Button type="submit" size="lg" className="w-full gap-2" disabled={missing.length > 0 || submitting}>
              <Send aria-hidden />
              この内容で報告する
            </Button>
            {missing.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                未入力：{missing.join('・')}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
