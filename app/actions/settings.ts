'use server'

import { requireAdminId } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { cache } from 'react'

const DEFAULT_DELIVERY_FEE = '7.000'

const getDeliveryFeeCached = unstable_cache(
  async () => {
    const [row] = await db
      .select({ deliveryFee: settings.deliveryFee })
      .from(settings)
      .where(eq(settings.id, 1))
      .limit(1)
    return parseFloat(row?.deliveryFee ?? DEFAULT_DELIVERY_FEE)
  },
  ['delivery-fee'],
  { revalidate: 300, tags: ['settings'] },
)

export const getDeliveryFee = cache(async () => getDeliveryFeeCached())

export async function getSettings() {
  await requireAdminId()
  const [row] = await db
    .select({
      deliveryFee: settings.deliveryFee,
      updatedAt: settings.updatedAt,
    })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1)
  return {
    deliveryFee: row?.deliveryFee ?? DEFAULT_DELIVERY_FEE,
    updatedAt: row?.updatedAt ?? new Date(),
  }
}

function revalidateSettings() {
  revalidateTag('settings', 'max')
  revalidatePath('/admin')
  revalidatePath('/admin/settings')
  revalidatePath('/admin/orders')
  revalidatePath('/checkout')
  revalidatePath('/products')
}

export async function updateDeliveryFee(deliveryFee: string) {
  await requireAdminId()
  const fee = parseFloat(deliveryFee)
  if (Number.isNaN(fee) || fee < 0) throw new Error('Tarif de livraison invalide')

  await db
    .insert(settings)
    .values({ id: 1, deliveryFee: fee.toFixed(3), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.id,
      set: { deliveryFee: fee.toFixed(3), updatedAt: new Date() },
    })

  revalidateSettings()
}
