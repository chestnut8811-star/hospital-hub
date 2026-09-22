/** 管理画面の各ブロックの枠。見出し・説明・右上の操作ボタンを揃える。 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AdminPanelProps {
  title: string
  description?: string
  /** 見出しの右に置く操作（作成ボタンなど） */
  actions?: ReactNode
  /** 表を敷き詰めるときは false にして左右の余白を外す */
  padded?: boolean
  className?: string
  children: ReactNode
}

export function AdminPanel({
  title,
  description,
  actions,
  padded = true,
  className,
  children,
}: AdminPanelProps) {
  return (
    <section className={cn('rounded-xl border border-border bg-card shadow-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className={cn(padded ? 'p-4' : 'py-1')}>{children}</div>
    </section>
  )
}
