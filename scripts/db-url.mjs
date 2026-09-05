/** Pin Neon-style sslmode so `pg` stops warning about require/prefer/verify-ca. */
export function resolveDatabaseUrl(url = process.env.DATABASE_URL) {
  if (!url) return url

  try {
    const parsed = new URL(url)
    const mode = parsed.searchParams.get('sslmode')
    if (mode === 'require' || mode === 'prefer' || mode === 'verify-ca') {
      parsed.searchParams.set('sslmode', 'verify-full')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

/** Direct (non-pooled) URL for migrations, dumps, and seed scripts. */
export function resolveAdminDatabaseUrl() {
  return resolveDatabaseUrl(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)
}
