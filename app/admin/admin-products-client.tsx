'use client'

import { addProduct, deleteProduct, updateProduct } from '@/app/actions/products'
import { useToast } from '@/components/toast-provider'
import { useConfirm } from '@/components/confirm-provider'
import { getErrorMessage } from '@/lib/get-error-message'
import { getPrimaryImage, parseProductImages } from '@/lib/product-images'
import { parseRelatedProductIds } from '@/lib/product-relations'
import { formatPriceTnd, getDiscountPercent, parsePrice } from '@/lib/product-price'
import { dummyPerfumeSizeVariants, parseProductSizeVariants } from '@/lib/product-sizes'
import { FRAGRANCE_NOTE_OPTIONS, parseFragranceNotes } from '@/lib/fragrance-notes'
import {
  EMPTY_COMPOSITION,
  parsePerfumeComposition,
} from '@/lib/perfume-composition'
import { WEAR_MOMENT_OPTIONS, parseWearMoments } from '@/lib/product-wear'
import { INTENSITY_LEVELS } from '@/lib/product-intensity'
import { PRODUCT_SEX_OPTIONS, getProductSexLabel } from '@/lib/product-sex'
import {
  formatStockQuantityInput,
  isProductAvailable,
  isLowStock,
  parseStockQuantityInput,
  stockCount,
} from '@/lib/product-stock'
import { productSchema, type ProductFormValues } from '@/lib/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePrefetchHrefs, useRouteTransition } from '@/lib/use-route-transition'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminFieldError,
  AdminIconButton,
  AdminIconLink,
  AdminModal,
  AdminTable,
  adminInputWithError,
  adminLabelCls,
  adminTableCellCls,
  adminTableHeadCls,
  adminTableMutedCls,
} from './admin-ui'
import { AdminSelect } from './admin-select'
import { ProductCompositionField } from './product-composition-field'
import { ProductImagesField } from './product-images-field'
import { RelatedProductsField, type ProductOption } from './related-products-field'
import { ADMIN_PAGE_SIZE, AdminPagination } from './admin-pagination'

type Product = {
  id: number
  name: string
  brand: string
  description: string | null
  price: string
  compareAtPrice: string | null
  category: string
  imageUrl: string | null
  images: string | null
  sizes: string
  relatedProductIds: string
  fragranceNotes: string
  composition?: string | null
  wearMoments: string
  intensity: string | null
  sex: string | null
  inStock: boolean
  stockQuantity: number | null
  featured: boolean
  newArrival: boolean
  published: boolean
  promoTagEnabled?: boolean
  promoTagLabel?: string
  promoTagBgColor?: string
  promoTagTextColor?: string
}

type Category = {
  id: number
  name: string
  slug: string
}

function buildProductsUrl(
  search: string,
  category: string,
  stock: 'all' | 'in' | 'out',
  page: number,
) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (category && category !== 'all') params.set('category', category)
  if (stock !== 'all') params.set('stock', stock)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/admin/products?${query}` : '/admin/products'
}

const colorInputCls =
  'size-10 shrink-0 cursor-pointer rounded-md border border-slate-300 bg-white p-1'

const EMPTY_FORM: ProductFormValues = {
  name: '',
  brand: '',
  description: '',
  price: '50.000',
  compareAtPrice: '',
  category: 'eau-de-parfum',
  images: [],
  sizeVariants: dummyPerfumeSizeVariants('50.000'),
  relatedProductIds: [],
  fragranceNotes: [],
  composition: { ...EMPTY_COMPOSITION, tete: [], coeur: [], fond: [] },
  wearMoments: [],
  intensity: '',
  sex: '',
  inStock: true,
  stockQuantity: '',
  featured: false,
  newArrival: false,
  published: true,
  promoTagEnabled: false,
  promoTagLabel: 'Promotion',
  promoTagBgColor: '#c81e1e',
  promoTagTextColor: '#ffffff',
}

export function AdminProductsClient({
  products,
  total,
  page,
  search: initialSearch,
  category: initialCategory,
  stock: initialStock,
  categories,
  productOptions,
}: {
  products: Product[]
  total: number
  page: number
  search: string
  category: string
  stock: 'all' | 'in' | 'out'
  categories: Category[]
  productOptions: ProductOption[]
}) {
  const { isPending: isNavigating, push, refresh } = useRouteTransition()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()
  const isBusy = isPending || isNavigating

  const defaultCategory = categories[0]?.slug ?? 'eau-de-parfum'

  usePrefetchHrefs([
    page > 1 ? buildProductsUrl(initialSearch, initialCategory, initialStock, page - 1) : '',
    page * ADMIN_PAGE_SIZE < total
      ? buildProductsUrl(initialSearch, initialCategory, initialStock, page + 1)
      : '',
  ])

  useEffect(() => {
    setSearchInput(initialSearch)
  }, [initialSearch])

  function navigate(
    nextSearch: string,
    nextCategory: string,
    nextStock: 'all' | 'in' | 'out',
    nextPage: number,
  ) {
    push(buildProductsUrl(nextSearch, nextCategory, nextStock, nextPage))
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...EMPTY_FORM, category: defaultCategory },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sizeVariants',
  })

  const images = watch('images')
  const relatedProductIds = watch('relatedProductIds')
  const fragranceNotes = watch('fragranceNotes')
  const composition = watch('composition')
  const wearMoments = watch('wearMoments')
  const watchedPrice = watch('price')
  const watchedCompareAt = watch('compareAtPrice')
  const promoTagEnabled = watch('promoTagEnabled')
  const promoTagBgColor = watch('promoTagBgColor')
  const promoTagTextColor = watch('promoTagTextColor')
  const promoTagLabel = watch('promoTagLabel')
  const previewDiscount = getDiscountPercent(watchedPrice, watchedCompareAt)

  function openAdd() {
    setEditingProduct(null)
    reset({ ...EMPTY_FORM, category: defaultCategory })
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    const variants = parseProductSizeVariants(product.sizes, product.price)
    reset({
      name: product.name,
      brand: product.brand,
      description: product.description ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? '',
      category: product.category,
      images: parseProductImages(product),
      sizeVariants: variants.map((variant) => ({
        size: variant.size,
        price: variant.price,
      })),
      relatedProductIds: parseRelatedProductIds(product),
      fragranceNotes: parseFragranceNotes(product.fragranceNotes),
      composition: parsePerfumeComposition(product.composition),
      wearMoments: parseWearMoments(product.wearMoments),
      intensity: product.intensity ?? '',
      sex: product.sex ?? '',
      inStock: product.inStock,
      stockQuantity: formatStockQuantityInput(product.stockQuantity),
      featured: product.featured,
      newArrival: product.newArrival ?? false,
      published: product.published ?? true,
      promoTagEnabled: product.promoTagEnabled ?? false,
      promoTagLabel: product.promoTagLabel || 'Promotion',
      promoTagBgColor: product.promoTagBgColor || '#c81e1e',
      promoTagTextColor: product.promoTagTextColor || '#ffffff',
    })
    setShowForm(true)
  }

  function onSubmit(form: ProductFormValues) {
    const sizeVariants = form.sizeVariants
      .map((variant) => ({ size: variant.size.trim(), price: variant.price.trim() }))
      .filter((variant) => variant.size && variant.price)
    const compareAtPrice = form.compareAtPrice?.trim() || null

    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          brand: form.brand,
          description: form.description,
          price: form.price,
          compareAtPrice,
          category: form.category,
          images: form.images,
          sizes: sizeVariants,
          relatedProductIds: form.relatedProductIds,
          fragranceNotes: form.fragranceNotes,
          composition: form.composition,
          wearMoments: form.wearMoments,
          intensity: form.intensity || null,
          sex: form.sex || null,
          inStock: form.inStock,
          stockQuantity: parseStockQuantityInput(form.stockQuantity),
          featured: form.featured,
          newArrival: form.newArrival,
          published: form.published,
          promoTagEnabled: form.promoTagEnabled,
          promoTagLabel: form.promoTagLabel.trim() || 'Promotion',
          promoTagBgColor: form.promoTagBgColor,
          promoTagTextColor: form.promoTagTextColor,
        }

        if (editingProduct) {
          await updateProduct(editingProduct.id, payload)
          toast.success('Produit modifie avec succes.')
        } else {
          await addProduct(payload)
          toast.success('Produit ajoute avec succes.')
        }
        setShowForm(false)
        refresh()
      } catch (error) {
        toast.error(getErrorMessage(error, "Impossible d'enregistrer le produit."))
      }
    })
  }

  async function handleDelete(id: number) {
    const ok = await confirm({
      title: 'Supprimer ce produit ?',
      description: 'Cette action est irreversible.',
      confirmLabel: 'Supprimer',
      variant: 'destructive',
    })
    if (!ok) return

    startTransition(async () => {
      try {
        await deleteProduct(id)
        toast.success('Produit supprime.')
        refresh()
      } catch (error) {
        toast.error(getErrorMessage(error, 'Impossible de supprimer le produit.'))
      }
    })
  }

  function categoryLabel(slug: string) {
    return categories.find((c) => c.slug === slug)?.name ?? slug
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                navigate(searchInput, initialCategory, initialStock, 1)
              }
            }}
            className={`${adminInputWithError(false)} w-full max-w-sm`}
            disabled={isNavigating}
          />
          <div className="w-full sm:w-44">
            <AdminSelect
              value={initialCategory}
              onValueChange={(value) => navigate(searchInput, value, initialStock, 1)}
              items={[
                { value: 'all', label: 'Toutes categories' },
                ...categories.map((category) => ({
                  value: category.slug,
                  label: category.name,
                })),
              ]}
              disabled={isNavigating}
            />
          </div>
          <div className="w-full sm:w-40">
            <AdminSelect
              value={initialStock}
              onValueChange={(value) =>
                navigate(searchInput, initialCategory, value as 'all' | 'in' | 'out', 1)
              }
              items={[
                { value: 'all', label: 'Tout le stock' },
                { value: 'in', label: 'En stock' },
                { value: 'out', label: 'Épuisé' },
              ]}
              disabled={isNavigating}
            />
          </div>
        </div>
        <AdminButton variant="outline" onClick={openAdd} disabled={isBusy}>
          + Ajouter un produit
        </AdminButton>
      </div>

      {total === 0 ? (
        <AdminEmptyState message="Aucun produit trouve." />
      ) : (
        <AdminTable loading={isBusy} loadingLabel={isNavigating ? 'Chargement des produits...' : 'Mise a jour...'}>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {['Image', 'Nom', 'Marque', 'Categorie', 'Genre', 'Prix', 'Stock', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className={adminTableHeadCls}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const primaryImage = getPrimaryImage(p)
                const imageCount = parseProductImages(p).length
                const discount = getDiscountPercent(p.price, p.compareAtPrice)
                const compareAt = parsePrice(p.compareAtPrice)

                return (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className={adminTableCellCls}>
                    {primaryImage ? (
                      <div className="relative">
                        <img src={primaryImage} alt={p.name} className="h-12 w-10 rounded object-cover" />
                        {imageCount > 1 && (
                          <span className="absolute -bottom-1 -right-1 rounded bg-slate-800 px-1 text-[10px] text-white">
                            +{imageCount - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-12 w-10 rounded bg-slate-200" />
                    )}
                  </td>
                  <td className={adminTableCellCls}>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.featured && <AdminBadge tone="info">Mis en avant</AdminBadge>}
                      {p.newArrival && <AdminBadge tone="info">Nouveauté</AdminBadge>}
                      {p.promoTagEnabled && (
                        <AdminBadge tone="danger">{p.promoTagLabel || 'Promotion'}</AdminBadge>
                      )}
                    </div>
                  </td>
                  <td className={adminTableMutedCls}>{p.brand}</td>
                  <td className={adminTableMutedCls}>{categoryLabel(p.category)}</td>
                  <td className={adminTableMutedCls}>{getProductSexLabel(p.sex) ?? '—'}</td>
                  <td className={adminTableCellCls}>
                    <p className="font-semibold text-slate-900">
                      {formatPriceTnd(parseFloat(p.price))} TND
                    </p>
                    {discount != null && compareAt != null && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className="line-through">{formatPriceTnd(compareAt)} TND</span>
                        <span className="ml-1.5 font-medium text-emerald-700">-{discount}%</span>
                      </p>
                    )}
                  </td>
                  <td className={adminTableCellCls}>
                    <AdminBadge
                      tone={
                        !isProductAvailable(p) ? 'danger' : isLowStock(p) ? 'warning' : 'success'
                      }
                    >
                      {isProductAvailable(p) ? 'En stock' : 'Épuisé'}
                    </AdminBadge>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {stockCount(p) === null ? 'Non compté' : `${stockCount(p)} unité(s)`}
                    </p>
                  </td>
                  <td className={adminTableCellCls}>
                    <AdminBadge tone={p.published !== false ? 'success' : 'warning'}>
                      {p.published !== false ? 'Visible' : 'Masque'}
                    </AdminBadge>
                  </td>
                  <td className={adminTableCellCls}>
                    <div className="flex items-center gap-1">
                      <AdminIconLink
                        href={`/products/${p.id}`}
                        label="Voir sur la boutique"
                        variant="accent"
                        external
                      >
                        <ExternalLink className="size-4" />
                      </AdminIconLink>
                      <AdminIconButton label="Modifier le produit" onClick={() => openEdit(p)} disabled={isBusy}>
                        <Pencil className="size-4" />
                      </AdminIconButton>
                      <AdminIconButton
                        label="Supprimer le produit"
                        variant="danger"
                        onClick={() => handleDelete(p.id)}
                        disabled={isBusy}
                      >
                        <Trash2 className="size-4" />
                      </AdminIconButton>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
        </AdminTable>
      )}

      {total > 0 && (
        <AdminPagination
          page={page}
          pageSize={ADMIN_PAGE_SIZE}
          totalItems={total}
          loading={isNavigating}
          onPageChange={(nextPage) => navigate(searchInput, initialCategory, initialStock, nextPage)}
        />
      )}

      {showForm && (
        <AdminModal
          title={editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
          onClose={() => !isPending && setShowForm(false)}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={adminLabelCls}>NOM *</label>
              <input type="text" className={adminInputWithError(!!errors.name)} {...register('name')} />
              <AdminFieldError message={errors.name?.message} />
            </div>
            <div>
              <label className={adminLabelCls}>MARQUE *</label>
              <input type="text" className={adminInputWithError(!!errors.brand)} {...register('brand')} />
              <AdminFieldError message={errors.brand?.message} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={adminLabelCls}>PRIX ACTUEL (TND) *</label>
                <input
                  type="number"
                  step="0.001"
                  className={adminInputWithError(!!errors.price)}
                  {...register('price')}
                />
                <AdminFieldError message={errors.price?.message} />
              </div>
              <div>
                <label className={adminLabelCls}>ANCIEN PRIX (TND)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Optionnel — pour une promo"
                  className={adminInputWithError(!!errors.compareAtPrice)}
                  {...register('compareAtPrice', {
                    setValueAs: (value) => (value == null || value === '' ? '' : String(value)),
                  })}
                />
                <AdminFieldError message={errors.compareAtPrice?.message} />
                {previewDiscount != null && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    Remise affichee : -{previewDiscount}%
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className={`${adminLabelCls} mb-0`}>TAILLES ET PRIX</label>
                <button
                  type="button"
                  onClick={() => append({ size: '', price: '' })}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  <Plus className="size-3.5" />
                  Ajouter
                </button>
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Ajoutez une ligne par taille, avec son prix. Laissez vide pour un seul prix unique.
              </p>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        placeholder="Taille (10ml, 30ml...)"
                        className={adminInputWithError(!!errors.sizeVariants?.[index]?.size)}
                        {...register(`sizeVariants.${index}.size`)}
                      />
                      <AdminFieldError message={errors.sizeVariants?.[index]?.size?.message} />
                    </div>
                    <div className="w-28 shrink-0 sm:w-32">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Prix TND"
                        className={adminInputWithError(!!errors.sizeVariants?.[index]?.price)}
                        {...register(`sizeVariants.${index}.price`)}
                      />
                      <AdminFieldError message={errors.sizeVariants?.[index]?.price?.message} />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50"
                      aria-label="Supprimer cette taille"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <AdminFieldError message={errors.sizeVariants?.message} />
            </div>

            <ProductImagesField
              value={images}
              onChange={(urls) => setValue('images', urls, { shouldValidate: true })}
              error={errors.images?.message}
            />

            <div>
              <label className={adminLabelCls}>DESCRIPTION</label>
              <textarea
                rows={3}
                className={`${adminInputWithError(!!errors.description)} resize-none`}
                {...register('description')}
              />
              <AdminFieldError message={errors.description?.message} />
            </div>

            <div>
              <label className={adminLabelCls}>CATEGORIE</label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    items={categories.map((category) => ({
                      value: category.slug,
                      label: category.name,
                    }))}
                    error={!!errors.category}
                  />
                )}
              />
              <AdminFieldError message={errors.category?.message} />
            </div>

            <RelatedProductsField
              value={relatedProductIds}
              onChange={(ids) => setValue('relatedProductIds', ids, { shouldValidate: true })}
              options={productOptions}
              excludeId={editingProduct?.id}
              error={errors.relatedProductIds?.message}
            />

            <div>
              <label className={adminLabelCls}>PROFIL OLFACTIF</label>
              <div className="flex flex-wrap gap-2">
                {FRAGRANCE_NOTE_OPTIONS.map((note) => {
                  const checked = fragranceNotes.includes(note.value)
                  return (
                    <button
                      key={note.value}
                      type="button"
                      onClick={() =>
                        setValue(
                          'fragranceNotes',
                          checked
                            ? fragranceNotes.filter((value) => value !== note.value)
                            : [...fragranceNotes, note.value],
                          { shouldValidate: true },
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? 'border-amber-700 bg-amber-100 text-amber-900'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {note.label}
                    </button>
                  )
                })}
              </div>
              <AdminFieldError message={errors.fragranceNotes?.message as string | undefined} />
            </div>

            <ProductCompositionField
              value={composition ?? EMPTY_COMPOSITION}
              onChange={(next) => setValue('composition', next, { shouldValidate: true })}
              errors={errors.composition}
            />

            <div>
              <label className={adminLabelCls}>QUAND LE PORTER</label>
              <div className="flex flex-wrap gap-2">
                {WEAR_MOMENT_OPTIONS.map((option) => {
                  const checked = wearMoments.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setValue(
                          'wearMoments',
                          checked
                            ? wearMoments.filter((value) => value !== option.value)
                            : [...wearMoments, option.value],
                          { shouldValidate: true },
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        checked
                          ? 'border-amber-700 bg-amber-100 text-amber-900'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <AdminFieldError message={errors.wearMoments?.message as string | undefined} />
            </div>

            <div>
              <label className={adminLabelCls}>INTENSITE</label>
              <Controller
                control={control}
                name="intensity"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value || 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    items={[
                      { value: 'none', label: 'Non definie' },
                      ...INTENSITY_LEVELS.map((level) => ({ value: level.value, label: level.label })),
                    ]}
                  />
                )}
              />
              <AdminFieldError message={errors.intensity?.message} />
            </div>

            <div>
              <label className={adminLabelCls}>GENRE</label>
              <Controller
                control={control}
                name="sex"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value || 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    items={[
                      { value: 'none', label: 'Non defini' },
                      ...PRODUCT_SEX_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
                    ]}
                  />
                )}
              />
              <AdminFieldError message={errors.sex?.message} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 accent-amber-700"
                  {...register('promoTagEnabled')}
                />
                Afficher un tag promotion
              </label>

              {promoTagEnabled && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className={adminLabelCls}>LIBELLE DU TAG</label>
                    <input
                      type="text"
                      className={adminInputWithError(!!errors.promoTagLabel)}
                      {...register('promoTagLabel')}
                    />
                    <AdminFieldError message={errors.promoTagLabel?.message} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={adminLabelCls}>COULEUR DU TAG</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className={colorInputCls}
                          value={promoTagBgColor}
                          onChange={(event) =>
                            setValue('promoTagBgColor', event.target.value, { shouldValidate: true })
                          }
                        />
                        <input
                          className={adminInputWithError(!!errors.promoTagBgColor)}
                          {...register('promoTagBgColor')}
                        />
                      </div>
                      <AdminFieldError message={errors.promoTagBgColor?.message} />
                    </div>
                    <div>
                      <label className={adminLabelCls}>COULEUR DU TEXTE</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className={colorInputCls}
                          value={promoTagTextColor}
                          onChange={(event) =>
                            setValue('promoTagTextColor', event.target.value, {
                              shouldValidate: true,
                            })
                          }
                        />
                        <input
                          className={adminInputWithError(!!errors.promoTagTextColor)}
                          {...register('promoTagTextColor')}
                        />
                      </div>
                      <AdminFieldError message={errors.promoTagTextColor?.message} />
                    </div>
                  </div>
                  <div
                    className="inline-flex rounded px-2.5 py-1 text-xs font-semibold tracking-wide"
                    style={{
                      backgroundColor: promoTagBgColor,
                      color: promoTagTextColor,
                    }}
                  >
                    {promoTagLabel.trim() || 'Promotion'}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={adminLabelCls}>STATUT</label>
              <Controller
                control={control}
                name="published"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value ? 'visible' : 'hidden'}
                    onValueChange={(v) => field.onChange(v === 'visible')}
                    items={[
                      { value: 'visible', label: 'Visible en boutique' },
                      { value: 'hidden', label: 'Masque' },
                    ]}
                  />
                )}
              />
              <p className="mt-1 text-xs text-slate-500">
                Les produits masques n&apos;apparaissent pas sur la boutique.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
                <input type="checkbox" className="accent-amber-700" {...register('inStock')} />
                En stock
              </label>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <label className={adminLabelCls}>QUANTITE EN STOCK</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  placeholder="Laisser vide = non compté"
                  className={adminInputWithError(!!errors.stockQuantity)}
                  {...register('stockQuantity')}
                />
                <AdminFieldError message={errors.stockQuantity?.message} />
                <p className="mt-1 text-xs text-slate-500">
                  A 0, le produit passe en « Épuisé » sur la boutique et ne peut plus etre
                  commande. Laissez vide pour piloter la disponibilite avec la case « En stock »
                  uniquement.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" className="accent-amber-700" {...register('featured')} />
                Mis en avant
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" className="accent-amber-700" {...register('newArrival')} />
                Nouveauté
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Mis en avant = Coups de cœur. Nouveauté = section NOUVEAUTÉS (8 produits max).
            </p>

            <AdminButton type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Enregistrement...' : editingProduct ? 'Enregistrer' : 'Ajouter'}
            </AdminButton>
          </form>
        </AdminModal>
      )}
    </div>
  )
}
