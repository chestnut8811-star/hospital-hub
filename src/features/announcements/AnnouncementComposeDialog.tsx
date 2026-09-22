/**
 * お知らせの新規作成ダイアログ（DEPARTMENT_ADMIN 以上）。
 * 配信は取り消せないため、送信前に確認ダイアログを挟む。
 */
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDirectoryStore } from '@/stores/directoryStore'
import { useHubStore } from '@/stores/hubStore'
import type { Priority } from '@/types'
import { PRIORITY_LABEL } from '@/types'

/** 既存のお知らせに無くても選べるようにしておく分類 */
const BASE_CATEGORIES = ['システム', '防災', '運用', '研修', 'その他']

const ALL_STAFF = '全職員'

interface AnnouncementComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 既存のお知らせから集めた分類 */
  categories: string[]
}

export function AnnouncementComposeDialog({
  open,
  onOpenChange,
  categories,
}: AnnouncementComposeDialogProps) {
  const createAnnouncement = useHubStore((s) => s.createAnnouncement)
  const departments = useDirectoryStore((s) => s.departments)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [category, setCategory] = useState('運用')
  const [allStaff, setAllStaff] = useState(true)
  const [targets, setTargets] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const categoryOptions = useMemo(
    () => Array.from(new Set([...categories, ...BASE_CATEGORIES])),
    [categories],
  )

  const chosenTargets = allStaff ? [ALL_STAFF] : targets
  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && chosenTargets.length > 0

  function reset() {
    setTitle('')
    setBody('')
    setPriority('normal')
    setCategory('運用')
    setAllStaff(true)
    setTargets([])
  }

  function submit() {
    createAnnouncement({
      title: title.trim(),
      body: body.trim(),
      priority,
      category,
      targets: chosenTargets,
    })
    toast.success('お知らせを配信しました')
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
          <DialogTitle>お知らせを新規作成</DialogTitle>
          <DialogDescription>
            配信すると対象の職員に届きます。内容は運用連絡（日時・場所・担当・手続き）の範囲で記入してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="announcement-title">タイトル</Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例：貸出機器の受付時間の変更について"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="announcement-body">本文</Label>
            <Textarea
              id="announcement-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              placeholder="日時・場所・担当・手続きなどを記入します。"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="announcement-priority">重要度</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger id="announcement-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">{PRIORITY_LABEL.emergency}</SelectItem>
                  <SelectItem value="important">{PRIORITY_LABEL.important}</SelectItem>
                  <SelectItem value="normal">{PRIORITY_LABEL.normal}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="announcement-category">カテゴリー</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="announcement-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">配信対象</legend>
            <Label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal">
              <Checkbox
                checked={allStaff}
                onCheckedChange={(checked) => setAllStaff(checked === true)}
              />
              <span className="text-sm">{ALL_STAFF}</span>
            </Label>
            {!allStaff && (
              <div className="grid gap-2 sm:grid-cols-2">
                {departments.map((department) => {
                  const checked = targets.includes(department.name)
                  return (
                    <Label
                      key={department.id}
                      className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 font-normal"
                    >
                      <Checkbox
                        checked={checked}
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
                  )
                })}
              </div>
            )}
          </fieldset>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
            キャンセル
          </Button>
          <Button disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
            配信する
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="このお知らせを配信しますか？"
        description={
          <span>
            対象：{chosenTargets.join('・')}
            <br />
            配信後の取り消しはできません。
          </span>
        }
        confirmLabel="配信する"
        onConfirm={submit}
      />
    </Dialog>
  )
}
