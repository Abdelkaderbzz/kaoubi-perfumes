'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { getErrorMessage } from '@/lib/get-error-message'
import { Logo } from '@/components/logo'
import { useToast } from '@/components/toast-provider'
import { ExternalLink, Store } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ADMIN_NAV_ITEMS } from './admin-routes'

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

const storeLinkCls =
  'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50'

function AdminNavLink({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <Link
      href={href}
      prefetch
      onPointerEnter={() => {
        void router.prefetch(href)
      }}
      onFocus={() => {
        void router.prefetch(href)
      }}
      className={className}
    >
      {children}
    </Link>
  )
}

export function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const toast = useToast()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        toast.error('Impossible de se deconnecter.')
        return
      }
      toast.success('Deconnexion reussie.')
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Erreur lors de la deconnexion.'))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <>
      <header className="shrink-0 border-b border-slate-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2.5 text-base font-bold text-amber-800">
            <Logo size="sm" />
            KAOUBI Admin
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900"
            >
              <Store className="size-4" />
              Boutique
              <ExternalLink className="size-3 opacity-60" />
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-60"
            >
              {signingOut ? 'Deconnexion...' : 'Deconnexion'}
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2">
          {ADMIN_NAV_ITEMS.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(pathname, item.href)
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </AdminNavLink>
          ))}
        </nav>
      </header>

      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-6 py-6">
          <Link href="/admin" className="flex items-center gap-3 text-xl font-bold text-amber-800">
            <Logo size="sm" />
            <span>
              KAOUBI Admin
              <span className="mt-1 block text-sm font-medium text-slate-500">KAOUBI PERFUMES</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAV_ITEMS.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(pathname, item.href)
                  ? 'bg-amber-100 text-amber-900'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </AdminNavLink>
          ))}

          <div className="pt-3">
            <Link href="/" target="_blank" rel="noopener noreferrer" className={storeLinkCls}>
              <Store className="size-4 shrink-0" />
              <span className="flex-1">Voir la boutique</span>
              <ExternalLink className="size-3.5 shrink-0 opacity-60" />
            </Link>
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm text-slate-500">{userEmail}</p>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-3 text-sm font-medium text-slate-600 transition-colors hover:text-red-600 disabled:opacity-60"
          >
            {signingOut ? 'Deconnexion...' : 'Deconnexion'}
          </button>
        </div>
      </aside>
    </>
  )
}
