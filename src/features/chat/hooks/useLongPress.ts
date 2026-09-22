import { useCallback, useEffect, useRef } from 'react'

/**
 * 長押し（スマホ）と右クリック（PC）で同じメニューを開くためのハンドラ。
 *
 * - 指を動かしたときは発火させない（スクロールと区別するため）
 * - 長押しが成立したら、その直後の click は握りつぶす
 *   （一覧の行のように click で画面遷移する要素だと、メニューを開きつつ
 *     遷移してしまうため）
 */
export function useLongPress(onTrigger: () => void, delay = 480) {
  const timer = useRef<number | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    origin.current = null
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false
      if (e.pointerType === 'mouse') return
      origin.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        fired.current = true
        onTrigger()
        clearTimer()
      }, delay)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!origin.current) return
      const moved =
        Math.abs(e.clientX - origin.current.x) > 10 || Math.abs(e.clientY - origin.current.y) > 10
      if (moved) clearTimer()
    },
    onPointerUp: clearTimer,
    onPointerCancel: clearTimer,
    onClickCapture: (e: React.MouseEvent) => {
      if (!fired.current) return
      // 長押しで開いたので、この click は無効にする
      e.preventDefault()
      e.stopPropagation()
      fired.current = false
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      onTrigger()
    },
  }
}
