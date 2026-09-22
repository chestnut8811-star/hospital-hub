/** 検索結果 1 件分のカード。押すと記事の詳細へ移動する。 */
import { CalendarClock, ChevronRight, Library, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Highlight } from '@/components/common/Highlight'
import { KnowledgeTypeBadge } from '@/features/knowledge/KnowledgeTypeBadge'
import { formatDateSeparator } from '@/lib/format'
import type { KnowledgeDoc } from '@/types'

interface KnowledgeCardProps {
  doc: KnowledgeDoc
  /** 強調表示する検索語 */
  query: string
}

export function KnowledgeCard({ doc, query }: KnowledgeCardProps) {
  return (
    <Link
      to={`/knowledge/${doc.id}`}
      className="block rounded-xl bg-card p-4 ring-1 ring-border transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] leading-snug font-semibold text-foreground">
            <Highlight text={doc.title} query={query} />
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            <Highlight text={doc.summary} query={query} />
          </p>
        </div>
        <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>

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

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3.5" aria-hidden />
          更新 {formatDateSeparator(doc.updatedAt)}
        </span>
        <span className="min-w-0 break-words">出典：{doc.source}</span>
      </div>
    </Link>
  )
}
