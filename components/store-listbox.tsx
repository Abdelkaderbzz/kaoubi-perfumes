'use client'

import { CaretDown, Check } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

type StoreListboxOption = {
  value: string
  label: string
}

type StoreListboxProps = {
  value: string
  options: StoreListboxOption[]
  onChange: (value: string) => void
  label: string
  ariaLabel: string
  disabled?: boolean
  className?: string
}

export function StoreListbox({
  value,
  options,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  className,
}: StoreListboxProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((option) => option.value === value)),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value) ?? options[0]
  const active = options[activeIndex] ?? selected

  useEffect(() => {
    if (!open) return

    setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, options, value])

  function choose(next: string) {
    onChange(next)
    setOpen(false)
  }

  function move(delta: number) {
    setActiveIndex((current) => {
      const next = (current + delta + options.length) % options.length
      return next
    })
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (event.key === 'Enter' || event.key === ' ') choose(active.value)
      if (event.key === 'ArrowDown') move(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      move(-1)
      return
    }

    if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(0)
      return
    }

    if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(options.length - 1)
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex items-center gap-3', className)}>
      <span className="text-[11px] font-medium tracking-[0.22em] text-foreground">{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active.value}` : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex min-h-10 items-center gap-2 border-b border-border py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:outline-none disabled:opacity-60"
      >
        <span>{selected?.label}</span>
        <CaretDown
          className={cn('size-3.5 text-primary transition-transform', open && 'rotate-180')}
          weight="bold"
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute inset-e-0 top-full z-50 mt-2 min-w-52 border border-border bg-popover py-1 shadow-[0_12px_32px_-18px_rgba(58,34,40,0.45)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === activeIndex
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  id={`${listId}-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-4 px-3.5 py-2.5 text-start text-sm transition-colors disabled:opacity-60',
                    isActive || isSelected
                      ? 'bg-primary/10 text-foreground'
                      : 'text-foreground/80 hover:bg-primary/5 hover:text-foreground',
                  )}
                >
                  <span className={cn(isSelected && 'font-medium')}>{option.label}</span>
                  {isSelected ? <Check className="size-3.5 text-primary" weight="bold" aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
