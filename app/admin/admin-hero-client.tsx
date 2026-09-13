'use client'

import { resetHeroImage, updateHeroImage } from '@/app/actions/hero'
import { uploadProductImage } from '@/app/actions/upload'
import { useToast } from '@/components/toast-provider'
import type { HeroImageSlot } from '@/lib/hero-images'
import { useRef, useState, useTransition } from 'react'
import { AdminButton, adminInputCls, adminLabelCls } from './admin-ui'

export function AdminHeroClient({ initialImages }: { initialImages: HeroImageSlot[] }) {
  const toast = useToast()
  const [images, setImages] = useState(initialImages)
  const [alts, setAlts] = useState(() => Object.fromEntries(initialImages.map((img) => [img.slot, img.alt])))
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  async function handleUpload(slot: number, file: File) {
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error(`"${file.name}" depasse 5 Mo. Choisissez une image plus legere.`)
      return
    }

    setUploadingSlot(slot)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const upload = await uploadProductImage(formData)
      if (!upload.success) {
        toast.error(upload.error)
        return
      }

      const result = await updateHeroImage(slot, {
        imageUrl: upload.url,
        alt: alts[slot] ?? '',
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }

      setImages(result.images)
      toast.success('Image hero mise a jour.')
    } catch {
      toast.error("Impossible de televerser l'image.")
    } finally {
      setUploadingSlot(null)
      const input = inputRefs.current[slot]
      if (input) input.value = ''
    }
  }

  function handleSaveAlt(slot: number) {
    const image = images.find((item) => item.slot === slot)
    if (!image) return

    startTransition(async () => {
      const result = await updateHeroImage(slot, {
        imageUrl: image.imageUrl,
        alt: alts[slot] ?? '',
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setImages(result.images)
      toast.success('Texte alternatif enregistre.')
    })
  }

  function handleReset(slot: number) {
    startTransition(async () => {
      const result = await resetHeroImage(slot)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setImages(result.images)
      const restored = result.images.find((item) => item.slot === slot)
      if (restored) {
        setAlts((prev) => ({ ...prev, [slot]: restored.alt }))
      }
      toast.success('Image par defaut restauree.')
    })
  }

  const busy = isPending || uploadingSlot !== null

  return (
    <div>
      <p className="mb-6 text-sm text-slate-600">
        Ces 4 photos forment le mosaic de la page d accueil: haut gauche, haut droite, bas
        gauche, bas droite. Televersez une photo carree ou recadrable (JPG, PNG, WEBP ou GIF,
        5 Mo max).
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {images.map((image) => {
          const uploading = uploadingSlot === image.slot
          return (
            <div
              key={image.slot}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {image.label}
                    <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {image.shape === 'wide' ? 'Paysage' : image.shape === 'tall' ? 'Portrait' : 'Carre'}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{image.position}</p>
                </div>
                <AdminButton
                  variant="outline"
                  onClick={() => handleReset(image.slot)}
                  disabled={busy}
                  className="!px-2.5 !py-1.5 text-xs"
                >
                  Defaut
                </AdminButton>
              </div>

              <div
                className={`relative mb-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${
                  image.shape === 'wide' ? 'aspect-4/3' : image.shape === 'tall' ? 'aspect-3/4' : 'aspect-square'
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt={alts[image.slot] || image.alt}
                  className="h-full w-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-amber-800">
                    Televersement...
                  </div>
                )}
              </div>

              <input
                ref={(el) => {
                  inputRefs.current[image.slot] = el
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleUpload(image.slot, file)
                }}
                className="mb-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-900 hover:file:bg-amber-200 disabled:opacity-60"
              />

              <label className={adminLabelCls}>TEXTE ALTERNATIF</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alts[image.slot] ?? ''}
                  onChange={(event) =>
                    setAlts((prev) => ({ ...prev, [image.slot]: event.target.value }))
                  }
                  disabled={busy}
                  className={adminInputCls}
                  placeholder="Description de l image"
                />
                <AdminButton
                  variant="outline"
                  onClick={() => handleSaveAlt(image.slot)}
                  disabled={busy}
                  className="shrink-0"
                >
                  OK
                </AdminButton>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
