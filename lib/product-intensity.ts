export type IntensityLevel = {
  value: string
  label: string
}

/** Fragrance strength, single choice per product. Ordered weak to strong. */
export const INTENSITY_LEVELS: IntensityLevel[] = [
  { value: 'legere', label: 'Legere' },
  { value: 'moderee', label: 'Moderee' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'forte', label: 'Forte' },
  { value: 'tres-forte', label: 'Tres forte' },
]

const INTENSITY_LABEL_BY_VALUE = new Map(INTENSITY_LEVELS.map((level) => [level.value, level.label]))

export function getIntensityLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return INTENSITY_LABEL_BY_VALUE.get(value) ?? value
}

/** 1-based step in INTENSITY_LEVELS, or 0 if unknown / empty. */
export function getIntensityStep(value: string | null | undefined): number {
  if (!value) return 0
  const index = INTENSITY_LEVELS.findIndex((level) => level.value === value)
  return index >= 0 ? index + 1 : 0
}

export function isValidIntensity(value: string): boolean {
  return INTENSITY_LABEL_BY_VALUE.has(value)
}
