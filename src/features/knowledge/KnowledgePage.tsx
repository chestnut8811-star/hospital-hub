/**
 * 院内ナレッジ検索（設計指示 §17）。
 * 大きな検索欄を主役に、入力と同時に絞り込む。臨床の手順そのものは扱わず、
 * 「どこに書いてあるか」へ案内する画面として作る。
 */
import { Info, Search, SearchX, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KnowledgeCard } from '@/features/knowledge/KnowledgeCard'
import { matchesQuery } from '@/lib/search'
import { useHubStore } from '@/stores/hubStore'
import type { KnowledgeDocType } from '@/types'
import { KNOWLEDGE_TYPE_LABEL } from '@/types'

/** タブの値。'all' は絞り込みなし */
type TabValue = 'all' | KnowledgeDocType

const DOC_TYPES: KnowledgeDocType[] = ['manual', 'faq', 'material', 'education']

/** 検索のとっかかりになる語。押すと検索欄に入る */
const SUGGESTED_WORDS = ['点検', '貸出', 'TAVI', '安否確認', 'パスワード']

export function KnowledgePage() {
  const knowledge = useHubStore((s) => s.knowledge)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabValue>('all')

  // 検索語での絞り込み（タイトル・要約・本文・タグ・カテゴリーが対象）
  const hits = useMemo(
    () =>
      knowledge.filter((doc) =>
        matchesQuery(query, doc.title, doc.summary, doc.body, doc.tags.join(' '), doc.category),
      ),
    [knowledge, query],
  )

  // タブに出す件数。検索語で絞った結果に対して数える
  const counts = useMemo(() => {
    const base: Record<TabValue, number> = {
      all: hits.length,
      manual: 0,
      faq: 0,
      material: 0,
      education: 0,
    }
    for (const doc of hits) base[doc.docType] += 1
    return base
  }, [hits])

  // 表示順は常に更新日の新しい順
  const visible = useMemo(
    () =>
      hits
        .filter((doc) => tab === 'all' || doc.docType === tab)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [hits, tab],
  )

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader
        title="院内ナレッジ"
        description="マニュアル・FAQ・資料をまとめて検索"
        hideBack
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/ai">
              <Sparkles aria-hidden />
              AI に聞く
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <DemoNotice />

        {/* 検索欄（この画面の主役） */}
        <div>
          <label htmlFor="knowledge-search" className="sr-only">
            院内ナレッジを検索
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="knowledge-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワードで検索（例：貸出、点検、パスワード）"
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

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">よく検索される語</span>
            {SUGGESTED_WORDS.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => setQuery(word)}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* 種別の絞り込み。375px でも画面ごと横スクロールしないよう、タブ列だけを流す */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="all" className="px-3">
                すべて {counts.all}
              </TabsTrigger>
              {DOC_TYPES.map((docType) => (
                <TabsTrigger key={docType} value={docType} className="px-3">
                  {KNOWLEDGE_TYPE_LABEL[docType]} {counts[docType]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {/* 検索結果の上に常に出す注意書き（臨床内容の扱い） */}
        <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-xs leading-relaxed text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            本文の一部は<strong className="font-semibold">デモ用のプレースホルダ</strong>
            です。実際の手順・設定値は、院内マニュアルおよび各機器の添付文書・取扱説明書を参照してください。
          </span>
        </p>

        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="該当する記事がありません"
            description="言葉を短くするか、別の言い方でもう一度お試しください。見つからないときは担当部署へ確認してください。"
            action={
              query ? (
                <Button variant="outline" onClick={() => setQuery('')}>
                  検索条件を消す
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2.5 pb-6">
            <p className="text-xs text-muted-foreground">{visible.length} 件を更新の新しい順に表示</p>
            {visible.map((doc) => (
              <KnowledgeCard key={doc.id} doc={doc} query={query} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
