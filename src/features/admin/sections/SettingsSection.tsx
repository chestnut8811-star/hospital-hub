/**
 * 管理画面 / システム設定。
 *
 * バックエンドが無いので、ここでの変更はどこにも保存されない。
 * 触ったときは必ずトーストでそれを伝える（実運用と取り違えないため）。
 */
import { BellRing, Database, KeyRound, RotateCcw, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useChatStore } from '@/stores/chatStore'
import { useDirectoryStore } from '@/stores/directoryStore'
import { useHubStore } from '@/stores/hubStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'

const NOT_SAVED = 'プロトタイプでは保存されません'

interface SwitchSettingProps {
  id: string
  label: string
  hint: string
  defaultChecked: boolean
}

/** 表示のみのスイッチ。状態は持たず、触ったら「保存されない」ことだけ伝える。 */
function SwitchSetting({ id, label, hint, defaultChecked }: SwitchSettingProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch
        id={id}
        defaultChecked={defaultChecked}
        onCheckedChange={() => toast.info(NOT_SAVED)}
        className="mt-1 shrink-0"
      />
    </div>
  )
}

interface SelectSettingProps {
  id: string
  label: string
  hint: string
  defaultValue: string
  options: string[]
}

/** 表示のみのプルダウン。 */
function SelectSetting({ id, label, hint, defaultValue, options }: SelectSettingProps) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Select defaultValue={defaultValue} onValueChange={() => toast.info(NOT_SAVED)}>
        <SelectTrigger id={id} size="sm" className="w-full shrink-0 sm:w-44" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SettingsSection() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const resetDemoData = () => {
    useChatStore.getState().resetDemoData()
    useHubStore.getState().resetDemoData()
    useDirectoryStore.getState().resetDemoData()
    toast.success('デモデータを初期化しました')
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs leading-relaxed text-foreground">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <span>
          この画面の設定は<strong className="font-semibold">表示のみ</strong>
          です。バックエンドが無いため、変更しても保存されません。
        </span>
      </p>

      <AdminPanel title="通知の既定" description="職員が個別に変更するまでの初期値です。">
        <div className="divide-y divide-border">
          <SwitchSetting
            id="setting-notify-message"
            label="新着メッセージを通知する"
            hint="通知OFFにしたルームには届きません。"
            defaultChecked
          />
          <SwitchSetting
            id="setting-notify-priority"
            label="重要・緊急メッセージは通知OFFでも届ける"
            hint="確認要求つきのメッセージを見落とさないための設定です。"
            defaultChecked
          />
          <SwitchSetting
            id="setting-notify-night"
            label="夜間（22:00〜7:00）も通知する"
            hint="緊急メッセージは、この設定に関わらず届きます。"
            defaultChecked={false}
          />
        </div>
      </AdminPanel>

      <AdminPanel title="パスワードポリシー" description="院内アカウントに適用する規則です。">
        <div className="divide-y divide-border">
          <SelectSetting
            id="setting-password-length"
            label="最小文字数"
            hint="英字・数字を含む長さの下限です。"
            defaultValue="10 文字以上"
            options={['8 文字以上', '10 文字以上', '12 文字以上']}
          />
          <SelectSetting
            id="setting-password-expiry"
            label="有効期限"
            hint="期限を過ぎると変更を求めます。"
            defaultValue="180 日"
            options={['90 日', '180 日', '無期限']}
          />
          <SwitchSetting
            id="setting-password-mfa"
            label="院外からの接続で二要素認証を必須にする"
            hint="院内LANからの接続には適用しません。"
            defaultChecked
          />
        </div>
      </AdminPanel>

      <AdminPanel title="保存期間" description="期間を過ぎたデータの扱いを決めます。">
        <div className="divide-y divide-border">
          <SelectSetting
            id="setting-retention-message"
            label="メッセージ"
            hint="期間を過ぎたメッセージは検索対象から外れます。"
            defaultValue="3 年"
            options={['1 年', '3 年', '5 年']}
          />
          <SelectSetting
            id="setting-retention-audit"
            label="監査ログ"
            hint="操作の記録を残す期間です。"
            defaultValue="5 年"
            options={['3 年', '5 年', '10 年']}
          />
          <SelectSetting
            id="setting-retention-file"
            label="添付ファイル"
            hint="期間を過ぎた添付は自動で削除されます。"
            defaultValue="1 年"
            options={['6 か月', '1 年', '3 年']}
          />
        </div>
      </AdminPanel>

      <AdminPanel
        title="デモデータ"
        description="デモ中に加えた変更（送信したメッセージ・作成したグループ・権限の変更など）を元に戻します。"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Database className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              チャット・院内機能・職員名簿のすべてが初期状態に戻ります。この操作は取り消せません。
            </span>
          </p>
          <Button
            variant="outline"
            className="shrink-0 border-danger text-danger hover:bg-danger-soft"
            onClick={() => setConfirmOpen(true)}
          >
            <RotateCcw className="size-4" aria-hidden />
            デモデータを初期化
          </Button>
        </div>
      </AdminPanel>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <BellRing className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          通知・パスワード・保存期間の各項目は、Phase 3 でバックエンドに繋いだときに実際の設定値になります。
        </span>
      </p>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>Phase 1 のプロトタイプでは認証を行わないため、パスワードは保存していません。</span>
      </p>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="デモデータを初期化しますか？"
        description="デモ中に加えた変更はすべて失われ、初期状態に戻ります。この操作は取り消せません。"
        confirmLabel="初期化する"
        destructive
        onConfirm={resetDemoData}
      />
    </div>
  )
}
