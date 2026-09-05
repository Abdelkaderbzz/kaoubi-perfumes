import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

// Root admin layout — no auth here.
// Auth is enforced in app/admin/(dashboard)/layout.tsx only.
// This layout exists solely to avoid Next.js layout conflicts.
// Force LTR French chrome even if the storefront locale cookie is Arabic.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="fr" dir="ltr" className="font-sans">
      {children}
    </div>
  )
}
