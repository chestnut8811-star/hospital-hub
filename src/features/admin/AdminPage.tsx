/**
 * 管理画面（ルート `/admin` `/admin/:section`、設計指示 §19 §20）。
 *
 * PC 前提の画面だが、スマホでも破綻しないようにサブナビは横スクロールのタブ列になる。
 * どの権限にどのセクションを見せるかは `adminSections.ts` の定義だけで決める。
 */
import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/stores/sessionStore'
import { hasRole, ROLE_LABEL } from '@/types'
import type { AdminSectionId } from '@/features/admin/adminSections'
import {
  ADMIN_ENTRY_ROLE,
  ADMIN_SECTIONS,
  DEFAULT_ADMIN_SECTION,
  findAdminSection,
} from '@/features/admin/adminSections'
import { AnnouncementsSection } from '@/features/admin/sections/AnnouncementsSection'
import { AuditSection } from '@/features/admin/sections/AuditSection'
import { DashboardSection } from '@/features/admin/sections/DashboardSection'
import { DepartmentsSection } from '@/features/admin/sections/DepartmentsSection'
import { GroupsSection } from '@/features/admin/sections/GroupsSection'
import { SafetySection } from '@/features/admin/sections/SafetySection'
import { SettingsSection } from '@/features/admin/sections/SettingsSection'
import { SurveysSection } from '@/features/admin/sections/SurveysSection'
import { UsersSection } from '@/features/admin/sections/UsersSection'

function renderSection(id: AdminSectionId) {
  switch (id) {
    case 'dashboard':
      return <DashboardSection />
    case 'groups':
      return <GroupsSection />
    case 'users':
      return <UsersSection />
    case 'departments':
      return <DepartmentsSection />
    case 'announcements':
      return <AnnouncementsSection />
    case 'surveys':
      return <SurveysSection />
    case 'safety':
      return <SafetySection />
    case 'audit':
      return <AuditSection />
    case 'settings':
      return <SettingsSection />
  }
}

export function AdminPage() {
  const { section } = useParams()
  const me = useCurrentUser()

  // 自分の権限で開けるセクションだけをサブナビに出す
  const visible = useMemo(() => ADMIN_SECTIONS.filter((s) => hasRole(me.role, s.minRole)), [me.role])

  // スマホの横スクロールタブでは、開いている項目を横方向だけ画面内に寄せる。
  // ref コールバックのままだと再描画のたびに走り、縦スクロール位置まで戻ってしまう。
  const activeTabRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [section])

  const requested = findAdminSection(section)
  const current = requested && hasRole(me.role, requested.minRole) ? requested : undefined

  if (!hasRole(me.role, ADMIN_ENTRY_ROLE)) {
    return (
      <AdminFrame>
        <EmptyState
          icon={ShieldAlert}
          title="この画面を表示する権限がありません"
          description={`管理画面は${ROLE_LABEL[ADMIN_ENTRY_ROLE]}以上が利用できます。現在の権限は「${ROLE_LABEL[me.role]}」です。`}
          action={
            <Button asChild>
              <Link to="/menu">メニューへ戻る</Link>
            </Button>
          }
        />
        <DemoNotice className="mt-4" />
      </AdminFrame>
    )
  }

  return (
    <AdminFrame>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <nav aria-label="管理メニュー" className="lg:w-56 lg:shrink-0">
          {/* スマホは横スクロールのタブ列、PC は縦並びのリスト */}
          <ul className="scrollbar-slim -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-x-visible lg:px-0 lg:pb-0">
            {visible.map((item) => {
              const active = item.id === (section ?? DEFAULT_ADMIN_SECTION)
              return (
                <li key={item.id} className="shrink-0">
                  <Link
                    to={`/admin/${item.id}`}
                    ref={active ? activeTabRef : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors lg:w-full',
                      active
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {current ? (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{current.label}</h2>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {current.description}
                </p>
              </div>
              {renderSection(current.id)}
            </div>
          ) : requested ? (
            <EmptyState
              icon={ShieldAlert}
              title="この画面を表示する権限がありません"
              description={`「${requested.label}」は${ROLE_LABEL[requested.minRole]}以上が利用できます。現在の権限は「${ROLE_LABEL[me.role]}」です。`}
              action={
                <Button asChild variant="outline">
                  <Link to="/admin">ダッシュボードへ戻る</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={ShieldAlert}
              title="指定された管理画面が見つかりません"
              description="左のメニューから開きたい項目を選んでください。"
              action={
                <Button asChild variant="outline">
                  <Link to="/admin">ダッシュボードへ戻る</Link>
                </Button>
              }
            />
          )}
          <DemoNotice className="mt-4" />
        </div>
      </div>
    </AdminFrame>
  )
}

/** AppShell が高さを管理しているので、外枠の形は固定する */
function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="管理" hideBack />
      <div className="mx-auto w-full max-w-6xl px-4 py-4">{children}</div>
    </div>
  )
}
