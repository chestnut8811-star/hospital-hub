/** 管理画面 / 部署。部署名・責任者・人数の一覧。 */
import { Building2 } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyState } from '@/components/common/EmptyState'
import { UserAvatar } from '@/components/common/UserAvatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDirectoryStore } from '@/stores/directoryStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { useUserLookup } from '@/features/admin/useUserLookup'

export function DepartmentsSection() {
  const departments = useDirectoryStore((s) => s.departments)
  const users = useDirectoryStore((s) => s.users)
  const lookup = useUserLookup()

  /** 名簿に登録されている人数（memberCount は部署の実人数、こちらはデモ名簿の人数） */
  const registered = useMemo(() => {
    const counts = new Map<string, number>()
    for (const u of users) {
      if (u.kind !== 'human') continue
      counts.set(u.department, (counts.get(u.department) ?? 0) + 1)
    }
    return counts
  }, [users])

  return (
    <AdminPanel
      title="部署一覧"
      description={`${departments.length} 部署を表示しています。`}
      padded={false}
    >
      {departments.length === 0 ? (
        <EmptyState icon={Building2} title="部署が登録されていません" className="py-10" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">部署名</TableHead>
                <TableHead>責任者</TableHead>
                <TableHead className="pr-4 text-right">人数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => {
                const manager = lookup(dept.managerId)
                return (
                  <TableRow key={dept.id}>
                    <TableCell className="pl-4 font-medium text-foreground">{dept.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <UserAvatar user={manager} size="xs" />
                        <span className="min-w-0">
                          <span className="block text-sm text-foreground">{manager.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {manager.jobTitle}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <span className="block tabular-nums text-foreground">
                        {dept.memberCount} 名
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        名簿登録 {registered.get(dept.name) ?? 0} 名
                      </span>
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
