export type FragranceNoteOption = {
  value: string
  label: string
}

/** Fixed catalogue of fragrance note families, shown as a "Profil Olfactif" on the product page. */
export const FRAGRANCE_NOTE_OPTIONS: FragranceNoteOption[] = [
  { value: 'sweet', label: 'Sucre' },
  { value: 'green', label: 'Vert' },
  { value: 'fruity', label: 'Fruite' },
  { value: 'fresh-spicy', label: 'Frais epice' },
  { value: 'aromatic', label: 'Aromatique' },
  { value: 'citrus', label: 'Agrumes' },
  { value: 'floral', label: 'Floral' },
  { value: 'woody', label: 'Boise' },
  { value: 'musky', label: 'Musque' },
  { value: 'powdery', label: 'Poudre' },
  { value: 'oriental', label: 'Oriental' },
  { value: 'vanilla', label: 'Vanille' },
  { value: 'aquatic', label: 'Aquatique' },
  { value: 'gourmand', label: 'Gourmand' },
]

const NOTE_LABEL_BY_VALUE = new Map(FRAGRANCE_NOTE_OPTIONS.map((note) => [note.value, note.label]))

export function getFragranceNoteLabel(value: string): string {
  return NOTE_LABEL_BY_VALUE.get(value) ?? value
}

/** Parse `products.fragranceNotes` JSON — an array of note value slugs. */
export function parseFragranceNotes(json: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(json || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0))]
  } catch {
    return []
  }
}

export function serializeFragranceNotes(notes: string[]): string {
  const clean = notes.map((note) => note.trim()).filter(Boolean)
  return JSON.stringify([...new Set(clean)])
}
