/**
 * 院内ナレッジの記事詳細（設計指示 §17）。
 * 本文は Markdown。臨床の手順は一次資料が正であることを画面上で明示する。
 */
import { CalendarClock, Download, FileText, Info, Library, Sparkles, Tag } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { KnowledgeTypeBadge } from '@/features/knowledge/KnowledgeTypeBadge'
import { MarkdownBody } from '@/features/knowledge/MarkdownBody'
import { formatDateSeparator } from '@/lib/format'
import { useHubStore } from '@/stores/hubStore'

export function KnowledgeDetailPage() {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const doc = useHubStore((s) => s.knowledge.find((k) => k.id === docId))

  if (!doc) {
    return (
      <div className="scrollbar-slim h-full overflow-y-auto">
        <PageHeader title="ナレッジ詳細" backTo="/knowledge" />
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <EmptyState
            icon={FileText}
            title="記事が見つかりません"
            description="削除されたか、URL が正しくない可能性があります。"
            action={
              <Button asChild variant="outline">
                <Link to="/knowledge">院内ナレッジへ戻る</Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title={doc.title} description={doc.category} backTo="/knowledge" />

      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <DemoNotice />

        {/* 書誌情報 */}
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <h2 className="text-lg leading-snug font-bold">{doc.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{doc.summary}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <KnowledgeTypeBadge docType={doc.docType} />
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground">
              <Library className="size-3.5 text-muted-foreground" aria-hidden />
              {doc.category}
            </span>
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
              >
                <Tag className="size-3" aria-hidden />
                {tag}
              </span>
            ))}
          </div>

          <dl className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex gap-2">
              <dt className="shrink-0">
                <CalendarClock className="mt-0.5 size-3.5" aria-hidden />
                <span className="sr-only">更新日</span>
              </dt>
              <dd>更新 {formatDateSeparator(doc.updatedAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0">出典</dt>
              <dd className="min-w-0 break-words">{doc.source}</dd>
            </div>
          </dl>
        </section>

        {/* 本文の扱いについての注意（常時表示） */}
        <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-xs leading-relaxed text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            本文の一部は<strong className="font-semibold">デモ用のプレースホルダ</strong>
            です。実際の手順・設定値は、院内マニュアルおよび各機器の添付文書・取扱説明書を参照してください。
          </span>
        </p>

        {/* 本文 */}
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <MarkdownBody body={doc.body} />
        </section>

        {/* 添付ファイル */}
        {doc.attachmentName && (
          <section className="rounded-xl bg-card p-4 ring-1 ring-border">
            <h3 className="text-sm font-semibold">添付ファイル</h3>
            <Button
              variant="outline"
              className="mt-2 h-auto w-full justify-start gap-2 py-2.5 text-left"
              onClick={() =>
                toast.info('プロトタイプではダウンロードできません', {
                  description: doc.attachmentName,
                })
              }
            >
              <Download className="shrink-0" aria-hidden />
              <span className="min-w-0 break-all whitespace-normal">{doc.attachmentName}</span>
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              プロトタイプのため、実ファイルは同梱していません。
            </p>
          </section>
        )}

        {/* AI アシスタントへの導線 */}
        <div className="pb-6">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate(`/ai?q=${encodeURIComponent(doc.title)}`)}
          >
            <Sparkles aria-hidden />
            この内容について AI に聞く
          </Button>
        </div>
      </div>
    </div>
  )
}
