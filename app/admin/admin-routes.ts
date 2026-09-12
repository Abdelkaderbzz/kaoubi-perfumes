export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/products', label: 'Produits' },
  { href: '/admin/orders', label: 'Commandes' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/boutiques', label: 'Boutiques' },
  { href: '/admin/hero', label: 'Images hero' },
  { href: '/admin/banner', label: 'Bannieres' },
  { href: '/admin/settings', label: 'Livraison' },
] as const

export const ADMIN_PREFETCH_ROUTES = ADMIN_NAV_ITEMS.map((item) => item.href)
