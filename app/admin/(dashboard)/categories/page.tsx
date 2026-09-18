import { getCategories } from '@/app/actions/categories'
import { AdminCategoriesClient } from '../../admin-categories-client'
import { AdminPageHeader } from '../../admin-ui'

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div>
      <AdminPageHeader
        eyebrow="ORGANISATION"
        title="Categories"
        description="Creez les categories, ajoutez une courte description et organisez les produits en boutique."
      />
      <AdminCategoriesClient initialCategories={categories} />
    </div>
  )
}
