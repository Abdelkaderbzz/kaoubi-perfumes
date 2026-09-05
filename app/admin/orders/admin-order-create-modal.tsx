'use client'

import { adminCreateOrder, type CartItem } from '@/app/actions/orders'
import { useToast } from '@/components/toast-provider'
import { boutiqueLabel, type PickupBoutique } from '@/lib/boutiques'
import { parseProductSizeVariants, getVariantPrice, DEFAULT_SIZE } from '@/lib/product-sizes'
import { GOVERNORATE_SELECT_OPTIONS } from '@/lib/tunisia-governorates'
import { orderCreateSchema, type OrderCreateFormValues } from '@/lib/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { AdminSelect } from '../admin-select'
import {
  AdminButton,
  AdminFieldError,
  AdminIconButton,
  AdminModal,
  adminInputCls,
  adminInputWithError,
  adminLabelCls,
} from '../admin-ui'
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_SELECT_CLS, orderStatusMeta } from '../order-status'

export type CreateOrderProduct = {
  id: number
  name: string
  brand: string
  price: string
  sizes: string
  inStock: boolean
}

const ORDER_TYPE_OPTIONS = [
  { value: 'delivery', label: 'Livraison' },
  { value: 'boutique', label: 'Retrait boutique' },
]

const STATUS_SELECT_OPTIONS = ORDER_STATUS_OPTIONS.map((status) => ({
  value: status.value,
  label: status.label,
}))

function getProductSizeOptions(product: CreateOrderProduct) {
  const variants = parseProductSizeVariants(product.sizes, product.price)
  if (variants.length === 0) {
    return [{ value: DEFAULT_SIZE, label: DEFAULT_SIZE, price: parseFloat(product.price) }]
  }
  return variants.map((variant) => ({
    value: variant.size,
    label: `${variant.size} — ${parseFloat(variant.price).toFixed(3)} TND`,
    price: parseFloat(variant.price),
  }))
}

type DraftLine = CartItem & { key: string }

export function AdminOrderCreateModal({
  products,
  deliveryFee,
  pickupBoutiques,
  onClose,
  onCreated,
}: {
  products: CreateOrderProduct[]
  deliveryFee: number
  pickupBoutiques: PickupBoutique[]
  onClose: () => void
  onCreated: () => void
}) {
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [lines, setLines] = useState<DraftLine[]>([])
  const [productId, setProductId] = useState('')
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [itemError, setItemError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<OrderCreateFormValues>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerGovernorate: '',
      customerAddress: '',
      orderType: 'delivery',
      pickupBoutiqueId: null,
      status: 'confirmed',
      notes: '',
      items: [],
    },
  })

  const orderType = watch('orderType')

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        value: String(product.id),
        label: `${product.brand} — ${product.name} (${parseFloat(product.price).toFixed(3)} TND)`,
      })),
    [products],
  )

  const selectedProduct = products.find((product) => String(product.id) === productId) ?? null
  const sizeOptions = useMemo(() => {
    if (!selectedProduct) return []
    return getProductSizeOptions(selectedProduct).map(({ value, label }) => ({ value, label }))
  }, [selectedProduct])

  const subtotal = lines.reduce((acc, line) => acc + line.price * line.quantity, 0)
  const fee = orderType === 'delivery' ? deliveryFee : 0
  const total = subtotal + fee

  function syncItems(nextLines: DraftLine[]) {
    setLines(nextLines)
    setValue(
      'items',
      nextLines.map(({ productId, productName, productBrand, size, quantity, price }) => ({
        productId,
        productName,
        productBrand,
        size,
        quantity,
        price,
      })),
      { shouldValidate: nextLines.length > 0 },
    )
  }

  function handleProductChange(nextId: string) {
    setProductId(nextId)
    setItemError(null)
    const product = products.find((item) => String(item.id) === nextId)
    const sizes = product ? getProductSizeOptions(product) : []
    setSize(sizes[0]?.value ?? '')
  }

  function addLine() {
    if (!selectedProduct) {
      setItemError('Selectionnez un produit.')
      return
    }
    if (!size) {
      setItemError('Selectionnez une taille.')
      return
    }
    const qty = parseInt(quantity, 10)
    if (!Number.isFinite(qty) || qty < 1) {
      setItemError('Quantite invalide.')
      return
    }

    const unitPrice = getVariantPrice(
      parseProductSizeVariants(selectedProduct.sizes, selectedProduct.price),
      size,
      selectedProduct.price,
    )

    const existingIndex = lines.findIndex(
      (line) => line.productId === selectedProduct.id && line.size === size,
    )
    if (existingIndex >= 0) {
      const next = lines.map((line, index) =>
        index === existingIndex
          ? { ...line, quantity: Math.min(99, line.quantity + qty) }
          : line,
      )
      syncItems(next)
    } else {
      syncItems([
        ...lines,
        {
          key: `${selectedProduct.id}-${size}-${Date.now()}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productBrand: selectedProduct.brand,
          size,
          quantity: qty,
          price: unitPrice,
        },
      ])
    }

    setItemError(null)
    setQuantity('1')
  }

  function removeLine(key: string) {
    syncItems(lines.filter((line) => line.key !== key))
  }

  function updateLineQuantity(key: string, nextQty: number) {
    if (!Number.isFinite(nextQty) || nextQty < 1) return
    syncItems(
      lines.map((line) =>
        line.key === key ? { ...line, quantity: Math.min(99, nextQty) } : line,
      ),
    )
  }

  function onSubmit(values: OrderCreateFormValues) {
    startTransition(async () => {
      const result = await adminCreateOrder({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerGovernorate: values.customerGovernorate || undefined,
        customerAddress: values.customerAddress || undefined,
        orderType: values.orderType,
        pickupBoutiqueId: values.orderType === 'boutique' ? values.pickupBoutiqueId : null,
        status: values.status,
        notes: values.notes || undefined,
        items: values.items,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`Commande #${result.data.id} creee.`)
      onCreated()
    })
  }

  return (
    <AdminModal
      title="Nouvelle commande"
      onClose={() => !isPending && onClose()}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={adminLabelCls}>NOM CLIENT *</label>
            <input
              className={adminInputWithError(!!errors.customerName)}
              disabled={isPending}
              {...register('customerName')}
            />
            <AdminFieldError message={errors.customerName?.message} />
          </div>
          <div>
            <label className={adminLabelCls}>TELEPHONE *</label>
            <input
              className={adminInputWithError(!!errors.customerPhone)}
              disabled={isPending}
              {...register('customerPhone')}
            />
            <AdminFieldError message={errors.customerPhone?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={adminLabelCls}>TYPE</label>
            <Controller
              control={control}
              name="orderType"
              render={({ field }) => (
                <AdminSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  items={ORDER_TYPE_OPTIONS}
                  error={!!errors.orderType}
                  disabled={isPending}
                />
              )}
            />
            <AdminFieldError message={errors.orderType?.message} />
          </div>
          <div>
            <label className={adminLabelCls}>STATUT</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <AdminSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  items={STATUS_SELECT_OPTIONS}
                  error={!!errors.status}
                  disabled={isPending}
                  className={ORDER_STATUS_SELECT_CLS[orderStatusMeta(field.value).tone]}
                />
              )}
            />
            <AdminFieldError message={errors.status?.message} />
          </div>
        </div>

        {orderType === 'delivery' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={adminLabelCls}>GOUVERNORAT *</label>
              <Controller
                control={control}
                name="customerGovernorate"
                render={({ field }) => (
                  <AdminSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    items={GOVERNORATE_SELECT_OPTIONS}
                    error={!!errors.customerGovernorate}
                    disabled={isPending}
                  />
                )}
              />
              <AdminFieldError message={errors.customerGovernorate?.message} />
            </div>
            <div>
              <label className={adminLabelCls}>ADRESSE *</label>
              <textarea
                rows={3}
                className={`${adminInputWithError(!!errors.customerAddress)} resize-none`}
                disabled={isPending}
                {...register('customerAddress')}
              />
              <AdminFieldError message={errors.customerAddress?.message} />
            </div>
          </div>
        )}

        {orderType === 'boutique' && (
          <div>
            <label className={adminLabelCls}>BOUTIQUE DE RETRAIT *</label>
            <Controller
              control={control}
              name="pickupBoutiqueId"
              render={({ field }) => (
                <AdminSelect
                  value={field.value == null ? '' : String(field.value)}
                  onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                  items={pickupBoutiques.map((boutique) => ({
                    value: String(boutique.id),
                    label: `${boutique.name} — ${boutiqueLabel(boutique)}`,
                  }))}
                  placeholder="Choisir une boutique"
                  error={!!errors.pickupBoutiqueId}
                  disabled={isPending || pickupBoutiques.length === 0}
                />
              )}
            />
            <AdminFieldError message={errors.pickupBoutiqueId?.message} />
            {pickupBoutiques.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Activez le retrait sur au moins une boutique dans l onglet Boutiques.
              </p>
            )}
          </div>
        )}

        <div>
          <label className={adminLabelCls}>NOTES</label>
          <textarea
            rows={2}
            className={`${adminInputWithError(!!errors.notes)} resize-none`}
            disabled={isPending}
            {...register('notes')}
          />
          <AdminFieldError message={errors.notes?.message} />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <p className={adminLabelCls}>ARTICLES *</p>
          <div className="mt-2 space-y-3">
            <AdminSelect
              value={productId}
              onValueChange={handleProductChange}
              items={productOptions}
              placeholder="Selectionner un produit..."
              disabled={isPending || products.length === 0}
            />
            <div className="grid grid-cols-[1fr_88px_auto] gap-2">
              <AdminSelect
                value={size}
                onValueChange={setSize}
                items={sizeOptions}
                placeholder="Taille"
                disabled={isPending || !selectedProduct}
              />
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={adminInputCls}
                disabled={isPending}
                aria-label="Quantite"
              />
              <AdminButton
                type="button"
                variant="outline"
                onClick={addLine}
                disabled={isPending}
                className="inline-flex items-center gap-1"
              >
                <Plus className="size-4" />
                Ajouter
              </AdminButton>
            </div>
            {(itemError || errors.items?.message) && (
              <AdminFieldError message={itemError ?? errors.items?.message} />
            )}
            {products.length === 0 && (
              <p className="text-xs text-slate-500">Aucun produit disponible dans le catalogue.</p>
            )}
          </div>

          {lines.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{line.productName}</p>
                    <p className="text-xs text-slate-500">
                      {line.productBrand} · {line.size} · {line.price.toFixed(3)} TND
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLineQuantity(line.key, parseInt(event.target.value, 10))
                    }
                    className={`${adminInputCls} !w-16 !py-1.5 text-center`}
                    disabled={isPending}
                    aria-label={`Quantite ${line.productName}`}
                  />
                  <p className="w-24 text-right text-sm font-semibold tabular-nums text-slate-900">
                    {(line.price * line.quantity).toFixed(3)}
                  </p>
                  <AdminIconButton
                    label="Retirer l article"
                    variant="danger"
                    onClick={() => removeLine(line.key)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                  </AdminIconButton>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Sous-total</span>
              <span className="tabular-nums">{subtotal.toFixed(3)} TND</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Livraison</span>
              <span className="tabular-nums">
                {fee === 0 ? 'Gratuit' : `${fee.toFixed(3)} TND`}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">{total.toFixed(3)} TND</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <AdminButton
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={onClose}
          >
            Annuler
          </AdminButton>
          <AdminButton type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Creation...' : 'Creer la commande'}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}
