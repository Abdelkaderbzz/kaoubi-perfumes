import { getDashboardStats, getRecentOrders } from '@/app/actions/orders'
import {
  AdminPageHeader,
  AdminQuickLink,
  AdminStatCard,
  AdminBadge,
  AdminCard,
} from '../admin-ui'
import { formatDateFr } from '@/lib/locale'
import { formatPriceTnd } from '@/lib/product-price'
import { orderStatusMeta } from '../order-status'
import { AdminRoutePrefetch } from '../admin-route-prefetch'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([getDashboardStats(), getRecentOrders(5)])

  const latest = recentOrders

  return (
    <div>
      <AdminRoutePrefetch />
      <AdminPageHeader
        eyebrow="ADMINISTRATION"
        title="Tableau de bord"
        description="Vue d'ensemble de votre boutique: produits, commandes, categories et tarifs de livraison."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard label="COMMANDES" value={stats.totalOrders} />
        <AdminStatCard
          label="EN ATTENTE"
          value={stats.pendingOrders}
          tone={stats.pendingOrders > 0 ? 'warning' : 'default'}
        />
        <AdminStatCard
          label="CHIFFRE D'AFFAIRES"
          value={`${formatPriceTnd(stats.revenue)} TND`}
          tone="accent"
        />
        <AdminStatCard
          label="PRODUITS EN STOCK"
          value={`${stats.inStockProducts}/${stats.totalProducts}`}
          tone="success"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminQuickLink
          href="/admin/products"
          title="Gerer les produits"
          description="Ajouter, modifier ou supprimer des parfums."
        />
        <AdminQuickLink
          href="/admin/orders"
          title="Gerer les commandes"
          description="Suivre, modifier ou supprimer les commandes clients."
        />
        <AdminQuickLink
          href="/admin/categories"
          title="Gerer les categories"
          description="Parfums, soins et bakhoor de la boutique."
        />
        <AdminQuickLink
          href="/admin/boutiques"
          title="Gerer les boutiques"
          description="Adresses affichees en accueil et points de retrait des commandes."
        />
        <AdminQuickLink
          href="/admin/hero"
          title="Images hero"
          description="Modifier les 4 photos du diaporama d accueil."
        />
        <AdminQuickLink
          href="/admin/banner"
          title="Bannieres d annonce"
          description="Creer, personnaliser et publier vos annonces en haut du site."
        />
        <AdminQuickLink
          href="/admin/settings"
          title="Tarif de livraison"
          description={`Actuellement ${formatPriceTnd(stats.deliveryFee)} TND par commande.`}
        />
      </div>

      <AdminCard title="Dernieres commandes">
        {latest.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {latest.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    #{order.id} — {order.customerName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDateFr(order.createdAt)} ·{' '}
                    {order.orderType === 'delivery' ? 'Livraison' : 'Boutique'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AdminBadge tone={orderStatusMeta(order.status).tone}>
                    {orderStatusMeta(order.status).label}
                  </AdminBadge>
                  <span className="text-sm font-bold text-slate-900">
                    {formatPriceTnd(parseFloat(order.totalAmount))} TND
                  </span>
                </div>
              </div>
            ))}
            <Link
              href="/admin/orders"
              prefetch
              className="inline-block text-sm font-semibold text-amber-800 hover:underline"
            >
              Voir toutes les commandes
            </Link>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
