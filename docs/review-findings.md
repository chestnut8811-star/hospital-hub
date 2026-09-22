# 独立レビュー — 未対応の指摘一覧

- 判定時刻: **2026-09-22 14:28**（このファイルの内容はこの時刻のコードに対する判定）
- レビュー体制: 独立した3系統（①基盤・データ層 ②チャット・共通レイアウト ③業務機能・管理画面・医療制約）
- **注意**: レビュー中も別作業者が実装を更新しており、修正済みの項目は本リストから除外済み。
  着手前に該当行を再確認すること。

## 検証の裏付け

- `npm run build` 成功 / `npm run lint` エラー0（warning 5件）
- 外部通信ゼロを機械確認（fetch・XHR・外部 link・CDN url() なし。フォントは woff2 をバンドル）
- 実機（Chromium 1440px / 375px）で全ルート表示、コンソールエラー0
- 受け入れ条件2・3 を実機で確認（送信 → 一覧の最終メッセージと時刻が更新 / 未読バッジ消滅）
- 医療・個人情報の制約違反（臨床値・手順・機器設定・薬剤名の創作）は**0件**
- `dangerouslySetInnerHTML` / `innerHTML` の使用**0件**
- `src/data/*.json` 12ファイルの参照整合性・列挙値・必須項目の不整合**0件**
- zustand セレクタが新配列を返す箇所**0件**（再レンダリングループなし）

---

## ★ まず直す7件（これ以外は後回しでよい）

| # | 内容 | 場所 | なぜ今か |
|---|---|---|---|
| 1 | AI発言 `m-tavi-04` が創作文。「直近24時間（12件）」は実在せず（room-tavi は全6件）、原文に無い文が並ぶ | `src/data/messages.json` | 画面の「AI が文章を作っているわけではありません」と矛盾。医療現場向けの前提が崩れる |
| 2 | お知らせ・アンケートが配信対象で絞られていない。対象外の職員にも全件出て既読が付き、管理画面の分母を超えうる | `AnnouncementListPage.tsx` / `SurveyListPage.tsx` / `AnnouncementsSection.tsx:29,58` | 配信対象という概念が機能していない |
| 3 | 管理ダッシュボードの安否集計が GROUP_ADMIN に見える | `DashboardSection.tsx:97-102` | `SafetySection` は DEPARTMENT_ADMIN 限定。権限の出し分けが不整合 |
| 4 | メッセージ一覧が常に最下部へ強制スクロール | `MessageList.tsx:51-53` | 過去ログ閲覧とルーム内検索が実用にならない（受け入れ条件5） |
| 5 | 長文の折り返しが無く、長いURLで 375px に横スクロールが出る | `src/index.css` に `overflow-wrap: anywhere` 1行 | 受け入れ条件10。最小修正で済む |
| 6 | 一覧行の「⋯」が `opacity-0` のままで、タッチ端末では見えないボタンが時刻・未読バッジに重なる | `RoomListItem.tsx:106-116` | スマホで部屋が開かず誤操作になる |
| 7 | 自分の「在籍」を自分でオフにできる | `UsersSection.tsx:190` | 権限セレクトは `!isMe` で守られているのに在籍だけ抜けている |

判断待ち（実装前にユーザー確認が要る）: **B-3**（44px・14px の未達を要件側で緩めるか実装を上げるか）と **B-4**（メンバー管理・部署管理を作るか説明文を直すか）。この2つは着手前に必ず確認すること。

以下は全件の詳細。優先度は上表が最優先、次に A の残り、B は判断待ち、C-2・D・E は後回しでよい。

---

## A. 1ファイルで直せるもの（詳細）（着手しやすい順）

### A-1 outline ボタンの枠が WCAG 1.4.11 未達 — `src/index.css:113`
`--input` は `#868f9f`（3.26:1）に修正済み。残るのは `--border: #d9dfe9` = 背景に **1.25:1**。
仕切り線としては 1.4.11 の対象外だが、`src/components/ui/button.tsx:13` の `variant="outline"` が
`border-border` を使っており、**outline ボタンの境界だけは UI 部品として 3:1 が必要**。
→ outline ボタンに限り `border-input`（3.26:1）を使うのが最小修正。`--border` 自体は今のままでよい。

### A-2 お知らせ既読の分母が実態と合わない — `src/features/admin/sections/AnnouncementsSection.tsx:29,58`
`countTargets(a.targets)` を分母にしているのに、一覧側（A-3）が `targets` で絞っていないため、
**対象外の職員が既読を付けると分子が分母を超えうる**（例: `an-006` は対象10名。全17名が開けば 17 / 10）。
シード時点では超過0件（実行確認済み）なので、**発生条件つきの指摘**。A-3 とセットで直す。

### A-3 お知らせ・アンケートが配信対象で絞られていない
`src/features/announcements/AnnouncementListPage.tsx` / `src/features/surveys/SurveyListPage.tsx`
`targets` は表示と検索にしか使われていない（`targets.includes` 0件）。対象外の職員にも全件表示され既読が付く。
→ `targets.includes('全職員') || targets.includes(自分の部署)` を一覧・既読・未読バッジ・回答可否で共通化。

### A-4 管理ダッシュボードの安否集計が GROUP_ADMIN に見える — `src/features/admin/sections/DashboardSection.tsx:97-102`
`SafetySection`（DEPARTMENT_ADMIN 限定）と食い違い。権限判定が無い（`DEPARTMENT_ADMIN` 0件）。
→ `hasRole(me.role, 'DEPARTMENT_ADMIN')` で囲む。

### A-5 自分の「在籍」を自分でオフにできる — `src/features/admin/sections/UsersSection.tsx:190`
権限セレクトは `canEdit && !isMe` で守られているが、在籍スイッチは `canEdit ?` のみ。
→ 在籍側にも `&& !isMe` を足す。

### A-6 長文の折り返しが無い — `src/index.css` / 各詳細画面
`AnnouncementDetailPage` / `SafetyPage` / `SurveyDetailPage` に `break-words` 0件、`index.css` に `overflow-wrap` の既定も無し。
長いURLを貼ると 375px で横スクロールが出る（受け入れ条件10）。
→ `index.css` に `overflow-wrap: anywhere` を1つ入れるのが最小修正。

### A-7 メッセージ一覧が常に最下部へ強制スクロール — `src/features/chat/components/MessageList.tsx:51-53`
「最下部付近にいるか」の判定が無い（`scrollHeight` 参照 0件）。
過去ログを読んでいる最中に新着が入ると飛ぶ。ルーム内検索で語を打つたびに最新の一致へ飛び、古い一致から順に見られない。
→ `scrollTop + clientHeight >= scrollHeight - 80` のときだけ追従。検索中は自動スクロールを止める。

### A-9 一覧行の「⋯」が、スマホで不可視のまま当たり判定だけ残る — `src/features/chat/components/RoomListItem.tsx:106-116`
`opacity-0` はクリック判定を消さない。hover の無いタッチ端末で、時刻・未読バッジの位置に見えないボタンが重なる。
→ `hidden lg:flex` にしてモバイルは長押しのみにする。

### A-10 クイックリアクションがキーボード到達不能 — `src/features/chat/components/MessageActionsMenu.tsx:77-92`
`DropdownMenuContent` 直下の素の `<button>`。Radix のロービングタブインデックス管理外。
→ `DropdownMenuItem asChild` でラップする。

### A-11 監査ログの記録対象が不揃い — `src/stores/hubStore.ts`
記録するのは お知らせ配信 / トラブル報告 / トラブル対応更新 / アンケート作成 の4つだけ。
権限変更・在籍変更・グループ作成・安否訓練の開始終了・アンケート締め切りは記録されない。
一方 `src/data/auditLogs.json` には「ユーザー登録」「安否確認の開始」のシードがあり、同種の操作をしても記録が増えない。

### A-12 トーストだけ OS のダークテーマに従う — `src/components/ui/sonner.tsx:8`
`ThemeProvider` が無いまま `useTheme()` を使い `theme="system"` で動く。OS がダークだとトーストだけ黒くなる。
設計 P5（ダークは既定で使わない）に合わせ `theme="light"` 固定が筋。

### A-13 `announcements.json:48` の `"ICU"` が部署マスタに無い
`countTargets` が 0 人として数えるため既読の母数が過小になる。

---

## B. 設計判断が要るもの

### B-1 repository 層が Phase 3 の前提を満たしていない — `src/repositories/hubRepository.ts`
設計書 §4「Phase 3 で repositories の実装を差し替えればバックエンドに繋がる」が現状では成立しない。
1. 唯一のメソッドが同期の `loadSeed(): SeedData`。ネットワーク越しでは同期で返せない
2. **書き込み系メソッドが1つも無い**。`sendMessage` / `createTrouble` 等はすべてストア内部で完結し repository を通らない
3. `const seed = repository.loadSeed()` が3ファイルのトップレベルで走り、await を差し込む場所が無い
→ Phase 1 の受け入れには不要。ただし「今の形では差し替えられない」ことを設計書に明記するのは今すぐやる。
   最小対応は interface の Promise 化と `hydrate()` の受け皿づくり。

### B-2 persist に version / migrate が無い — 4ストア共通
`seededOn` による日次破棄はあるが、**同じ日なら古い保存データが新しい seed に勝つ**（実験で確認済み）。
- 開発中に `messages.json` を直しても、同じ日に一度開いていると反映されない
- `Room` / `Message` に必須フィールドを足した新ビルドを同日に配ると、欠けた古いオブジェクトが state に入り `.includes` で落ちうる
→ `version: 1` を明示し、`src/mock/seed.ts` に `SEED_REVISION` を置いて `merge` で日付と一緒に比較する。

### B-3 タッチターゲット44px・最小フォント14px の未達（要件 §4）
375px 実測で確認：
- 44px未満: 一覧行の「⋯」36×36px（全行）、リアクション 44×28px、検索を閉じる/返信をやめる 36px、
  検索クリア 32px、「複数選択を許可する」が素の checkbox 16px、ヘッダーのロゴ 108×40px
- 14px未満: 11px = 長押しヒント・既読/時刻・未読数・AI注記、12px = ボトムナビのラベル・メッセージ時刻・
  ルーム副題・**デモ注意書き**
→ 要件を「補助情報は12pxまで許容」と改訂するか、`@theme` で `--text-xs` を13〜14pxに引き上げる。**判断が要る。**

### B-4 グループのメンバー管理が存在しない
`chatStore.updateGroup` の呼び出し元が**0件**。既存グループのメンバー追加・削除・管理者変更のUIが無い。
要件 §2 の GROUP_ADMIN「メンバー管理」が未達で、`LoginPage.tsx:33` は「できる」と説明している。
→ 実装するか、説明文から「メンバー管理」を外す。同様に部署管理（`DepartmentsSection` は閲覧専用）も要判断。

### B-5 `base` 未設定 ＋ `createBrowserRouter`
アセットが `/assets/...` の絶対パス。サブパス配信や SPA フォールバック未設定の静的配信でディープリンクが 404 になる。
→ 院内の配信先が決まった時点で `vite.config.ts` の `base` と Caddy 側の rewrite をセットで決める。

---

## C. モックデータ側

### C-1 `src/data/messages.json` の `m-tavi-04` が創作文
「直近24時間（12件）を要約しました」とあるが `room-tavi` は全6件、この発言より前は3件。
「未回答 3 名」等、原文に存在しない文が並ぶ。
決定「AI要約は創作せず原文のまま並べ直す」および `AiSummaryDialog` の画面説明と矛盾する。
→ `buildAiSummary` の出力形式（`・氏名：原文`）に置き換え、件数を実件数に合わせる。

### C-2 お知らせ本文の日付が日付リベースの対象外
`ISO_PATTERN` は文字列全体が ISO のときだけシフトする。本文の「9月25日（金）」「10月1日より」等5箇所はそのまま。
基準日以外にデモすると `publishedAt` は今日なのに本文は9月を指す。
→ 相対表現（「来週金曜」「今月末まで」）に置き換えるのが一番安い。

---

## D. 未解決（再現条件が特定できていない）

前セッションのログ `.playwright-mcp/console-2026-09-22T05-05-52-808Z.log` に
`React has detected a change in the order of Hooks` → `TypeError: Cannot read properties of null (reading 'getSnapshot')` があり
React Router の ErrorBoundary に落ちている。スタックに `AppHeader.tsx?t=...` とあるため**編集中の HMR による一過性**の可能性が高いが、断定できていない。
今セッションの全ルート表示・チャット送信・利用者切り替えでは再現せず、`react/rules-of-hooks`（error 設定）も0件。
→ dev サーバを再起動し、フルリロード後にコンソール0件を確認して閉じる。

---

## E. 低（実害は小さい）

- `src/lib/search.ts` の `splitHighlight` が NFKC + trim 後の添字で元文字列を slice するため、半角カナ・`㎎` 等・先頭空白で
  **ハイライト位置がずれる**（実行確認済み）。一致判定 `matchesQuery` 自体は良好
- `aiSummary.ts` が `type === 'ai'` の過去要約も対象に含めるため、要約するたび要約が要約される
- `aiSummary.ts` の `slice(0, 90)` が末尾記号なしに切るため、切れた文が「AIが要約した文」に見える
- `seed.ts` で `departments` と `troubleOptions` だけ deep copy せず JSON の参照を返している（3ストアが同一インスタンスを共有）
- `createSeed()` が起動時に3回走り、全12ファイルを3回ディープコピーする。深夜0時をまたぐ瞬間にストア間で日付シフトが1日ずれうる
- `directoryStore.getUser()` が未発見時に毎回新オブジェクトを返す（現状ループはしないが依存配列に入れた瞬間に壊れる）
- `leaveRoom` が `hidden:true` 扱いなので、退出したグループを「表示に戻す」で復帰できてしまう
- `AppHeader` の通知ポップオーバーが `room.name` を直接表示するため、DM で緊急が立つとタイトルが空欄になる
- `NotePage.tsx:31` の `?tab=` に未知の値を入れると本文が空になる
- 作成ダイアログの下書きが、閉じ方（ESC/外側クリック vs キャンセルボタン）で消えたり残ったりする
- `clsx` / `tailwind-merge` が package.json に残っているが未使用
- 設計書 `docs/design.md` の記述と実装のずれ（`mockRepository.ts`→`hubRepository.ts`、`currentUser`→`currentUserId`、
  `addReaction`→`toggleReaction`、永続化キーは2つでなく4つ）

---

## F. 対応済みを確認した主な指摘（再着手不要）

トラブル報告のID衝突 / 375px の一覧行はみ出し（`min-w-0`）/ AI要約投稿で未読が付く /
AI要約が常に直近10件になる / 削除済みメッセージが重要カードで残る / 横断検索が他人のDMを返す /
ルーム一覧・マイルームの閲覧者絞り込み / 検索中の送信・0件文言 / 監査ログの英語ステータス /
文字色トークンのコントラスト（warning・success・destructive・muted-foreground）/ 入力欄の枠（`--input` 3.26:1）/
favicon の link / 編集中に返信へ切り替えると本文が残る（MessageComposer）
