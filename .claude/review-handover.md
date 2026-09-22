# レビュー側の引き継ぎ（chatis-18）

- 作成 2026-09-22 / 最終更新 2026-09-22 実装側の全対応後
- 作成者: レビュー担当セッション chatis-18
- 用途: **コンテキスト圧縮後にここを読めば、レビュー側の結論を再取得できる**
- レビュー側の記録。実装の進行記録は `.claude/task-state.md`（別セッションが管理）

## 0. 役割（`.claude/task-state.md` の記載を訂正）

`.claude/task-state.md` に「修正は chatis-18 へ引き渡し済み」とあるが**誤り**。

| セッション | 役割 | src の編集 |
|---|---|---|
| Hospital Communication Hub UI/UX | 実装（メイン） | する |
| chatis-18 | レビュー専任 | **一切しない** |
| chatis-95 | レビュー → 実装に転向 | する |
| chatis-f3 | レビュー（作業終了済み） | しない |

`docs/review-findings.md` は chatis-f3 が作成。chatis-18 は作成していない。

## 1. 現在の状態

**レビューで挙げた指摘はすべて対応済み。未対応の不具合は残っていない。**

- chatis-18 の5レーンレビュー: 重大1・中22・軽微31 → 全件送付、全件対応
- chatis-f3 の指摘のうち検証して実在と判断した9件 → 送付、全件対応
- 取り下げ4件・誤検知1件（下記3）
- 残るのはユーザー判断待ちの設計項目のみ（下記4）

## 2. 検証済みの確定事実（再検証不要）

- `npm run build` 成功 / `npm run lint` エラー0 / `tsc --noEmit` エラー0
- **外部通信ゼロ**: `fetch` / `XMLHttpRequest` / `axios` / `WebSocket` / `sendBeacon` / `EventSource` / `preconnect` / `integrity` すべて0件。`https://` のヒットは `src/data/messages.json` の `portal.hospital.local`（表示専用・アンカー化なし）のみ。`@import` は `src/index.css:1-4` の bare specifier のみ。Geist は npm 同梱で `dist` の `@font-face` もすべて `/assets/` 相対
- `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` すべて0件
- **医療・個人情報**: `src/data/*.json` 全12ファイルを通読。実在の病院名・実在人物に見える氏名0件。AIが創作した臨床数値・手順・機器設定・薬剤名0件。臨床寄りのナレッジ記事（k-001 IABP / k-002 ECMO / k-008 / k-009）は本文がプレースホルダで「院内マニュアルおよび添付文書を参照」と明記
- 設計§4: features から `src/data/*.json` の直接 import は0件
- 設計§2: features から共通領域への破壊的変更は0件
- 認可の抜けなし: `RequireAuth` は権限を見ないが `AdminPage.tsx` が早期リターンするため、URL直打ちで権限外セクションに到達する経路は無い。`hasRole` は全箇所 `ROLE_RANK[role] >= ROLE_RANK[required]` で向きは正しい
- 受け入れ条件2〜9をコードで確認。条件10（375px）は下記5

## 3. 取り下げ済み・誤検知（**再着手しないこと**）

| 指摘 | 理由 |
|---|---|
| 主要トークンが WCAG AA 未達 | 配色修正後に独立再計算し **13組中12組が AA 達成**。実測 danger #c53b3b 5.17 / warning #a35f0f 5.00 / success #1e7a54 5.29 / muted-foreground #676d7a 4.84〜5.19。`.claude/task-state.md` の「#b9701a 3.89:1 要修正」は**古い値**で解消済み |
| 利用者切替で未読が再計算されない | `recalcForViewer` が `AppShell.tsx:25` に結線済み |
| お知らせ本文に固定日付が5箇所 | 現データを機械走査した結果**0件**。すべて「来月より」等の相対表現 |
| 退出グループを「表示に戻す」で復帰できる | `leaveRoom` が `memberIds` からも自分を外し、`useHiddenRooms` が `memberIds.includes(meId)` で絞るため成立しない |
| 共有ノートにデモ表示が無い | **chatis-18 の誤り**。grep の時点が実装より前だった。`NotePage.tsx:6,114` に入っている |
| 768px の AppHeader getSnapshot クラッシュ | HMR 由来。本番ビルドを `vite preview` で18ルート巡回して再現せず、実装側が決着済み |

## 4. ユーザー判断待ち（**これだけが残件**）

- **補助情報のフォントサイズ**: タッチ44px・最小14pxの未達を、要件を緩めるか実装を上げるか。原因は `tailwindcss/theme.css` の `--text-xs: 0.75rem` を `index.css` が上書きしていないこと。読ませる文字（下部ナビのラベル・PageHeader の説明・チャットヘッダー2行目）は14pxに引き上げ済みで、時刻・バッジ・既読数は12pxのまま
- **グループのメンバー管理UI**: `chatStore.updateGroup` の呼び出し元が0件。UIを作るか、`LoginPage.tsx` の説明文から「メンバー管理」を外すか
- **配布形態**: `base` 未設定 + `createBrowserRouter`。サブパス配信・SPAフォールバック無しでディープリンクが404。院内の配信先が決まってから `vite.config.ts` の `base` と Caddy 側の rewrite をセットで決める
- **repository の Promise 化**: Phase 3 でバックエンドに差し替える前提が現状の同期 `loadSeed()` では成立しない。Phase 1 の受け入れには不要

## 5. 375px の実機確認について（確認済み。ただし独立検証ではない）

修正前は一覧ペインが738px幅（ビューポート375px）になり、右363pxが切り取られて**時刻「12:45」と未読バッジ「3」が右端726pxの画面外**にあった。原因は flex 子要素の `min-width:auto`。

chatis-18 がブラウザ上で `min-width:0` を当てた実験値: ペイン 738→375px、はみ出し要素 98→0件、時刻の右端 363px。
実装側の本番ビルドでの実測値: `innerWidth 375 / 一覧ペイン 375 / 未読バッジの右端 363 / 横スクロール 0`。**両者の数値が一致している。**

ただしこの最終確認は実装側が行ったもので、**chatis-18 による独立再測定はできていない**（Playwright のプロファイルを Chrome PID 17539、親 playwright-mcp PID 9622 が掴んだままで操作不能）。独立性を厳密に求めるなら、別のブラウザで 375px の `/groups` を開き、行の右端に時刻と未読バッジが見えることを確認すること。

`.playwright-mcp/` に chatis-18 が撮った 375px（修正前）と 1440px のスクリーンショットあり（`.gitignore` 済み）。
