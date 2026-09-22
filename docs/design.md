# Hospital Communication Hub — 設計書（Phase 1: UIプロトタイプ）

> コード内コメントの「設計指示 §n」は、依頼時に受け取った UI/UX 設計指示（§1〜§26）の節番号を指す。
> 本書（docs/design.md）の §n とは別物。

最終更新: 2026-09-22

## 1. 技術構成

| 層 | 採用 | 備考 |
|---|---|---|
| ビルド | Vite 8 + React 19 + TypeScript 6 (strict) | `npm run build` = `tsc -b && vite build` |
| スタイル | Tailwind CSS v4（`@tailwindcss/vite`） | 設定ファイル不要。トークンは `src/index.css` の `@theme inline` |
| UI部品 | shadcn/ui（radix-nova プリセット、`src/components/ui/`） | 生成物は自プロジェクト所有。必要なら直接編集してよい |
| アイコン | lucide-react | 絵文字はグループアイコンなど意味づけに限って使用 |
| 状態 | Zustand（`persist` で localStorage） | ストアは機能ごとに分割 |
| ルーティング | react-router-dom v7（`createBrowserRouter`） | |
| 日時 | date-fns + `ja` ロケール | 整形は `src/lib/format.ts` に集約 |
| Markdown | react-markdown + remark-gfm | 共有ノートのみ |
| Lint | oxlint (`npm run lint`) | |

外部ネットワークへの通信を持たない。フォント（Geist Variable）は npm 同梱、日本語はOS標準フォントへフォールバック。

## 2. ディレクトリと担当範囲

```
src/
  index.css              デザイントークン（共通・変更禁止）
  main.tsx  App.tsx      エントリとルータ（共通・変更禁止）
  routes.tsx             ルート定義（共通・変更禁止）
  types/index.ts         ドメイン型（共通・変更禁止）
  data/*.json            モックデータ（共通・変更禁止）
  mock/seed.ts           JSON読込＋日付リベース（共通・変更禁止）
  repositories/          データ取得の抽象（共通・変更禁止）
  stores/                Zustand ストア（共通・変更禁止）
  lib/                   utils, format, id, search（共通・変更禁止）
  components/ui/         shadcn（共通・原則変更禁止）
  components/layout/     AppShell / Header / BottomNav / Sidebar（共通・変更禁止）
  components/common/     共通表示部品（共通・変更禁止。不足時は自機能フォルダに作る）
  features/
    chat/                グループ・DM・チャット・マイルーム・共有ノート
    home/                メニュー（ダッシュボード）
    announcements/       お知らせ
    safety/              安否確認
    surveys/             アンケート
    knowledge/           院内ナレッジ
    trouble/             機器トラブル報告
    auth/                ログイン
    admin/               管理画面
```

**共通（変更禁止）と書かれたファイルは、担当外の作業者は読むだけ。** 追加が必要なら自分の
`features/<担当>/` の中に作る。ルート定義はすでに全画面分が登録済みなので触らない。

## 3. ドメインモデル

`src/types/index.ts` が唯一の定義。要点のみ:

- `User` — `kind: 'human' | 'ai' | 'system'` を持つ。AI発言は `senderId === 'ai'`
- `Room` — `kind: 'group' | 'direct' | 'myroom'`、`pinned / muted / hidden / unreadCount / hasEmergency`
- `Message` — `type: text|image|file|url|system|ai|announcement|form`、
  `priority?: 'emergency'|'important'|'normal'`、`ack?`（確認ボタン）、`readUserIds`、`reactions`
- `Announcement` / `SharedNote` / `TroubleReport` / `KnowledgeDoc` / `SafetyDrill` / `Survey`

## 4. データフロー

```
src/data/*.json ──> mock/seed.ts（ISO日時を当日へシフト）──> repositories/mockRepository.ts
                                                              │
                                     stores/*.ts（Zustand + persist）
                                                              │
                                                    features/**/*.tsx
```

- 画面は **ストア経由でのみ** データに触る。`src/data/*.json` を画面から直接 import しない
- Phase 3 で `repositories/` の実装を差し替えればバックエンドに繋がる、という前提を壊さない

### ストア一覧（実装に一致）

| ストア | 永続化キー | 持ち物 | 主なアクション |
|---|---|---|---|
| `useSessionStore` | `hch.session.v1` | `currentUserId`, `isAuthenticated` | `login(userId)` / `logout()` / `switchUser(userId)`。派生フック `useCurrentUser()` `useHasRole()` |
| `useDirectoryStore` | `hch.directory.v1` | `users`, `departments` | `updateUser` / `setRole` / `setActive` / `resetDemoData`。`getUser(id)` `useUser(id)` `useStaff()` |
| `useChatStore` | `hch.chat.v1` | `rooms`, `messages`, `notes` | `sendMessage` / `markRoomRead` / `togglePin` / `toggleMute` / `setHidden` / `leaveRoom` / `createGroup` / `updateGroup` / `createDirectRoom` / `ensureMyRoom` / `toggleReaction` / `editMessage` / `deleteMessage` / `toggleSaved` / `togglePinnedMessage` / `setMessagePriority` / `acknowledge` / `votePoll` / `saveNote` / `recalcForViewer` / `resetDemoData` |
| `useHubStore` | `hch.hub.v1` | `announcements`, `knowledge`, `troubles`, `troubleOptions`, `safetyDrills`, `surveys`, `auditLogs` | `markAnnouncementRead` / `createAnnouncement` / `createTrouble` / `updateTroubleStatus` / `addTroubleUpdate` / `assignTrouble` / `submitSafetyResponse` / `setDrillActive` / `submitSurveyResponse` / `createSurvey` / `setSurveyStatus` / `addAuditLog` / `resetDemoData` |
| `useUiStore` | （永続化しない） | `searchOpen`, `aiSummaryRoomId` | `setSearchOpen` / `setAiSummaryRoomId` |

localStorage へのアクセスは必ず try/catch で保護されている（`src/lib/storage.ts`）。
リポジトリ実装のファイル名は `src/repositories/hubRepository.ts`。

**Phase 3 で差し替えるときに必要になる作業（現状では差し替えられない）**

今の `HubRepository` は同期の `loadSeed()` しか持たず、書き込み（送信・報告・回答）はストア内部で完結している。
また `const seed = repository.loadSeed()` を3ストアのトップレベルで実行しているため、非同期の待ち合わせを挟む場所がない。
バックエンドに繋ぐ際は次の3つが必要になる:

1. `HubRepository` を `Promise` を返す形にする（`loadSeed()` → `fetchSnapshot()`）
2. 書き込み系メソッド（`sendMessage` / `createTrouble` / `submitSurveyResponse` など）を interface に足し、ストアのアクションから呼ぶ
3. ストアの初期値を空にし、`AppShell` などで `hydrate()` を呼んでから描画する（読み込み中表示が必要）

画面（`src/features/**`）はストア経由でしかデータに触れていないので、この3つを行っても画面側の変更はほぼ不要な構成にはなっている。

**日付が変わったときの扱い**: 各ストアの `merge` は保存された `seededOn` が当日でなければ保存分を捨て、
モックを作り直す。これは「いつデモしても今日の会話に見える」（要件 P4）ためで、
日付をまたぐと前日の操作結果（送信メッセージ・ピン・報告・回答）は消える。
同じ日のうちはリロードしても保持される（受け入れ条件4）。

## 5. 画面レイアウト

| ブレークポイント | 構成 |
|---|---|
| < 768px (mobile) | 56pxヘッダー ＋ 本文 ＋ 下部ナビ(3タブ, 64px)。チャットは全画面 |
| 768–1023px (tablet) | 同上。グリッドは3列 |
| ≥ 1024px (desktop) | 左サイドバー(280px) ＋ ヘッダー ＋ 本文。下部ナビ非表示。`/groups` `/direct` は一覧＋チャットの2ペイン |

`AppShell` が上記を吸収する。**機能側でヘッダー・ナビを自作しない。**
画面タイトルと戻る導線は `components/layout/PageHeader.tsx` を使う。

## 6. 表示の決まり

- 優先度: 緊急=`danger` / 重要=`warning` / 通常=`primary`。`components/common/PriorityBadge.tsx` を使う
- **配色の AA 対応**: 元の設計書の Danger `#D64545` / Warning `#E89C31` / Success `#2F9E6F` / Sub text `#717784` は、
  白文字を載せる塗りや小さい文字では WCAG 2.1 AA（4.5:1）に届かない（4.38 / 3.89 / 3.36 / 4.19）。
  文字・塗りには AA を満たす `--danger` `--warning` `--success` `--muted-foreground` を使い、
  文字が載らない罫・アイコンには設計書どおりの `--danger-accent` `--warning-accent` `--success-accent` を使う
- AI発言: 紫系（`ai` トークン）＋ 🤖 アバター＋「AI アシスタント」ラベル。人間の吹き出し色を使わない
- 自分の発言は右・`bg-bubble-me`、他人は左・`bg-card`。角丸 `rounded-msg`(14px)
- カード角丸 12px(`rounded-xl`相当のトークン `--radius`=0.75rem)、ボタン 10px
- ボタン既定の高さは44px（`Button` の `size="default"`）。密度が必要な管理画面のみ `size="sm"`
- 空状態は `components/common/EmptyState.tsx`
- 破壊的操作（削除・退出）は確認ダイアログを挟む
- トーストは `import { toast } from 'sonner'`（`@/components/ui/sonner` は `Toaster` のみを export する）
- AI かどうかは `senderId === AI_USER_ID` で判定する（`type === 'ai'` だけに頼らない）
- 一覧・検索・チャットは、自分が `memberIds` に入っているルームだけを対象にする

## 7. タスク分解

| ID | 範囲 | 触ってよいファイル | 依存 |
|---|---|---|---|
| T0 | 基盤：トークン・型・モックデータ・ストア・レイアウト・共通部品・ルート | 上記「共通」全部 | — |
| T1 | チャット（`/groups` `/direct` `/chat/:id` `/chat/:id/note` `/myroom`） | `src/features/chat/**` | T0 |
| T2 | メニュー・お知らせ・安否確認・アンケート | `src/features/home/**` `announcements/**` `safety/**` `surveys/**` | T0 |
| T3 | 院内ナレッジ・機器トラブル報告 | `src/features/knowledge/**` `src/features/trouble/**` | T0 |
| T4 | ログイン・管理画面 | `src/features/auth/**` `src/features/admin/**` | T0 |

T1〜T4 は対象ファイルが重ならないので並行実施可。

## 8. 検証

```
npm run build    # tsc -b（strict, noUnusedLocals）+ vite build
npm run lint     # oxlint
npm run dev      # 目視確認（375px / 768px / 1440px）
```

「完成」と言える条件: build 成功・lint エラー0・主要導線の目視確認済み・独立レビューの重大指摘0。

## 9. 医療・個人情報の制約（全担当者が厳守）

- 実在の患者・職員の情報を書かない。すべて架空
- 臨床的な数値・手順・機器設定・薬剤名を創作しない。モック文面は運用連絡の範囲にとどめる
- 画面のどこかに「デモ用ダミーデータ／臨床判断には使用しない」旨を表示する

## 10. 配布・運用の前提（Phase 1 時点）

- `dist/index.html` は `/assets/...` の絶対パスを参照する（`vite.config.ts` に `base` 指定なし）。
  サブディレクトリ配信や `file://` 直開きでは動かない
- ルーティングは `createBrowserRouter`（History API）。`/groups` などを直接開けるようにするには、
  静的サーバ側で **SPA フォールバック**（見つからないパスを `index.html` に返す）が必要
- サブディレクトリ配信が必要になったら `vite.config.ts` の `base` と `createBrowserRouter` の
  `basename` を合わせて設定する。ハッシュルーター（`createHashRouter`）に替えればフォールバック不要
- 外部通信はゼロ。フォント（Geist Variable）を含め依存はすべて `dist/assets/` に同梱される

## 11. 既知の割り切り（Phase 1）

| 内容 | 理由 |
|---|---|
| 初期バンドルが単一チャンク（約 1,009 kB / gzip 294 kB） | 受け入れ条件に無いため未分割。route 単位の `React.lazy` で分割できる |
| 時刻・バッジ・補助情報が 12px（要件の最小14pxより小さい） | 読ませる文字（本文・ナビのラベル・画面サブタイトル）は14px以上にしたが、チャットの時刻や既読数まで14pxにすると情報の主従が崩れるため据え置いた |
| 複数タブを同時に開くと `localStorage` が後勝ちになる | `storage` イベントの購読を入れていない |
| 端末のタイムゾーンが JST 以外だと日付リベースが1日ずれる | 院内端末は JST 前提 |
| `src/data/*.json` と `src/lib/navigation.ts` に色を直書きしている | アバター色・グループ色・タイル色は「データの一部」として扱う。ダークモードを有効化するときは要見直し |
| 既存グループのメンバー追加・削除、部署の追加・削除の画面が無い | `chatStore.updateGroup` は用意してあるが UI は未実装。Phase 9（管理）の範囲として残す。ログイン画面の権限説明からは「メンバー管理」を外した |
| 同じ日のうちは保存データが新しいモックより優先される | 開発中に `src/data/*.json` を直しても、その日すでに開いていると反映されない。ヘッダー →「デモデータを初期化」で反映される。保存データの形を変えたときは各ストアの `version` を上げる |
