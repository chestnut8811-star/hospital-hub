/**
 * お知らせ一覧（設計指示 §11）。
 * 未読が一目で分かることと、カテゴリー・検索で目的の連絡に辿り着けることを優先する。
 */
import { Megaphone, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Highlight } from '@/components/common/Highlight'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnnouncementComposeDialog } from '@/features/announcements/AnnouncementComposeDialog'
import { formatDateTime } from '@/lib/format'
import { matchesQuery } from '@/lib/search'
import { isTargeted } from '@/lib/targeting'
import { cn } from '@/lib/utils'
import { useAnnouncements } from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'
import { hasRole } from '@/types'

const ALL_CATEGORIES = '__all__'

export function AnnouncementListPage() {
  const me = useCurrentUser()
  const announcements = useAnnouncements()
  const canCreate = hasRole(me.role, 'DEPARTMENT_ADMIN')

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [composeOpen, setComposeOpen] = useState(false)

  /**
   * 自分に配信されたお知らせだけを、以降のすべての算出の元にする。
   * 一覧・カテゴリーの選択肢・未読件数で母集団を揃え、
   * 対象外のお知らせに既読が付かないようにする。
   */
  const forMe = useMemo(
    () => announcements.filter((a) => isTargeted(a.targets, me.department)),
    [announcements, me.department],
  )

  const categories = useMemo(
    () => Array.from(new Set(forMe.map((a) => a.category))),
    [forMe],
  )

  const visible = useMemo(
    () =>
      forMe.filter(
        (a) =>
          (category === ALL_CATEGORIES || a.category === category) &&
          matchesQuery(query, a.title, a.body, a.category, a.targets.join(' ')),
      ),
    [forMe, category, query],
  )

  const unreadCount = useMemo(
    () => forMe.filter((a) => !a.readUserIds.includes(me.id)).length,
    [forMe, me.id],
  )

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader
        title="お知らせ"
        description={unreadCount > 0 ? `未読 ${unreadCount} 件` : 'すべて既読'}
        backTo="/menu"
        actions={
          canCreate ? (
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Plus className="size-4" aria-hidden />
              新規作成
            </Button>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="お知らせを検索"
              aria-label="お知らせを検索"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="カテゴリーで絞り込む" className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>すべてのカテゴリー</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="該当するお知らせがありません"
            description="検索語やカテゴリーの条件を変えてみてください。"
          />
        ) : (
          <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {visible.map((announcement) => {
              const unread = !announcement.readUserIds.includes(me.id)
              return (
                <li key={announcement.id} className="border-b border-border last:border-b-0">
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="flex w-2 shrink-0 justify-center pt-2">
                      {unread && (
                        <>
                          <span className="size-2 rounded-full bg-primary" aria-hidden />
                          <span className="sr-only">未読</span>
                        </>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          unread ? 'font-bold text-foreground' : 'text-foreground/85',
                        )}
                      >
                        <Highlight text={announcement.title} query={query} />
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <PriorityBadge priority={announcement.priority} />
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {announcement.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(announcement.publishedAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        対象：{announcement.targets.join('・')}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        <DemoNotice />
      </div>

      {canCreate && (
        <AnnouncementComposeDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          categories={categories}
        />
      )}
    </div>
  )
}
