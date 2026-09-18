'use client'

import { addBoutique, deleteBoutique, moveBoutique, updateBoutique } from '@/app/actions/boutiques'
import { useConfirm } from '@/components/confirm-provider'
import { useToast } from '@/components/toast-provider'
import { getErrorMessage } from '@/lib/get-error-message'
import { boutiqueSchema, type BoutiqueFormValues } from '@/lib/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { CategoryBannerField } from './category-banner-field'
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminFieldError,
  AdminIconButton,
  AdminModal,
  AdminTable,
  adminInputWithError,
  adminLabelCls,
  adminTableCellCls,
  adminTableHeadCls,
  adminTableMutedCls,
} from './admin-ui'

export type AdminBoutique = {
  id: number
  slug: string
  name: string
  city: string
  region: string
  description: string
  imageUrl: string | null
  imageAlt: string
  address: string | null
  phone: string | null
  rating: string | null
  reviewCount: number | null
  ratingSource: string
  directionsUrl: string
  pickupEnabled: boolean
  published: boolean
}

const EMPTY_FORM: BoutiqueFormValues = {
  name: '',
  slug: '',
  city: '',
  region: '',
  description: '',
  imageUrl: '',
  imageAlt: '',
  address: '',
  phone: '',
  rating: '',
  reviewCount: '',
  ratingSource: 'Google Maps',
  directionsUrl: '',
  pickupEnabled: true,
  published: true,
}

const checkboxRowCls =
  'flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3'

export function AdminBoutiquesClient({ initialBoutiques }: { initialBoutiques: AdminBoutique[] }) {
  const toast = useToast()
  const router = useRouter()
  const { confirm } = useConfirm()
  const [boutiques, setBoutiques] = useState(initialBoutiques)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminBoutique | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BoutiqueFormValues>({
    resolver: zodResolver(boutiqueSchema),
    defaultValues: EMPTY_FORM,
  })

  function openAdd() {
    setEditing(null)
    reset(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(boutique: AdminBoutique) {
    setEditing(boutique)
    reset({
      name: boutique.name,
      slug: boutique.slug,
      city: boutique.city,
      region: boutique.region,
      description: boutique.description,
      imageUrl: boutique.imageUrl ?? '',
      imageAlt: boutique.imageAlt,
      address: boutique.address ?? '',
      phone: boutique.phone ?? '',
      rating: boutique.rating ?? '',
      reviewCount: boutique.reviewCount == null ? '' : String(boutique.reviewCount),
      ratingSource: boutique.ratingSource,
      directionsUrl: boutique.directionsUrl,
      pickupEnabled: boutique.pickupEnabled,
      published: boutique.published,
    })
    setShowForm(true)
  }

  function onSubmit(values: BoutiqueFormValues) {
    startTransition(async () => {
      try {
        const result = editing
          ? await updateBoutique(editing.id, values)
          : await addBoutique(values)

        if (!result.success) {
          toast.error(result.error)
          return
        }

        setBoutiques((prev) =>
          editing
            ? prev.map((boutique) => (boutique.id === editing.id ? result.data : boutique))
            : [...prev, result.data],
        )
        toast.success(editing ? 'Boutique modifiee avec succes.' : 'Boutique ajoutee avec succes.')
        setShowForm(false)
      } catch (error) {
        toast.error(getErrorMessage(error, "Impossible d'enregistrer la boutique."))
      }
    })
  }

  async function handleDelete(boutique: AdminBoutique) {
    const ok = await confirm({
      title: `Supprimer ${boutique.name} ?`,
      description:
        'La boutique disparait de la page d accueil et des points de retrait. Les commandes deja passees gardent son nom.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return

    startTransition(async () => {
      const result = await deleteBoutique(boutique.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setBoutiques((prev) => prev.filter((item) => item.id !== boutique.id))
      toast.success('Boutique supprimee.')
    })
  }

  function handleMove(boutique: AdminBoutique, direction: 'up' | 'down') {
    const index = boutiques.findIndex((item) => item.id === boutique.id)
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= boutiques.length) return

    const reordered = [...boutiques]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setBoutiques(reordered)

    startTransition(async () => {
      const result = await moveBoutique(boutique.id, direction)
      if (!result.success) {
        setBoutiques(boutiques)
        toast.error(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <AdminButton variant="outline" onClick={openAdd} disabled={isPending}>
          + Ajouter une boutique
        </AdminButton>
      </div>

      {boutiques.length === 0 ? (
        <AdminEmptyState message="Aucune boutique. Ajoutez-en une pour l afficher sur la page d accueil." />
      ) : (
        <AdminTable loading={isPending} loadingLabel="Mise a jour des boutiques...">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {['Photo', 'Boutique', 'Contact', 'Note', 'Statut', 'Ordre', 'Actions'].map(
                (heading) => (
                  <th key={heading} className={adminTableHeadCls}>
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {boutiques.map((boutique, index) => (
              <tr key={boutique.id} className="transition-colors hover:bg-slate-50">
                <td className={adminTableCellCls}>
                  {boutique.imageUrl ? (
                    <img
                      src={boutique.imageUrl}
                      alt={boutique.imageAlt || boutique.name}
                      className="h-14 w-24 rounded object-cover"
                    />
                  ) : (
                    <span className="text-sm text-slate-400">Aucune</span>
                  )}
                </td>
                <td className={adminTableCellCls}>
                  <p className="font-medium text-slate-900">{boutique.name}</p>
                  <p className="text-sm text-slate-500">
                    {boutique.city}
                    {boutique.region && boutique.region !== boutique.city
                      ? ` — ${boutique.region}`
                      : ''}
                  </p>
                </td>
                <td className={adminTableMutedCls}>
                  <p>{boutique.address || '—'}</p>
                  <p>{boutique.phone ? `+216 ${boutique.phone}` : '—'}</p>
                </td>
                <td className={adminTableMutedCls}>
                  {boutique.rating ? (
                    <>
                      <p className="font-medium text-slate-800">{boutique.rating} / 5</p>
                      <p className="text-xs">
                        {boutique.reviewCount ? `${boutique.reviewCount} avis · ` : ''}
                        {boutique.ratingSource}
                      </p>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={adminTableCellCls}>
                  <div className="flex flex-col items-start gap-1.5">
                    <AdminBadge tone={boutique.published ? 'success' : 'warning'}>
                      {boutique.published ? 'Ouverte' : 'En cours'}
                    </AdminBadge>
                    <AdminBadge tone={boutique.pickupEnabled ? 'info' : 'default'}>
                      {boutique.pickupEnabled ? 'Retrait actif' : 'Sans retrait'}
                    </AdminBadge>
                  </div>
                </td>
                <td className={adminTableCellCls}>
                  <div className="flex items-center gap-1">
                    <AdminIconButton
                      label="Monter"
                      onClick={() => handleMove(boutique, 'up')}
                      disabled={isPending || index === 0}
                    >
                      <ArrowUp className="size-4" />
                    </AdminIconButton>
                    <AdminIconButton
                      label="Descendre"
                      onClick={() => handleMove(boutique, 'down')}
                      disabled={isPending || index === boutiques.length - 1}
                    >
                      <ArrowDown className="size-4" />
                    </AdminIconButton>
                  </div>
                </td>
                <td className={adminTableCellCls}>
                  <div className="flex items-center gap-1">
                    <AdminIconButton
                      label="Modifier la boutique"
                      onClick={() => openEdit(boutique)}
                      disabled={isPending}
                    >
                      <Pencil className="size-4" />
                    </AdminIconButton>
                    <AdminIconButton
                      label="Supprimer la boutique"
                      variant="danger"
                      onClick={() => handleDelete(boutique)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                    </AdminIconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {showForm && (
        <AdminModal
          title={editing ? 'Modifier la boutique' : 'Nouvelle boutique'}
          onClose={() => !isPending && setShowForm(false)}
          className="max-w-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={adminLabelCls}>NOM *</label>
                <input
                  className={adminInputWithError(!!errors.name)}
                  placeholder="Ex: KAOUBI PERFUMES Douz"
                  disabled={isPending}
                  {...register('name')}
                />
                <AdminFieldError message={errors.name?.message} />
              </div>
              <div>
                <label className={adminLabelCls}>VILLE *</label>
                <input
                  className={adminInputWithError(!!errors.city)}
                  placeholder="Ex: Douz"
                  disabled={isPending}
                  {...register('city')}
                />
                <AdminFieldError message={errors.city?.message} />
              </div>
              <div>
                <label className={adminLabelCls}>QUARTIER / REGION</label>
                <input
                  className={adminInputWithError(!!errors.region)}
                  placeholder="Ex: Douz Nord"
                  disabled={isPending}
                  {...register('region')}
                />
                <AdminFieldError message={errors.region?.message} />
              </div>
              <div>
                <label className={adminLabelCls}>SLUG (optionnel)</label>
                <input
                  className={adminInputWithError(!!errors.slug)}
                  placeholder="Ex: sahloul-sousse"
                  disabled={isPending}
                  {...register('slug')}
                />
                <AdminFieldError message={errors.slug?.message} />
              </div>
            </div>

            <div>
              <label className={adminLabelCls}>DESCRIPTION</label>
              <textarea
                rows={3}
                className={`${adminInputWithError(!!errors.description)} resize-none`}
                placeholder="Ce que le client trouve dans cette boutique..."
                disabled={isPending}
                {...register('description')}
              />
              <AdminFieldError message={errors.description?.message} />
              <p className="mt-1 text-xs text-slate-500">
                Texte affiche sous le nom de la boutique sur la page d accueil.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={adminLabelCls}>ADRESSE</label>
                <input
                  className={adminInputWithError(!!errors.address)}
                  placeholder="Ex: Rue de Habib Bourguiba, Douz"
                  disabled={isPending}
                  {...register('address')}
                />
                <AdminFieldError message={errors.address?.message} />
                <p className="mt-1 text-xs text-slate-500">
                  Localisation affichee aux clients (rue, ville, code postal).
                </p>
              </div>
              <div>
                <label className={adminLabelCls}>TELEPHONE</label>
                <input
                  className={adminInputWithError(!!errors.phone)}
                  placeholder="Ex: 27 330 407"
                  disabled={isPending}
                  {...register('phone')}
                />
                <AdminFieldError message={errors.phone?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={adminLabelCls}>NOTE / 5</label>
                <input
                  className={adminInputWithError(!!errors.rating)}
                  placeholder="4.9"
                  disabled={isPending}
                  {...register('rating')}
                />
                <AdminFieldError message={errors.rating?.message} />
              </div>
              <div>
                <label className={adminLabelCls}>NOMBRE D AVIS</label>
                <input
                  className={adminInputWithError(!!errors.reviewCount)}
                  placeholder="72"
                  disabled={isPending}
                  {...register('reviewCount')}
                />
                <AdminFieldError message={errors.reviewCount?.message} />
              </div>
              <div>
                <label className={adminLabelCls}>SOURCE DE LA NOTE</label>
                <input
                  className={adminInputWithError(!!errors.ratingSource)}
                  placeholder="Google Maps"
                  disabled={isPending}
                  {...register('ratingSource')}
                />
                <AdminFieldError message={errors.ratingSource?.message} />
              </div>
            </div>

            <div>
              <label className={adminLabelCls}>LIEN ITINERAIRE (GOOGLE MAPS)</label>
              <input
                className={adminInputWithError(!!errors.directionsUrl)}
                placeholder="https://maps.app.goo.gl/..."
                disabled={isPending}
                {...register('directionsUrl')}
              />
              <AdminFieldError message={errors.directionsUrl?.message} />
              <p className="mt-1 text-xs text-slate-500">
                Ouvrez la boutique sur Google Maps, cliquez « Partager » puis « Copier le lien »
                et collez-le ici : c est ce lien qui alimente le bouton ITINERAIRE.
              </p>
            </div>

            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <CategoryBannerField
                  value={field.value}
                  onChange={field.onChange}
                  label="PHOTO DE LA BOUTIQUE"
                  hint="Photo affichee sur la page d accueil (format paysage conseille). 5 Mo maximum."
                />
              )}
            />
            <AdminFieldError message={errors.imageUrl?.message} />

            <div>
              <label className={adminLabelCls}>TEXTE ALTERNATIF DE LA PHOTO</label>
              <input
                className={adminInputWithError(!!errors.imageAlt)}
                placeholder="Facade de la boutique..."
                disabled={isPending}
                {...register('imageAlt')}
              />
              <AdminFieldError message={errors.imageAlt?.message} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={checkboxRowCls}>
                <input
                  type="checkbox"
                  className="mt-0.5 accent-amber-700"
                  disabled={isPending}
                  {...register('published')}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Boutique ouverte
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    Decochez pour l afficher comme en cours / bientot sur l accueil.
                  </span>
                </span>
              </label>
              <label className={checkboxRowCls}>
                <input
                  type="checkbox"
                  className="mt-0.5 accent-amber-700"
                  disabled={isPending}
                  {...register('pickupEnabled')}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Point de retrait
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-500">
                    Proposee au client comme lieu de retrait a la commande.
                  </span>
                </span>
              </label>
            </div>

            <AdminButton type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Ajouter'}
            </AdminButton>
          </form>
        </AdminModal>
      )}
    </div>
  )
}
