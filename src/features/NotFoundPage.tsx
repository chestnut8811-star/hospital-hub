import { Compass } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="h-full overflow-y-auto">
      <EmptyState
        icon={Compass}
        title="ページが見つかりません"
        description="URL が変更されたか、削除された可能性があります。"
        action={<Button onClick={() => navigate('/groups')}>グループ一覧へ戻る</Button>}
      />
    </div>
  )
}
