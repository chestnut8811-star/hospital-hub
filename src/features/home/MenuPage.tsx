/**
 * メニュー画面（設計書 §10）。
 *
 * 院内機能への入口をタイルで並べる。上部には「今すぐ見るべきもの」
 * （未回答の安否確認・最新のお知らせ）を置き、タイルは権限で出し分ける。
 */
import { ChevronRight, Megaphone, Siren } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { UserAvatar } from '@/components/common/UserAvatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { formatBadgeCount, formatDateTime } from '@/lib/format'
import { APP_TILES, type NavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import {
  useActiveDrill,
  useAnnouncements,
  useOpenSurveyCount,
  useOpenTroubleCount,
  useUnreadAnnouncementCount,
} from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'
import { ROLE_LABEL, hasRole } from '@/types'

/** タイル右上のバッジ。色だけに頼らず、読み上げ用の文言も持たせる。 */
interface TileBadge {
  text: string
  label: string
  tone: 'danger' | 'primary'
}

export function MenuPage() {
  const me = useCurrentUser()
  const announcements = useAnnouncements()
  const unreadAnnouncements = useUnreadAnnouncementCount(me.id)
  const openTroubles = useOpenTroubleCount()
  const openSurveys = useOpenSurveyCount()
  const drill = useActiveDrill()

  /** 進行中の安否確認に自分がまだ答えていないか */
  const safetyPending = Boolean(drill && !drill.responses.some((r) => r.userId === me.id))

  const tiles = useMemo(() => APP_TILES.filter((tile) => hasRole(me.role, tile.minRole)), [me.role])
  const latestAnnouncements = useMemo(() => announcements.slice(0, 3), [announcements])

  function badgeOf(tile: NavItem): TileBadge | null {
    switch (tile.badge) {
      case 'announcements':
        return unreadAnnouncements > 0
          ? {
              text: formatBadgeCount(unreadAnnouncements),
              label: `未読 ${unreadAnnouncements} 件`,
              tone: 'primary',
            }
          : null
      case 'troubles':
        return openTroubles > 0
          ? {
              text: formatBadgeCount(openTroubles),
              label: `未対応 ${openTroubles} 件`,
              tone: 'danger',
            }
          : null
      case 'surveys':
        return openSurveys > 0
          ? {
              text: formatBadgeCount(openSurveys),
              label: `実施中 ${openSurveys} 件`,
              tone: 'primary',
            }
          : null
      case 'safety':
        return safetyPending ? { text: '未回答', label: '未回答', tone: 'danger' } : null
      default:
        return null
    }
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="メニュー" hideBack />
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        {/* 未回答の安否確認は他のどの情報よりも先に出す */}
        {drill && safetyPending && (
          <section
            className="rounded-xl bg-danger-soft p-4 ring-1 ring-danger/30"
            aria-labelledby="safety-alert-title"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-danger text-danger-foreground">
                <Siren className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-danger">
                  {drill.isDrill ? '訓練 / 要回答' : '要回答'}
                </p>
                <h2 id="safety-alert-title" className="text-base font-semibold leading-snug">
                  {drill.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  安否確認が届いています。回答がまだ登録されていません。
                </p>
              </div>
            </div>
            <Button asChild className="mt-3 w-full bg-danger text-danger-foreground hover:bg-danger/90">
              <Link to="/safety">安否確認に回答する</Link>
            </Button>
          </section>
        )}

        {/* お知らせ（最新3件） */}
        <section className="rounded-xl bg-card ring-1 ring-foreground/10" aria-labelledby="menu-announcements">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Megaphone className="size-4 text-muted-foreground" aria-hidden />
            <h2 id="menu-announcements" className="flex-1 text-sm font-semibold">
              お知らせ
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/announcements">
                すべて見る
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {latestAnnouncements.map((announcement) => {
              const unread = !announcement.readUserIds.includes(me.id)
              return (
                <li key={announcement.id}>
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {unread && (
                          <span className="rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary-foreground">
                            NEW
                          </span>
                        )}
                        <span className="truncate text-xs text-muted-foreground">
                          {announcement.category}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'mt-1 line-clamp-2 text-sm leading-snug',
                          unread ? 'font-semibold text-foreground' : 'text-foreground/80',
                        )}
                      >
                        {announcement.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(announcement.publishedAt)}
                      </p>
                    </div>
                    <ChevronRight
                      className="mt-1 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </Link>
                </li>
              )
            })}
            {latestAnnouncements.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                お知らせはありません。
              </li>
            )}
          </ul>
        </section>

        {/* アプリタイル */}
        <section aria-labelledby="menu-apps">
          <h2 id="menu-apps" className="mb-2 px-1 text-sm font-semibold text-muted-foreground">
            院内の機能
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {tiles.map((tile) => {
              const badge = badgeOf(tile)
              const Icon = tile.icon
              return (
                <li key={tile.id}>
                  <Link
                    to={tile.to}
                    className="relative flex h-full min-h-28 flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10 transition-shadow hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${tile.accent}1f`, color: tile.accent }}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold leading-snug">{tile.label}</span>
                    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {tile.description}
                    </span>
                    {badge && (
                      <span
                        className={cn(
                          'absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums',
                          badge.tone === 'danger'
                            ? 'bg-danger text-danger-foreground'
                            : 'bg-primary text-primary-foreground',
                        )}
                      >
                        <span aria-hidden>{badge.text}</span>
                        <span className="sr-only">{badge.label}</span>
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {/* 自分の情報 */}
        <section
          className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          aria-labelledby="menu-me"
        >
          <UserAvatar user={me} size="md" />
          <div className="min-w-0 flex-1">
            <h2 id="menu-me" className="truncate text-sm font-semibold">
              {me.name}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {me.department} / {me.jobTitle}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {ROLE_LABEL[me.role]}
          </span>
        </section>

        <DemoNotice />
      </div>
    </div>
  )
}
