/**
 * お知らせ詳細。開いた時点で既読にする。
 * 本文は配信者が書いた改行をそのまま保つ（whitespace-pre-wrap）。
 */
import { CalendarClock, FileText, Megaphone, Users } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { PriorityBadge } from '@/components/common/PriorityBadge'
import { UserAvatar } from '@/components/common/UserAvatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatFullDateTime } from '@/lib/format'
import { useUser } from '@/stores/directoryStore'
import { isVisibleToUser } from '@/lib/targeting'
import { useHubStore } from '@/stores/hubStore'
import { useCurrentUser } from '@/stores/sessionStore'

export function AnnouncementDetailPage() {
  const { announcementId } = useParams<{ announcementId: string }>()
  const me = useCurrentUser()
  const announcements = useHubStore((s) => s.announcements)
  const markAnnouncementRead = useHubStore((s) => s.markAnnouncementRead)

  const announcement = useMemo(
    () => announcements.find((a) => a.id === announcementId),
    [announcements, announcementId],
  )
  const author = useUser(announcement?.authorId ?? '')

  // 配信対象外のお知らせは、URL を直接開いても中身を出さない（既読の母数が汚れるため）
  const visible = announcement
    ? isVisibleToUser(announcement, { id: me.id, department: me.department })
    : false

  useEffect(() => {
    if (announcementId && visible) markAnnouncementRead(announcementId)
  }, [announcementId, markAnnouncementRead, visible])

  if (announcement && !visible) {
    return (
      <div className="scrollbar-slim h-full overflow-y-auto">
        <PageHeader title="お知らせ" backTo="/announcements" />
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <EmptyState
            icon={Megaphone}
            title="このお知らせは自分あてではありません"
            description={`配信対象は「${announcement.targets.join('・')}」です。一覧から自分あてのお知らせを選んでください。`}
          />
        </div>
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="scrollbar-slim h-full overflow-y-auto">
        <PageHeader title="お知らせ" backTo="/announcements" />
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
          <EmptyState
            icon={Megaphone}
            title="お知らせが見つかりません"
            description="削除されたか、リンクが正しくない可能性があります。一覧から選び直してください。"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader title="お知らせ" backTo="/announcements" />
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
        <article className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={announcement.priority} />
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {announcement.category}
            </span>
          </div>

          <h2 className="mt-2 text-lg font-bold leading-snug">{announcement.title}</h2>

          <dl className="mt-3 space-y-1.5 border-y border-border py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 shrink-0" aria-hidden />
              <dt className="sr-only">配信日時</dt>
              <dd>{formatFullDateTime(announcement.publishedAt)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden />
              <dt className="sr-only">対象</dt>
              <dd>対象：{announcement.targets.join('・')}</dd>
            </div>
          </dl>

          <div className="mt-3 flex items-center gap-2">
            <UserAvatar user={author} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{author.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {author.department} / {author.jobTitle}
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
            {announcement.body}
          </p>

          {announcement.attachments && announcement.attachments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {announcement.attachments.map((attachment) => (
                <li
                  key={attachment.id}
                  className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-sm"
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{attachment.name}</span>
                    {attachment.caption && (
                      <span className="block text-xs text-muted-foreground">
                        {attachment.caption}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <DemoNotice />
      </div>
    </div>
  )
}
