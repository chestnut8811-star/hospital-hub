/** 管理画面 / 監査ログ。システム管理者だけが開ける。 */
import { ScrollText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFullDateTime } from '@/lib/format'
import { useHubStore } from '@/stores/hubStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { useUserLookup } from '@/features/admin/useUserLookup'

export function AuditSection() {
  const auditLogs = useHubStore((s) => s.auditLogs)
  const lookup = useUserLookup()
  const [action, setAction] = useState('all')

  const actions = useMemo(
    () => Array.from(new Set(auditLogs.map((l) => l.action))).sort((a, b) => a.localeCompare(b)),
    [auditLogs],
  )

  const rows = useMemo(
    () => (action === 'all' ? auditLogs : auditLogs.filter((l) => l.action === action)),
    [auditLogs, action],
  )

  return (
    <AdminPanel
      title="監査ログ"
      description={`${rows.length} 件を表示しています（全 ${auditLogs.length} 件）。`}
      padded={false}
      actions={
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger size="sm" className="w-44" aria-label="操作の種類で絞り込む">
            <SelectValue placeholder="操作で絞り込む" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての操作</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="該当する記録がありません"
          description="絞り込みを変えてお試しください。"
          className="py-10"
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">日時</TableHead>
                <TableHead>操作者</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>対象</TableHead>
                <TableHead className="pr-4">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="pl-4 tabular-nums text-muted-foreground">
                    {formatFullDateTime(log.at)}
                  </TableCell>
                  <TableCell>{lookup(log.actorId).name}</TableCell>
                  <TableCell className="font-medium text-foreground">{log.action}</TableCell>
                  <TableCell className="max-w-56 truncate">{log.target}</TableCell>
                  <TableCell className="max-w-80 truncate pr-4 text-muted-foreground">
                    {log.detail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPanel>
  )
}
