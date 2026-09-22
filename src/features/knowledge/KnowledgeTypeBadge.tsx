/** ナレッジ記事の種別バッジ。色だけに頼らず、必ずアイコンと文言を添える。 */
import { BookText, GraduationCap, MessagesSquare, Paperclip } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KnowledgeDocType } from '@/types'
import { KNOWLEDGE_TYPE_LABEL } from '@/types'

const STYLES: Record<KnowledgeDocType, { chip: string; Icon: LucideIcon }> = {
  manual: { chip: 'bg-secondary text-secondary-foreground', Icon: BookText },
  faq: { chip: 'bg-info-soft text-secondary-foreground', Icon: MessagesSquare },
  material: { chip: 'bg-muted text-foreground', Icon: Paperclip },
  education: { chip: 'bg-success-soft text-foreground', Icon: GraduationCap },
}

export function KnowledgeTypeBadge({
  docType,
  className,
}: {
  docType: KnowledgeDocType
  className?: string
}) {
  const { chip, Icon } = STYLES[docType]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
        chip,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {KNOWLEDGE_TYPE_LABEL[docType]}
    </span>
  )
}
