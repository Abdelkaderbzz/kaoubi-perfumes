'use client'

import { uploadProductImage } from '@/app/actions/upload'
import { useToast } from '@/components/toast-provider'
import {
  COMPOSITION_LAYERS,
  MAX_NOTES_PER_LAYER,
  type CompositionLayer,
  type PerfumeComposition,
} from '@/lib/perfume-composition'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { AdminButton, AdminFieldError, adminInputWithError, adminLabelCls } from './admin-ui'

type ProductCompositionFieldProps = {
  value: PerfumeComposition
  onChange: (value: PerfumeComposition) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any
}

export function ProductCompositionField({
  value,
  onChange,
  errors,
}: ProductCompositionFieldProps) {
  const toast = useToast()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  function updateLayer(layer: CompositionLayer, notes: PerfumeComposition[CompositionLayer]) {
    onChange({ ...value, [layer]: notes })
  }

  function addNote(layer: CompositionLayer) {
    const notes = value[layer]
    if (notes.length >= MAX_NOTES_PER_LAYER) {
      toast.error(`Maximum ${MAX_NOTES_PER_LAYER} notes par couche.`)
      return
    }
    updateLayer(layer, [...notes, { name: '', imageUrl: '' }])
  }

  function removeNote(layer: CompositionLayer, index: number) {
    updateLayer(
      layer,
      value[layer].filter((_, i) => i !== index),
    )
  }

  function patchNote(
    layer: CompositionLayer,
    index: number,
    patch: Partial<{ name: string; imageUrl: string }>,
  ) {
    updateLayer(
      layer,
      value[layer].map((note, i) => (i === index ? { ...note, ...patch } : note)),
    )
  }

  async function handleUpload(layer: CompositionLayer, index: number, file: File) {
    const key = `${layer}-${index}`
    setUploadingKey(key)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadProductImage(formData)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      patchNote(layer, index, { imageUrl: result.url })
      toast.success('Image televersee.')
    } catch {
      toast.error("Impossible de televerser l'image.")
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={adminLabelCls}>COMPOSITION (PYRAMIDE OLFACTIVE)</label>
        <p className="mt-1 text-xs text-slate-500">
          Notes de tete, coeur et fond avec image optionnelle pour chaque ingredient.
        </p>
      </div>

      {COMPOSITION_LAYERS.map((layer) => {
        const notes = value[layer.key]
        const layerErrors = errors?.[layer.key]

        return (
          <div
            key={layer.key}
            className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{layer.label}</p>
                <p className="text-xs text-slate-500">{layer.description}</p>
              </div>
              <AdminButton
                type="button"
                variant="outline"
                className="inline-flex items-center gap-1.5"
                onClick={() => addNote(layer.key)}
                disabled={notes.length >= MAX_NOTES_PER_LAYER}
              >
                <Plus className="size-3.5" />
                Ajouter
              </AdminButton>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune note pour cette couche.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note, index) => (
                  <NoteRow
                    key={`${layer.key}-${index}`}
                    name={note.name}
                    imageUrl={note.imageUrl}
                    nameError={layerErrors?.[index]?.name?.message}
                    uploading={uploadingKey === `${layer.key}-${index}`}
                    onNameChange={(name) => patchNote(layer.key, index, { name })}
                    onRemoveImage={() => patchNote(layer.key, index, { imageUrl: '' })}
                    onUpload={(file) => handleUpload(layer.key, index, file)}
                    onRemove={() => removeNote(layer.key, index)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function NoteRow({
  name,
  imageUrl,
  nameError,
  uploading,
  onNameChange,
  onRemoveImage,
  onUpload,
  onRemove,
}: {
  name: string
  imageUrl: string
  nameError?: string
  uploading: boolean
  onNameChange: (name: string) => void
  onRemoveImage: () => void
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-2 sm:flex-row sm:items-start">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-slate-400">
            <ImagePlus className="size-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Bergamote"
          className={adminInputWithError(!!nameError)}
        />
        <AdminFieldError message={nameError} />
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              if (inputRef.current) inputRef.current.value = ''
            }}
          />
          <AdminButton
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Televersement…' : imageUrl ? "Changer l'image" : 'Ajouter une image'}
          </AdminButton>
          {imageUrl ? (
            <AdminButton type="button" variant="outline" onClick={onRemoveImage}>
              Retirer l&apos;image
            </AdminButton>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex size-9 shrink-0 items-center justify-center self-start rounded-md text-red-600 hover:bg-red-50"
        aria-label="Supprimer la note"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
