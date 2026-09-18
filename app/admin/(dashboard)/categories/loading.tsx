import { AdminPageSkeleton } from '../../admin-ui'

export default function AdminCategoriesLoading() {
  return (
    <AdminPageSkeleton
      eyebrow="ORGANISATION"
      title="Categories"
      description="Creez les categories, ajoutez une courte description et organisez les produits en boutique."
      rows={6}
      columns={4}
    />
  )
}
