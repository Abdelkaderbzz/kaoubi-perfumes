// Run with: node scripts/create-admin.mjs
import { Pool } from 'pg'
import crypto from 'crypto'
import { promisify } from 'util'
import { resolveAdminDatabaseUrl } from './db-url.mjs'
import { loadEnv } from './load-env.mjs'

loadEnv()

const scrypt = promisify(crypto.scrypt)

const DATABASE_URL = resolveAdminDatabaseUrl()
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Set it in .env or pass it in the environment.')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

// Better Auth uses scrypt with N=16384, r=16, p=1 — same format: salt:hash (hex)
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password.normalize('NFKC'), salt, 64, {
    N: 16384,
    r: 16,
    p: 1,
    maxmem: 128 * 16384 * 16 * 2,
  })
  return `${salt}:${derivedKey.toString('hex')}`
}

const email = 'admin@kaoubi.tn'
const password = 'Admin2025!'
const name = 'Admin'

try {
  const existing = await pool.query('SELECT id FROM "user" WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id
    const hashedPassword = await hashPassword(password)
    const now = new Date()
    await pool.query(
      `UPDATE "account" SET password = $1, "updatedAt" = $2
       WHERE "userId" = $3 AND "providerId" = 'credential'`,
      [hashedPassword, now, userId],
    )
    console.log('✓ Admin password reset!')
    console.log('  Email:    ', email)
    console.log('  Password: ', password)
    console.log('  Login at: /admin/login')
    await pool.end()
    process.exit(0)
  }

  const userId = crypto.randomUUID()
  const accountId = crypto.randomUUID()
  const hashedPassword = await hashPassword(password)
  const now = new Date()

  await pool.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, name, email, true, 'admin', now, now]
  )

  await pool.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [accountId, userId, 'credential', userId, hashedPassword, now, now]
  )

  console.log('✓ Admin account created!')
  console.log('  Email:    ', email)
  console.log('  Password: ', password)
  console.log('  Login at: /admin/login')
} catch (err) {
  console.error('Error:', err.message)
} finally {
  await pool.end()
}
