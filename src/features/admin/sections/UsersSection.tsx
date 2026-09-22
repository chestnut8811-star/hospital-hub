/**
 * 管理画面 / ユーザー。
 *
 * 部門管理者は閲覧のみ。権限（setRole）と在籍（setActive）を変えられるのは
 * システム管理者だけ。自分自身の権限だけは、管理画面から締め出されないよう変更できない。
 */
import { Info, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDirectoryStore } from '@/stores/directoryStore'
import { useCurrentUser } from '@/stores/sessionStore'
import type { Role } from '@/types'
import { hasRole, ROLE_LABEL } from '@/types'
import { AdminPanel } from '@/features/admin/components/AdminPanel'

const ROLE_OPTIONS: Role[] = ['USER', 'GROUP_ADMIN', 'DEPARTMENT_ADMIN', 'SYSTEM_ADMIN']

export function UsersSection() {
  const users = useDirectoryStore((s) => s.users)
  const setRole = useDirectoryStore((s) => s.setRole)
  const setActive = useDirectoryStore((s) => s.setActive)
  const me = useCurrentUser()
  const canEdit = hasRole(me.role, 'SYSTEM_ADMIN')

  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')

  const staff = useMemo(() => users.filter((u) => u.kind === 'human'), [users])
  const departments = useMemo(
    () => Array.from(new Set(staff.map((u) => u.department))),
    [staff],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return staff.filter((u) => {
      if (department !== 'all' && u.department !== department) return false
      if (!q) return true
      return [u.name, u.kana, u.department, u.jobTitle, u.extension ?? ''].some((v) =>
        v.toLowerCase().includes(q),
      )
    })
  }, [staff, query, department])

  const handleRoleChange = (userId: string, name: string, next: Role) => {
    setRole(userId, next)
    toast.success(`${name} の権限を「${ROLE_LABEL[next]}」に変更しました`)
  }

  const handleActiveChange = (userId: string, name: string, next: boolean) => {
    setActive(userId, next)
    toast.success(`${name} を「${next ? '在籍' : '在籍なし'}」に変更しました`)
  }

  return (
    <AdminPanel
      title="職員一覧"
      description={`${rows.length} 名を表示しています（名簿 ${staff.length} 名）。`}
      padded={false}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        {!canEdit && (
          <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-xs leading-relaxed text-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              この画面は<strong className="font-semibold">閲覧のみ</strong>
              です。権限と在籍の変更はシステム管理者が行います。
            </span>
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="氏名・かな・職種・内線で検索"
              aria-label="職員を検索"
              className="pl-9"
            />
          </div>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-full sm:w-52" aria-label="所属で絞り込む">
              <SelectValue placeholder="所属で絞り込む" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての所属</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="該当する職員がいません"
          description="検索語や所属の絞り込みを変えてお試しください。"
          className="py-10"
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">氏名</TableHead>
                <TableHead>かな</TableHead>
                <TableHead>所属</TableHead>
                <TableHead>職種</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>在籍</TableHead>
                <TableHead className="pr-4">内線</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((user) => {
                const isMe = user.id === me.id
                return (
                  <TableRow key={user.id}>
                    <TableCell className="pl-4">
                      <span className="flex items-center gap-2">
                        <UserAvatar user={user} size="xs" />
                        <span className="font-medium text-foreground">{user.name}</span>
                        {isMe && (
                          <Badge variant="outline" className="shrink-0">
                            自分
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.kana}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell className="text-muted-foreground">{user.jobTitle}</TableCell>
                    <TableCell>
                      {canEdit && !isMe ? (
                        <Select
                          value={user.role}
                          onValueChange={(v) => handleRoleChange(user.id, user.name, v as Role)}
                        >
                          <SelectTrigger size="sm" aria-label={`${user.name} の権限`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {ROLE_LABEL[role]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
                          {canEdit && isMe && (
                            <span className="text-xs text-muted-foreground">
                              自分の権限は変更できません
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <span className="flex items-center gap-2">
                          <Switch
                            checked={user.active}
                            onCheckedChange={(v) => handleActiveChange(user.id, user.name, v)}
                            aria-label={`${user.name} の在籍`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {user.active ? '在籍' : '在籍なし'}
                          </span>
                        </span>
                      ) : (
                        <Badge variant={user.active ? 'secondary' : 'outline'}>
                          {user.active ? '在籍' : '在籍なし'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 tabular-nums text-muted-foreground">
                      {user.extension ?? '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPanel>
  )
}
