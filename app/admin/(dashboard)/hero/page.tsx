import { getAdminHeroImages } from '@/app/actions/hero'
import { AdminHeroClient } from '../../admin-hero-client'
import { AdminPageHeader } from '../../admin-ui'

export default async function AdminHeroPage() {
  const images = await getAdminHeroImages()

  return (
    <div>
      <AdminPageHeader
        eyebrow="PAGE D ACCUEIL"
        title="Images hero"
        description="Televersez les 4 photos du mosaic en haut de la page d accueil."
      />
      <AdminHeroClient initialImages={images} />
    </div>
  )
}
