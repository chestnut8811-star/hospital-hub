import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** 戻る先。省略時はブラウザバック */
  backTo?: string
  /** 戻るボタンを出さない（タブ直下の画面） */
  hideBack?: boolean
  actions?: ReactNode
  className?: string
}

/** 画面タイトルと戻る導線。機能側でヘッダーを自作せず、これを使う。 */
export function PageHeader({
  title,
  description,
  backTo,
  hideBack,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-border bg-card/95 px-2 backdrop-blur-sm lg:px-4',
        className,
      )}
    >
      {!hideBack && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="戻る"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        >
          <ArrowLeft className="size-5" />
        </Button>
      )}
      <div className={cn('min-w-0 flex-1', hideBack && 'pl-2')}>
        <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
        {description && (
          <p className="truncate text-sm leading-tight text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  )
}
