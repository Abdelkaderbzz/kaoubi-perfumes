import { AdminPageSkeleton } from '../../admin-ui'

export default function AdminHeroLoading() {
  return (
    <AdminPageSkeleton
      eyebrow="PAGE D ACCUEIL"
      title="Images hero"
      description="Televersez les 4 photos du mosaic en haut de la page d accueil."
      rows={4}
      columns={2}
    />
  )
}
