/**
 * ログイン画面（ルート `/login`）。
 *
 * AppShell の外側にある独立画面。プロトタイプなので認証は行わず、
 * 「誰としてアプリを見るか」を選ぶための入口として作る。
 * 入力値の検証もしない（未入力のときだけボタンを無効にする）。
 */
import { Eye, EyeOff, Hospital, IdCard, KeyRound, LogIn, ShieldCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { DemoNotice } from '@/components/common/DemoNotice'
import { UserAvatar } from '@/components/common/UserAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { DEFAULT_USER_ID } from '@/repositories/hubRepository'
import { useStaff } from '@/stores/directoryStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { Role, User } from '@/types'
import { ROLE_LABEL } from '@/types'

/** デモ用の利用者一覧を並べる順番と、その権限で何が見えるかの一言説明 */
const ROLE_GROUPS: { role: Role; summary: string }[] = [
  {
    role: 'USER',
    summary: 'チャット・お知らせ・ナレッジ・機器トラブル報告・安否確認・アンケート',
  },
  {
    role: 'GROUP_ADMIN',
    summary: '＋ グループの作成、重要メッセージ化、管理画面のダッシュボード',
  },
  {
    role: 'DEPARTMENT_ADMIN',
    summary: '＋ お知らせ配信・アンケート・部署・安否確認の集計',
  },
  {
    role: 'SYSTEM_ADMIN',
    summary: '＋ ユーザーの権限変更・監査ログ・システム設定',
  },
]

export function LoginPage() {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated)
  const login = useSessionStore((s) => s.login)
  const staff = useStaff()
  const location = useLocation()

  const [staffId, setStaffId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // RequireAuth が「どこから弾かれたか」を state で渡してくる
  const from = (location.state as { from?: string } | null)?.from
  const destination = from && from !== '/login' ? from : '/groups'

  /**
   * 選んだ職員としてログインする。
   * 遷移は下の <Navigate to={destination}> に任せる
   * （ここで navigate も呼ぶと、再描画で走る <Navigate> と競合して行き先が上書きされる）。
   */
  const signInAs = (userId: string) => {
    login(userId)
  }

  /**
   * フォームからのログイン。プロトタイプなので入力値は検証しない。
   * 職員IDが名簿と一致すればその職員、しなければ既定の主人公として入る。
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const key = staffId.trim().toLowerCase()
    const matched = staff.find(
      (u) =>
        u.id.toLowerCase() === key ||
        u.name.toLowerCase() === key ||
        u.kana.toLowerCase() === key ||
        u.extension === key,
    )
    signInAs(matched?.id ?? DEFAULT_USER_ID)
  }

  // すでにログイン済みならログイン画面には留まらない
  if (isAuthenticated) return <Navigate to={destination} replace />

  const hero = staff.find((u) => u.id === DEFAULT_USER_ID)
  // 主人公は上段で目立たせるので、権限ごとの一覧からは外す
  const groups = ROLE_GROUPS.map((group) => ({
    ...group,
    members: staff.filter((u) => u.role === group.role && u.id !== DEFAULT_USER_ID),
  }))

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* ロゴマーク */}
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Hospital className="size-7" aria-hidden />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-foreground">院内ハブ</h1>
          <p className="text-xs font-medium tracking-widest text-muted-foreground">
            Hospital Communication Hub
          </p>
        </div>

        {/* 職員ID・パスワード */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-staff-id">
                <IdCard className="size-4 text-muted-foreground" aria-hidden />
                職員ID
              </Label>
              <Input
                id="login-staff-id"
                name="staffId"
                autoComplete="username"
                placeholder="例：u-naito"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">
                <KeyRound className="size-4 text-muted-foreground" aria-hidden />
                パスワード
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="パスワード"
                  className="pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2"
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={!staffId.trim() || !password.trim()}>
              <LogIn className="size-4" aria-hidden />
              ログイン
            </Button>
          </form>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            プロトタイプのため、入力内容は検証しません。職員IDが名簿と一致しない場合は
            内藤（臨床工学技士）としてログインします。
          </p>
        </section>

        <div className="my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">または</span>
          <Separator className="flex-1" />
        </div>

        {/* デモ用の利用者選択 */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">
              デモ用：利用者を選んでログイン
            </h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            選んだ職員としてすぐに画面へ入れます。権限によって見える機能が変わります。
          </p>

          {hero && (
            <>
              <p className="mt-4 mb-2 text-xs font-semibold text-foreground">既定の利用者</p>
              <StaffButton user={hero} featured onSelect={signInAs} />
            </>
          )}

          <div className="mt-5 flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.role}>
                <div className="mb-2">
                  <p className="text-xs font-semibold text-foreground">{ROLE_LABEL[group.role]}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{group.summary}</p>
                </div>
                {group.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">該当する職員はいません。</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {group.members.map((user) => (
                      <li key={user.id}>
                        <StaffButton user={user} onSelect={signInAs} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          これはデモ用のプロトタイプです。実在の患者情報・職員情報は含まれていません。
        </p>
        <DemoNotice className="mt-3" />
      </div>
    </div>
  )
}

interface StaffButtonProps {
  user: User
  /** 既定の主人公は枠を強調する */
  featured?: boolean
  onSelect: (userId: string) => void
}

/** 利用者1人ぶんの選択ボタン（タッチターゲット 44px 以上） */
function StaffButton({ user, featured, onSelect }: StaffButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(user.id)}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
        featured
          ? 'border-primary bg-secondary hover:bg-secondary/70'
          : 'border-border bg-card hover:bg-muted',
      )}
    >
      <UserAvatar user={user} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
          {!user.active && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              在籍なし
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {user.department} / {user.jobTitle}
        </span>
      </span>
      <LogIn className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
