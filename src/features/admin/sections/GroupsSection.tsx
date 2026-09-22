/**
 * 管理画面 / グループ。
 * チャットグループの一覧と、新規作成ダイアログ。
 */
import { MessagesSquare, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatFullDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chatStore'
import { useStaff } from '@/stores/directoryStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { useUserLookup } from '@/features/admin/useUserLookup'

/** アイコン背景に使う色。既存グループと同じ系統から順に割り当てる。 */
const ACCENTS = ['#3157b7', '#2f9e6f', '#6b4bc4', '#b9701a', '#2b7fa8', '#c2557e', '#3e8e7e']

/** 入力の手間を省くための候補。自由入力もできる。 */
const ICON_CHOICES = ['💬', '🏥', '🔵', '🌊', '🫀', '⚡', '💠', '🩺', '🧰', '📢']

export function GroupsSection() {
  const rooms = useChatStore((s) => s.rooms)
  const createGroup = useChatStore((s) => s.createGroup)
  const staff = useStaff()
  const lookup = useUserLookup()

  const groups = useMemo(() => rooms.filter((r) => r.kind === 'group'), [rooms])

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💬')
  const [description, setDescription] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])

  const resetForm = () => {
    setName('')
    setIcon('💬')
    setDescription('')
    setMemberIds([])
  }

  const toggleMember = (userId: string) => {
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    createGroup({
      name: trimmed,
      icon: icon.trim() || '💬',
      accent: ACCENTS[groups.length % ACCENTS.length],
      description: description.trim(),
      memberIds,
    })
    toast.success(`グループ「${trimmed}」を作成しました`)
    resetForm()
    setOpen(false)
  }

  return (
    <>
      <AdminPanel
        title="グループ一覧"
        description={`${groups.length} 件のグループがあります。`}
        padded={false}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden />
            グループを作成
          </Button>
        }
      >
        {groups.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="グループがありません"
            description="「グループを作成」から最初のグループを作れます。"
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">グループ</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead className="text-right">メンバー</TableHead>
                  <TableHead>管理者</TableHead>
                  <TableHead className="pr-4">作成日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="pl-4">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-lg"
                          style={{ backgroundColor: `${room.accent}1f`, color: room.accent }}
                        >
                          {room.icon || '💬'}
                        </span>
                        <span className="font-medium text-foreground">{room.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-64 truncate whitespace-nowrap text-muted-foreground">
                      {room.description || '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {room.memberIds.length} 名
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {room.adminIds.length === 0
                        ? '—'
                        : room.adminIds.map((id) => lookup(id).name).join('・')}
                    </TableCell>
                    <TableCell className="pr-4 tabular-nums text-muted-foreground">
                      {formatFullDateTime(room.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminPanel>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        {/* スマホでは既定の左右余白を残したいので sm 以上でだけ幅を広げる */}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>グループを作成</DialogTitle>
            <DialogDescription>
              作成した職員がそのままグループ管理者になります。メンバーはあとから変更できます。
            </DialogDescription>
          </DialogHeader>

          {/* Dialog はグリッドなので、絵文字の横スクロールを効かせるには min-w-0 が要る */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-name">グループ名</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：手術室CE"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-icon">アイコン（絵文字）</Label>
              <div className="flex min-w-0 items-center gap-2">
                <Input
                  id="group-icon"
                  value={icon}
                  maxLength={2}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-16 shrink-0 text-center text-xl"
                />
                <div className="scrollbar-slim flex min-w-0 flex-1 gap-1 overflow-x-auto">
                  {ICON_CHOICES.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      aria-label={`アイコンを ${choice} にする`}
                      onClick={() => setIcon(choice)}
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-lg border text-lg transition-colors',
                        icon === choice
                          ? 'border-primary bg-secondary'
                          : 'border-border bg-card hover:bg-muted',
                      )}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-description">説明</Label>
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例：手術室で使う医療機器の連絡用"
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">メンバー（{memberIds.length} 名を選択中）</p>
              <ul className="scrollbar-slim max-h-56 overflow-y-auto rounded-lg border border-border">
                {staff.map((user) => (
                  <li key={user.id} className="border-b border-border last:border-b-0">
                    <Label
                      htmlFor={`group-member-${user.id}`}
                      className="min-h-11 cursor-pointer px-3 py-2 font-normal"
                    >
                      <Checkbox
                        id={`group-member-${user.id}`}
                        checked={memberIds.includes(user.id)}
                        onCheckedChange={() => toggleMember(user.id)}
                      />
                      <UserAvatar user={user} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">{user.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user.department} / {user.jobTitle}
                        </span>
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button variant="outline">キャンセル</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              作成する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
