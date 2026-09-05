export function ProductPromoTag({
  enabled,
  label,
  backgroundColor,
  textColor,
  className,
}: {
  enabled?: boolean | null
  label?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  className?: string
}) {
  if (!enabled) return null

  return (
    <span
      className={
        className ??
        'inline-flex rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-widest'
      }
      style={{
        backgroundColor: backgroundColor || '#c81e1e',
        color: textColor || '#ffffff',
      }}
    >
      {label?.trim() || 'Promotion'}
    </span>
  )
}
