'use client'

import { useDictionary } from '@/components/locale-provider'
import {
  COMPOSITION_LAYERS,
  hasCompositionNotes,
  parsePerfumeComposition,
  type CompositionLayer,
  type CompositionNote,
} from '@/lib/perfume-composition'
import { useState } from 'react'

function NoteCircles({ notes }: { notes: CompositionNote[] }) {
  return (
    <ul className="flex flex-wrap items-start gap-x-5 gap-y-4">
      {notes.map((note) => (
        <li
          key={`${note.name}-${note.imageUrl}`}
          className="flex w-[4.75rem] flex-col items-center gap-2 sm:w-20"
        >
          <div className="size-[4.5rem] overflow-hidden rounded-full border border-border bg-secondary sm:size-20">
            {note.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={note.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs font-semibold tracking-wide text-primary">
                {note.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-center text-sm font-medium leading-snug text-foreground">
            {note.name}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function PerfumeCompositionSection({
  composition: compositionJson,
}: {
  composition: string | null | undefined
}) {
  const dictionary = useDictionary()
  const layers = dictionary.product.layers
  const composition = parsePerfumeComposition(compositionJson)

  const availableLayers = COMPOSITION_LAYERS.filter(
    (layer) => composition[layer.key].length > 0,
  )

  const [activeLayer, setActiveLayer] = useState<CompositionLayer | null>(
    () => availableLayers[0]?.key ?? null,
  )

  if (!hasCompositionNotes(composition) || !activeLayer) return null

  const activeMeta = layers[activeLayer]
  const activeNotes = composition[activeLayer]

  return (
    <section className="border-t border-border pt-5">
      <p className="mb-3 text-xs font-medium tracking-[0.2em] text-foreground/70">
        {dictionary.product.composition}
      </p>

      <div
        role="tablist"
        aria-label={dictionary.product.layersAria}
        className="flex flex-wrap gap-2"
      >
        {availableLayers.map((layer) => {
          const selected = activeLayer === layer.key
          return (
            <button
              key={layer.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveLayer(layer.key)}
              className={`min-h-10 rounded-md border px-3.5 py-2 text-sm transition-colors ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {layers[layer.key].short}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className="mt-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-serif text-xl tracking-wide text-foreground">
            {activeMeta.label}
          </p>
          <p className="text-xs font-medium tracking-wide text-primary">
            {activeMeta.moment}
          </p>
        </div>
        {activeMeta.description ? (
          <p className="mb-5 text-sm leading-relaxed text-foreground/75">
            {activeMeta.description}
          </p>
        ) : null}
        <NoteCircles notes={activeNotes} />
      </div>
    </section>
  )
}
