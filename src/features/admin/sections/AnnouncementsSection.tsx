/** 管理画面 / お知らせ。配信済みのお知らせと既読状況。 */
import { Megaphone } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFullDateTime } from '@/lib/format'
import { useDirectoryStore } from '@/stores/directoryStore'
import { useAnnouncements } from '@/stores/hubStore'
import { AdminPanel } from '@/features/admin/components/AdminPanel'

export function AnnouncementsSection() {
  const announcements = useAnnouncements()
  const users = useDirectoryStore((s) => s.users)

  const staff = useMemo(() => users.filter((u) => u.kind === 'human'), [users])

  /** 対象部署に所属する職員の数。['全職員'] なら名簿の全員。 */
  const countTargets = (targets: string[]) =>
    targets.includes('全職員')
      ? staff.length
      : staff.filter((u) => targets.includes(u.department)).length

  return (
    <AdminPanel
      title="お知らせ一覧"
      description={`${announcements.length} 件のお知らせを配信しています。`}
      padded={false}
    >
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="お知らせがありません" className="py-10" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">タイトル</TableHead>
                <TableHead>重要度</TableHead>
                <TableHead>カテゴリー</TableHead>
                <TableHead>対象</TableHead>
                <TableHead>配信日</TableHead>
                <TableHead className="text-right">既読</TableHead>
                <TableHead className="pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((a) => {
                const total = countTargets(a.targets)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-72 truncate pl-4 font-medium text-foreground">
                      {a.title}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={a.priority} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {a.targets.join('・')}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatFullDateTime(a.publishedAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.readUserIds.length} / {total} 名
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/announcements/${a.id}`}>詳細</Link>
                      </Button>
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
