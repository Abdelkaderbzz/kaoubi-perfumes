'use client'

import { useDictionary } from '@/components/locale-provider'
import { parseWearMoments } from '@/lib/product-wear'
import { parseFragranceNotes } from '@/lib/fragrance-notes'
import {
  getIntensityStep,
  INTENSITY_LEVELS,
} from '@/lib/product-intensity'

function AttributeRow({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-[0.18em] text-foreground/70">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}

function IntensityBar({
  intensity,
  label,
  ariaLabel,
  intensityLabel,
}: {
  intensity: string
  label: string
  ariaLabel: string
  intensityLabel: string | null
}) {
  const step = getIntensityStep(intensity)
  if (step <= 0) return null

  const total = INTENSITY_LEVELS.length

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.18em] text-foreground/70">{label}</p>
        {intensityLabel ? (
          <p className="text-sm font-semibold text-primary">{intensityLabel}</p>
        ) : null}
      </div>
      <div
        className="flex gap-1.5"
        role="meter"
        aria-label={ariaLabel}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-valuetext={intensityLabel ?? undefined}
      >
        {INTENSITY_LEVELS.map((level, index) => {
          const filled = index < step
          return (
            <div
              key={level.value}
              className={`h-2.5 flex-1 rounded-sm transition-colors ${
                filled ? 'bg-primary' : 'bg-border'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

export function FragranceProfile({
  wearMoments,
  intensity,
  fragranceNotes,
}: {
  wearMoments?: string | null | undefined
  intensity?: string | null | undefined
  fragranceNotes?: string | string[] | null | undefined
}) {
  const dictionary = useDictionary()
  const wearLabels = dictionary.wear as Record<string, string>
  const intensityLabels = dictionary.intensity as Record<string, string>
  const noteLabels = dictionary.fragranceNotes as Record<string, string>

  const moments = parseWearMoments(wearMoments).map(
    (value) => wearLabels[value] ?? value,
  )
  const notes = (
    Array.isArray(fragranceNotes) ? fragranceNotes : parseFragranceNotes(fragranceNotes)
  ).map((value) => noteLabels[value] ?? value)
  const intensityStep = getIntensityStep(intensity)
  const intensityLabel = intensity
    ? intensityLabels[intensity] ?? intensity
    : null

  if (moments.length === 0 && intensityStep <= 0 && notes.length === 0) return null

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-4">
      <AttributeRow label={dictionary.product.olfactiveLabel} values={notes} />
      <AttributeRow label={dictionary.product.wearLabel} values={moments} />
      {intensity ? (
        <IntensityBar
          intensity={intensity}
          label={dictionary.product.intensityLabel}
          ariaLabel={dictionary.product.intensityAria}
          intensityLabel={intensityLabel}
        />
      ) : null}
    </div>
  )
}
