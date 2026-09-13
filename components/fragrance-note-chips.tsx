'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { parseFragranceNotes } from '@/lib/fragrance-notes'

export function FragranceNoteChips({
  notes,
  labels,
  highlighted,
  overflowLabel,
  size = 'sm',
}: {
  notes: string[] | string | null | undefined
  labels: Record<string, string>
  highlighted?: string[]
  overflowLabel: (hiddenCount: number) => string
  size?: 'sm' | 'md'
}) {
  const values = Array.isArray(notes) ? notes : parseFragranceNotes(notes)
  const items = values.map((value) => ({
    value,
    label: labels[value] ?? value,
  }))
  const highlight = new Set(highlighted ?? [])
  const notesKey = items.map((item) => item.value).join('|')
  const visibleRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLDivElement>(null)
  const [hiddenCount, setHiddenCount] = useState(0)

  useLayoutEffect(() => {
    const visible = visibleRef.current
    const sizer = sizerRef.current
    if (!visible || !sizer) return

    function measure() {
      const chips = [...sizer.querySelectorAll<HTMLElement>('[data-chip]')]
      const more = sizer.querySelector<HTMLElement>('[data-more]')
      if (chips.length === 0) return

      const available = visible.clientWidth
      const gap = Number.parseFloat(getComputedStyle(sizer).columnGap || getComputedStyle(sizer).gap) || 4
      const moreWidth = more?.offsetWidth ?? 0
      let used = 0
      let fit = 0

      for (let index = 0; index < chips.length; index += 1) {
        const remainingAfter = chips.length - (fit + 1)
        const reserve = remainingAfter > 0 ? gap + moreWidth : 0
        const next = fit === 0 ? chips[index].offsetWidth : used + gap + chips[index].offsetWidth
        if (next + reserve <= available + 1) {
          used = next
          fit += 1
        } else {
          break
        }
      }

      const hidden = Math.max(0, chips.length - Math.max(fit, 1))
      setHiddenCount((current) => (current === hidden ? current : hidden))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(visible)
    return () => observer.disconnect()
  }, [notesKey])

  if (items.length === 0) return null

  const chipCls =
    size === 'md'
      ? 'rounded-md border px-2.5 py-1 text-xs font-medium'
      : 'rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none sm:text-[11px]'

  function chipClass(active: boolean) {
    return `${chipCls} shrink-0 ${
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-primary/35 bg-card/90 text-foreground/90 backdrop-blur-sm'
    }`
  }

  const visibleItems = items.slice(0, items.length - hiddenCount)

  return (
    <div className="relative min-w-0">
      <div
        ref={sizerRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-y-0 start-0 flex items-center gap-1 whitespace-nowrap"
      >
        {items.map((item) => (
          <span key={item.value} data-chip="" className={chipClass(false)}>
            {item.label}
          </span>
        ))}
        <span data-more="" className={`${chipCls} shrink-0 border-primary/35 bg-card/90`}>
          {overflowLabel(Math.max(hiddenCount, 1))}
        </span>
      </div>
      <div ref={visibleRef} className="flex min-w-0 items-center gap-1 overflow-hidden">
        {visibleItems.map((item) => (
          <span key={item.value} className={chipClass(highlight.has(item.value))}>
            {item.label}
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span className={`${chipCls} shrink-0 border-primary/35 bg-card/90 text-foreground/80 backdrop-blur-sm`}>
            {overflowLabel(hiddenCount)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
