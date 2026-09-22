/**
 * localStorage の薄いラッパ。
 * プライベートウィンドウや容量超過で例外になることがあるため、必ず握りつぶして
 * 「保存できなかっただけ」に落とす。読めなくてもアプリは動かす。
 */
export function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* 保存できなくても続行する */
  }
}

export function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* 同上 */
  }
}

/** Zustand persist に渡すストレージ。失敗しても落ちない。 */
export const safeStorage = {
  getItem: (name: string) => safeGetItem(name),
  setItem: (name: string, value: string) => safeSetItem(name, value),
  removeItem: (name: string) => safeRemoveItem(name),
}
