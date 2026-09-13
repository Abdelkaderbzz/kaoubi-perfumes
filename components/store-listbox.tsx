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

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, options, value])

  function choose(next: string) {
    onChange(next)
    setOpen(false)
  }

  function move(delta: number) {
    setActiveIndex((current) => (current + delta + options.length) % options.length)
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
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex items-center gap-2', className)}>
      <span className="text-[10px] font-light tracking-[0.22em] text-muted-foreground">{label}</span>
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
        className={cn(
          'inline-flex min-h-10 items-center gap-2 border border-border/80 bg-transparent py-2 ps-3 pe-3 text-[11px] font-light tracking-wide text-foreground outline-none transition-colors hover:border-primary/40 focus-visible:border-primary disabled:opacity-60',
          open && 'border-primary text-primary',
        )}
      >
        <span>{selected?.label}</span>
        <CaretDown
          className={cn(
            'size-3 text-muted-foreground opacity-70 transition-transform duration-200',
            open && 'rotate-180 text-primary opacity-100',
          )}
          weight="bold"
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute inset-e-0 top-[calc(100%+0.55rem)] z-60 min-w-52 w-[min(16rem,70vw)] rounded-xl border border-border/80 bg-card/98 p-2 shadow-[0_18px_40px_-24px_rgba(58,34,40,0.45)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === activeIndex
            return (
              <button
                key={option.value}
                type="button"
                id={`${listId}-${option.value}`}
                role="option"
                aria-selected={isSelected}
                disabled={disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-start text-sm tracking-wide transition-colors disabled:opacity-60',
                  isSelected
                    ? 'bg-secondary/70 font-medium text-foreground'
                    : isActive
                      ? 'bg-secondary/50 text-foreground'
                      : 'text-foreground/80 hover:bg-secondary/50 hover:text-foreground',
                )}
              >
                <span>{option.label}</span>
                {isSelected ? <Check className="size-3.5 text-primary" weight="bold" aria-hidden /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
