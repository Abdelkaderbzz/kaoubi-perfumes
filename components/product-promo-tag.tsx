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
        'inline-flex rounded px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase'
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
