export type WearMomentOption = {
  value: string
  label: string
}

/** "Quand le porter" tags — season + moment of day, shown as one filter group. */
export const WEAR_MOMENT_OPTIONS: WearMomentOption[] = [
  { value: 'ete', label: 'Ete' },
  { value: 'hiver', label: 'Hiver' },
  { value: 'printemps', label: 'Printemps' },
  { value: 'automne', label: 'Automne' },
  { value: 'jour', label: 'Jour' },
  { value: 'nuit', label: 'Nuit' },
]

const WEAR_LABEL_BY_VALUE = new Map(WEAR_MOMENT_OPTIONS.map((option) => [option.value, option.label]))

export function getWearMomentLabel(value: string): string {
  return WEAR_LABEL_BY_VALUE.get(value) ?? value
}

/** Parse `products.wearMoments` JSON — an array of wear moment value slugs. */
export function parseWearMoments(json: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(json || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]
  } catch {
    return []
  }
}

export function serializeWearMoments(moments: string[]): string {
  const clean = moments.map((moment) => moment.trim()).filter(Boolean)
  return JSON.stringify([...new Set(clean)])
}
