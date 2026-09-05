import { getAdminProductsPaginated, getProductOptions } from '@/app/actions/products'
import { getCategories } from '@/app/actions/categories'
import { ADMIN_PAGE_SIZE, normalizePage } from '@/lib/pagination'
import { AdminProductsClient } from '../../admin-products-client'
import { AdminPageHeader } from '../../admin-ui'

function normalizeStockFilter(value?: string): 'all' | 'in' | 'out' {
  if (value === 'in' || value === 'out') return value
  return 'all'
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string; stock?: string }>
}) {
  const params = await searchParams
  const page = normalizePage(params.page)
  const search = params.search?.trim() ?? ''
  const category = params.category?.trim() || 'all'
  const stock = normalizeStockFilter(params.stock)

  const [productPage, categories, productOptions] = await Promise.all([
    getAdminProductsPaginated({
      page,
      pageSize: ADMIN_PAGE_SIZE,
      search,
      category,
      inStock: stock,
    }),
    getCategories(),
    getProductOptions(),
  ])

  return (
    <div>
      <AdminPageHeader
        eyebrow="CATALOGUE"
        title="Produits"
        description="Gerez votre catalogue de parfums: prix, stock, images et categories."
      />
      <AdminProductsClient
        products={productPage.items}
        total={productPage.total}
        page={productPage.page}
        search={search}
        category={category}
        stock={stock}
        categories={categories}
        productOptions={productOptions}
      />
    </div>
  )
}
