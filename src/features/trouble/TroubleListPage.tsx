/**
 * 機器トラブル報告の一覧（設計書 §18）。
 * 「困っている人がすぐ報告できる」ことを最優先に、新規報告ボタンを先頭に置く。
 */
import { Plus, Search, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TroubleCard } from '@/features/trouble/TroubleCard'
import { matchesQuery } from '@/lib/search'
import { useHubStore } from '@/stores/hubStore'
import type { TroubleStatus } from '@/types'
import { TROUBLE_STATUS_LABEL } from '@/types'

type TabValue = 'all' | TroubleStatus

const STATUSES: TroubleStatus[] = ['open', 'in_progress', 'resolved']

export function TroubleListPage() {
  const troubles = useHubStore((s) => s.troubles)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabValue>('all')

  // 検索対象：機器名・管理番号・場所・症状
  const hits = useMemo(
    () =>
      troubles.filter((t) =>
        matchesQuery(query, t.deviceName, t.assetNo, t.location, t.symptom, t.category),
      ),
    [troubles, query],
  )

  const counts = useMemo(() => {
    const base: Record<TabValue, number> = {
      all: hits.length,
      open: 0,
      in_progress: 0,
      resolved: 0,
    }
    for (const t of hits) base[t.status] += 1
    return base
  }, [hits])

  const visible = useMemo(
    () =>
      hits
        .filter((t) => tab === 'all' || t.status === tab)
        .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)),
    [hits, tab],
  )

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="機器トラブル" description="報告と対応状況" hideBack />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <DemoNotice />

        <Button asChild size="lg" className="w-full gap-2">
          <Link to="/trouble/new">
            <Plus aria-hidden />
            新規報告
          </Link>
        </Button>

        <div>
          <label htmlFor="trouble-search" className="sr-only">
            報告を検索
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="trouble-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="機器名・管理番号・場所・症状で検索"
              className="h-12 rounded-xl pr-11 pl-11 text-base"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="検索語を消す"
                onClick={() => setQuery('')}
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
              >
                <X aria-hidden />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="all" className="px-3">
                すべて {counts.all}
              </TabsTrigger>
              {STATUSES.map((status) => (
                <TabsTrigger key={status} value={status} className="px-3">
                  {TROUBLE_STATUS_LABEL[status]} {counts[status]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="該当する報告がありません"
            description="検索条件を変えるか、新しく報告してください。"
            action={
              <Button asChild variant="outline">
                <Link to="/trouble/new">新規報告する</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5 pb-6">
            <p className="text-xs text-muted-foreground">{visible.length} 件を報告の新しい順に表示</p>
            {visible.map((trouble) => (
              <TroubleCard key={trouble.id} trouble={trouble} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
