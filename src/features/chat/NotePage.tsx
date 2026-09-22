import { FileText, History, ImageIcon, NotebookPen, Pencil, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DemoNotice } from '@/components/common/DemoNotice'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/format'
import { AttachmentCard } from '@/features/chat/components/MessageContent'
import { Markdown } from '@/features/chat/components/Markdown'
import { useChatStore, useNote, useRoom, useRoomMessages } from '@/stores/chatStore'
import { getUser } from '@/stores/directoryStore'

type TabKey = 'note' | 'files' | 'images'

/** 共有ノート・ファイル・画像（設計指示 §12） */
export function NotePage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const room = useRoom(roomId)
  const note = useNote(roomId)
  const messages = useRoomMessages(roomId)
  const saveNote = useChatStore((s) => s.saveNote)

  const requestedTab = params.get('tab')
  // 未知の値が来ても本文が空にならないようにノートへ落とす
  const tab: TabKey =
    requestedTab === 'files' || requestedTab === 'images' || requestedTab === 'note'
      ? requestedTab
      : 'note'
  const [editing, setEditing] = useState(false)
  const [baseVersion, setBaseVersion] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [summary, setSummary] = useState('')
  const [conflictOpen, setConflictOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const files = useMemo(
    () =>
      messages.flatMap((m) =>
        (m.attachments ?? [])
          .filter((a) => a.kind === 'file')
          .map((a) => ({ attachment: a, message: m })),
      ),
    [messages],
  )
  const images = useMemo(
    () =>
      messages.flatMap((m) =>
        (m.attachments ?? [])
          .filter((a) => a.kind === 'image')
          .map((a) => ({ attachment: a, message: m })),
      ),
    [messages],
  )

  if (!room) {
    return (
      <div className="h-full overflow-y-auto">
        <EmptyState
          icon={NotebookPen}
          title="ルームが見つかりません"
          action={<Button onClick={() => navigate('/groups')}>グループ一覧へ</Button>}
        />
      </div>
    )
  }

  const startEdit = () => {
    setTitle(note?.title ?? `${room.name} ノート`)
    setBody(note?.body ?? '')
    setSummary('')
    setBaseVersion(note?.version ?? 0)
    setEditing(true)
  }

  const commit = () => {
    saveNote(room.id, { title: title.trim(), body, summary: summary.trim() })
    setEditing(false)
    toast.success(`ノートを更新しました（v${(note?.version ?? 0) + 1}）`)
  }

  const trySave = () => {
    // 同時編集による上書きを防ぐ（設計指示 §12）
    if (note && note.version !== baseVersion) setConflictOpen(true)
    else commit()
  }

  return (
    <div className="scrollbar-slim h-full overflow-y-auto">
      <PageHeader
        title={room.name || 'チャット'}
        description="共有ノート・ファイル・画像"
        backTo={`/chat/${room.id}`}
        actions={
          tab === 'note' && !editing ? (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Pencil className="size-4" aria-hidden />
              編集
            </Button>
          ) : null
        }
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <DemoNotice className="mb-4" />

        <Tabs
          value={tab}
          onValueChange={(value) => setParams(value === 'note' ? {} : { tab: value })}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="note">
              <NotebookPen className="size-4" aria-hidden />
              ノート
            </TabsTrigger>
            <TabsTrigger value="files">
              <FileText className="size-4" aria-hidden />
              ファイル（{files.length}）
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="size-4" aria-hidden />
              画像（{images.length}）
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === 'note' &&
          (editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="note-title">タイトル</Label>
                <Input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note-body">本文（Markdown）</Label>
                <Textarea
                  id="note-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={16}
                  className="min-h-80 font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note-summary">更新内容（履歴に残ります）</Label>
                <Input
                  id="note-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="例）チェックリストの項目を追加"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={trySave} disabled={!title.trim()}>
                  <Save className="size-4" aria-hidden />
                  保存（v{(note?.version ?? 0) + 1}）
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="size-4" aria-hidden />
                  キャンセル
                </Button>
              </div>
            </div>
          ) : note ? (
            <article>
              <header className="mb-3 border-b border-border pb-3">
                <h2 className="text-lg font-bold">{note.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  v{note.version}・{getUser(note.updatedBy).name} が{' '}
                  {formatDateTime(note.updatedAt)} に更新
                </p>
              </header>
              <Markdown>{note.body}</Markdown>

              <div className="mt-6">
                <Button variant="outline" size="sm" onClick={() => setHistoryOpen((v) => !v)}>
                  <History className="size-4" aria-hidden />
                  更新履歴（{note.revisions.length}）
                </Button>
                {historyOpen && (
                  <ol className="mt-3 space-y-2">
                    {note.revisions.map((rev) => (
                      <li
                        key={rev.id}
                        className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <p className="font-medium">
                          v{rev.version}・{rev.summary}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getUser(rev.updatedBy).name}・{formatDateTime(rev.updatedAt)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </article>
          ) : (
            <EmptyState
              icon={NotebookPen}
              title="ノートはまだありません"
              description="このルームの申し送りや手順をまとめておけます。"
              action={<Button onClick={startEdit}>ノートを作成</Button>}
            />
          ))}

        {tab === 'files' &&
          (files.length === 0 ? (
            <EmptyState icon={FileText} title="ファイルはまだありません" />
          ) : (
            <ul className="space-y-2">
              {files.map(({ attachment, message }) => (
                <li key={attachment.id}>
                  <AttachmentCard attachment={attachment} />
                  <p className="mt-0.5 px-1 text-xs text-muted-foreground">
                    {getUser(message.senderId).name}・{formatDateTime(message.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'images' &&
          (images.length === 0 ? (
            <EmptyState icon={ImageIcon} title="画像はまだありません" />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {images.map(({ attachment, message }) => (
                <li key={attachment.id}>
                  <AttachmentCard attachment={attachment} />
                  <p className="mt-0.5 px-1 text-xs text-muted-foreground">
                    {getUser(message.senderId).name}・{formatDateTime(message.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ))}
      </div>

      <ConfirmDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        title="ほかの人がノートを更新しています"
        description={
          <span>
            あなたが編集を始めたあとに{' '}
            <strong>v{note?.version}（{note ? getUser(note.updatedBy).name : ''}）</strong>{' '}
            の更新がありました。このまま保存すると、その変更は上書きされます。
            <br />
            編集内容をコピーしてから、最新版を読み直すことをおすすめします。
          </span>
        }
        confirmLabel="上書きして保存"
        destructive
        onConfirm={commit}
      />

    </div>
  )
}
