export type CompositionNote = {
  name: string
  imageUrl: string
}

export type CompositionLayer = 'tete' | 'coeur' | 'fond'

export type PerfumeComposition = {
  tete: CompositionNote[]
  coeur: CompositionNote[]
  fond: CompositionNote[]
}

export const COMPOSITION_LAYERS: {
  key: CompositionLayer
  label: string
  description: string
}[] = [
  {
    key: 'tete',
    label: 'Notes de tête',
    description: 'Première impression, notes volatiles',
  },
  {
    key: 'coeur',
    label: 'Notes de cœur',
    description: 'Cœur du parfum, personnalité',
  },
  {
    key: 'fond',
    label: 'Notes de fond',
    description: 'Tenue longue, sillage',
  },
]

export const EMPTY_COMPOSITION: PerfumeComposition = {
  tete: [],
  coeur: [],
  fond: [],
}

const MAX_NOTES_PER_LAYER = 8

function isNote(value: unknown): value is CompositionNote {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return typeof record.name === 'string'
}

function normalizeNotes(value: unknown): CompositionNote[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(isNote)
    .map((note) => ({
      name: String(note.name).trim(),
      imageUrl: typeof note.imageUrl === 'string' ? note.imageUrl.trim() : '',
    }))
    .filter((note) => note.name.length > 0)
    .slice(0, MAX_NOTES_PER_LAYER)
}

export function parsePerfumeComposition(json: string | null | undefined): PerfumeComposition {
  try {
    const parsed = JSON.parse(json || '{}') as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...EMPTY_COMPOSITION }
    }
    const record = parsed as Record<string, unknown>
    return {
      tete: normalizeNotes(record.tete),
      coeur: normalizeNotes(record.coeur),
      fond: normalizeNotes(record.fond),
    }
  } catch {
    return { ...EMPTY_COMPOSITION }
  }
}

export function serializePerfumeComposition(composition: PerfumeComposition): string {
  return JSON.stringify({
    tete: normalizeNotes(composition.tete),
    coeur: normalizeNotes(composition.coeur),
    fond: normalizeNotes(composition.fond),
  })
}

export function hasCompositionNotes(composition: PerfumeComposition): boolean {
  return (
    composition.tete.length > 0 ||
    composition.coeur.length > 0 ||
    composition.fond.length > 0
  )
}

export { MAX_NOTES_PER_LAYER }
