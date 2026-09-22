import { cn } from '@/lib/utils'

/**
 * 院内ハブのシンボル。
 *
 * 中心の正方形と上下左右の4つで十字を組む。
 * 医療の十字であり、中心に集まるハブの図でもある——1つの形に2つの意味を持たせている。
 * 512 を 16 分割したグリッドで作図し、正方形 112・すき間 16 に揃えてある。
 * 効果や陰影は使わず、面と余白だけで成立させる。
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 368 368"
      className={cn('block', className)}
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <rect x="128" y="0" width="112" height="112" />
      <rect x="0" y="128" width="112" height="112" />
      <rect x="128" y="128" width="112" height="112" />
      <rect x="256" y="128" width="112" height="112" />
      <rect x="128" y="256" width="112" height="112" />
    </svg>
  )
}
