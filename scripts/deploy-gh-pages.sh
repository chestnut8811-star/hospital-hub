#!/usr/bin/env bash
# dist/ を gh-pages ブランチへ公開する。
#
#   npm run deploy
#
# GitHub Actions を使わない理由: gh の認証トークンに workflow スコープが無いと
# .github/workflows/ を push できないため。スコープを足すなら
#   gh auth refresh -s workflow
# を一度実行したうえで Actions に移行してもよい。
set -euo pipefail

BRANCH="gh-pages"
WORKTREE=".gh-pages"

cd "$(dirname "$0")/.."

if [ ! -d dist ]; then
  echo "dist/ がありません。先に npm run build を実行してください。" >&2
  exit 1
fi

# 前回の作業ツリーが残っていたら片付ける
git worktree remove "$WORKTREE" --force 2>/dev/null || true
rm -rf "$WORKTREE"

git worktree add -B "$BRANCH" "$WORKTREE" >/dev/null
find "$WORKTREE" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R dist/. "$WORKTREE"/
# GitHub Pages の Jekyll 処理を止める（_ で始まるファイルが無視されるのを防ぐ）
touch "$WORKTREE/.nojekyll"

cd "$WORKTREE"
git add -A
if git diff --cached --quiet; then
  echo "公開済みの内容と同じでした。何もしません。"
else
  git commit -q -m "Deploy: $(date '+%Y-%m-%d %H:%M')"
  git push -q --force -u origin "$BRANCH"
  echo "gh-pages ブランチへ公開しました。"
fi

cd ..
git worktree remove "$WORKTREE" --force
