'use client'

import { createOrder } from '@/app/actions/orders'
import { getDeliveryFee } from '@/app/actions/settings'
import { FragranceNoteChips } from '@/components/fragrance-note-chips'
import { useCart } from '@/components/cart-context'
import { useLocale } from '@/components/locale-provider'
import { Reveal } from '@/components/reveal'
import { useToast } from '@/components/toast-provider'
import { getErrorMessage } from '@/lib/get-error-message'
import { formatPriceTnd } from '@/lib/product-price'
import { GOVERNORATE_SELECT_OPTIONS } from '@/lib/tunisia-governorates'
import { createCheckoutSchema, type CheckoutFormValues } from '@/lib/validations'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

const storeLabelCls = 'mb-2 block text-sm font-semibold text-foreground'
const storeSectionCls = 'mb-5 text-sm font-semibold uppercase tracking-wide text-primary'
const storeInputCls =
  'w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20'
const storeInputErrorCls =
  'w-full rounded-xl border-2 border-destructive bg-card px-4 py-3 text-base text-foreground outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/20'

function StoreFieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-sm font-medium text-destructive">{message}</p>
}

export default function CheckoutPage() {
  const { locale } = useLocale()
  return <CheckoutForm key={locale} />
}

function CheckoutForm() {
  const { items, total, removeItem, updateQuantity, clearCart } = useCart()
  const { locale, dictionary } = useLocale()
  const t = dictionary.checkout
  const currency = dictionary.currency
  const router = useRouter()
  const toast = useToast()
  const [deliveryFee, setDeliveryFee] = useState(7)

  const checkoutSchema = useMemo(
    () => createCheckoutSchema(dictionary.validation),
    [dictionary.validation],
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      orderType: 'delivery',
      customerName: '',
      customerPhone: '',
      customerGovernorate: '',
      customerAddress: '',
      pickupBoutiqueId: null,
      notes: '',
    },
  })

  useEffect(() => {
    getDeliveryFee().then(setDeliveryFee).catch(() => setDeliveryFee(7))
  }, [])

  const grandTotal = total + deliveryFee

  async function onSubmit(values: CheckoutFormValues) {
    if (items.length === 0) {
      toast.error(t.emptyToast)
      return
    }

    try {
      const orderId = await createOrder({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerGovernorate: values.customerGovernorate || undefined,
        customerAddress: values.customerAddress || undefined,
        orderType: 'delivery',
        pickupBoutiqueId: null,
        notes: values.notes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productBrand: i.productBrand,
          size: i.size,
          quantity: i.quantity,
          price: i.price,
        })),
      })
      clearCart()
      toast.success(t.successToast)
      router.push(`/checkout/success?orderId=${orderId}`)
    } catch (error) {
      toast.error(getErrorMessage(error, t.errorToast))
    }
  }

  if (items.length === 0) {
    return (
      <Reveal className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-sm font-light tracking-widest text-muted-foreground">{t.empty}</p>
        <Link
          href="/products"
          prefetch
          className="rounded-full border border-primary bg-primary/5 px-8 py-3 text-xs font-light tracking-[0.3em] text-primary transition-all hover:bg-primary hover:text-primary-foreground"
        >
          {t.seeBoutique}
        </Link>
      </Reveal>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4 sm:py-8">
      <Reveal className="mb-6 sm:mb-8">
        <h1 className="font-serif text-xl tracking-wide text-foreground sm:text-2xl md:text-3xl">
          {t.yourOrder}
        </h1>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          <p className={storeSectionCls}>{t.cart}</p>
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:gap-4 sm:p-4"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="h-20 w-16 shrink-0 object-cover"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] tracking-widest text-primary">
                    {item.productBrand.toUpperCase()}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-[11px] text-muted-foreground">{item.size}</p>
                  {item.fragranceNotes && item.fragranceNotes.length > 0 ? (
                    <div className="mt-1.5">
                      <FragranceNoteChips
                        notes={item.fragranceNotes}
                        labels={dictionary.fragranceNotes as Record<string, string>}
                        overflowLabel={dictionary.products.notesOverflow}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center border border-border">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                      aria-label="−"
                      className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                    >
                      &minus;
                    </button>
                    <span className="min-w-6 text-center text-sm font-medium text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                      aria-label="+"
                      className="flex min-h-11 min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-primary"
                    >
                      +
                    </button>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                    {formatPriceTnd(item.price * item.quantity, locale)} {currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.productId, item.size)}
                aria-label="Remove"
                className="flex min-h-11 min-w-9 shrink-0 items-start justify-center self-start pt-1 text-border transition-colors hover:text-destructive"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          <div className="mt-4 rounded-2xl border-2 border-primary/20 bg-card p-4 sm:mt-6 sm:p-6">
            <p className={storeSectionCls}>{t.receptionMode}</p>
            <div className="rounded-xl border-2 border-primary bg-primary/15 p-4 ring-2 ring-primary/25">
              <span className="text-sm font-semibold text-foreground">{t.delivery}</span>
              <span className="mt-1 block text-sm font-medium text-primary">
                {formatPriceTnd(deliveryFee, locale)} {currency}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {t.deliveryHint}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5 sm:space-y-6">
          <input type="hidden" {...register('orderType')} value="delivery" />

          <div className="rounded-2xl border-2 border-primary/20 bg-card p-4 sm:p-6">
            <p className={storeSectionCls}>{t.details}</p>
            <div className="space-y-5">
              <div>
                <label className={storeLabelCls}>
                  {t.fullName} <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  autoComplete="name"
                  className={errors.customerName ? storeInputErrorCls : storeInputCls}
                  {...register('customerName')}
                />
                <StoreFieldError message={errors.customerName?.message} />
              </div>
              <div>
                <label className={storeLabelCls}>
                  {t.phone} <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t.phonePlaceholder}
                  className={errors.customerPhone ? storeInputErrorCls : storeInputCls}
                  {...register('customerPhone')}
                />
                <StoreFieldError message={errors.customerPhone?.message} />
              </div>
              <div>
                <label className={storeLabelCls}>
                  {t.governorate} <span className="text-primary">*</span>
                </label>
                <Controller
                  control={control}
                  name="customerGovernorate"
                  render={({ field }) => (
                    <StoreSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={GOVERNORATE_SELECT_OPTIONS}
                      placeholder={t.governoratePlaceholder}
                      hasError={!!errors.customerGovernorate}
                    />
                  )}
                />
                <StoreFieldError message={errors.customerGovernorate?.message} />
              </div>
              <div>
                <label className={storeLabelCls}>
                  {t.address} <span className="text-primary">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={t.addressPlaceholder}
                  autoComplete="street-address"
                  className={`${errors.customerAddress ? storeInputErrorCls : storeInputCls} resize-none`}
                  {...register('customerAddress')}
                />
                <StoreFieldError message={errors.customerAddress?.message} />
              </div>
              <div>
                <label className={storeLabelCls}>{t.notes}</label>
                <textarea
                  rows={2}
                  placeholder={t.notesPlaceholder}
                  className={`${errors.notes ? storeInputErrorCls : storeInputCls} resize-none`}
                  {...register('notes')}
                />
                <StoreFieldError message={errors.notes?.message} />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border-2 border-primary/20 bg-secondary/40 p-4 sm:p-6">
            <p className={storeSectionCls}>{t.summary}</p>
            <div className="flex justify-between text-base text-foreground">
              <span>{t.subtotal}</span>
              <span className="font-medium">{formatPriceTnd(total, locale)} {currency}</span>
            </div>
            <div className="flex justify-between text-base text-foreground">
              <span>{t.shipping}</span>
              <span className="font-medium">
                {formatPriceTnd(deliveryFee, locale)} {currency}
              </span>
            </div>
            <div className="h-px bg-primary/20" />
            <div className="flex justify-between items-center text-foreground">
              <span className="text-base font-semibold">{t.total}</span>
              <span className="text-xl font-semibold tabular-nums text-primary sm:text-2xl">
                {formatPriceTnd(grandTotal, locale)} {currency}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="sticky bottom-3 z-20 w-full rounded-full bg-primary py-4 text-sm font-semibold tracking-wide text-primary-foreground shadow-md shadow-primary/30 transition-all hover:opacity-95 disabled:opacity-60 sm:static"
            style={{ marginBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}
          >
            {isSubmitting ? t.submitting : t.confirmDelivery}
          </button>
        </form>
      </div>
    </div>
  )
}
