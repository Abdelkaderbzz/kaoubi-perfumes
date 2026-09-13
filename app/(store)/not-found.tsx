import Link from 'next/link'
import { getRequestDictionary } from '@/lib/i18n/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary()

  return {
    title: dictionary.meta.notFoundTitle,
    description: dictionary.meta.notFoundDescription,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default async function StoreNotFound() {
  const { dictionary } = await getRequestDictionary()

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-medium tracking-[0.22em] text-primary">404</p>
      <h1 className="mt-3 font-serif text-3xl tracking-wide text-foreground">
        {dictionary.meta.notFoundTitle}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {dictionary.meta.notFoundDescription}
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-[11px] font-medium tracking-[0.2em] uppercase transition-colors hover:border-primary hover:text-primary"
      >
        {dictionary.meta.notFoundCta}
      </Link>
    </div>
  )
}
