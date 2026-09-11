# KAOUBI PERFUMES

Boutique de parfums a Douz, Kébili, Tunisie — Next.js storefront and admin dashboard.

Parfums inspires des grandes marques internationales et parfums de choix, de longue tenue, pour femmes et hommes.

## Stack

- Next.js 16 (App Router)
- PostgreSQL (Neon) + Drizzle ORM
- Better Auth (admin)
- Cloudinary (product images)
- Vercel (hosting)

## Getting Started

```bash
pnpm install
cp env.example .env
# Fill DATABASE_URL, BETTER_AUTH_SECRET, Cloudinary keys in .env
node scripts/migrate.mjs
pnpm seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin

```bash
node scripts/create-admin.mjs
```

Then sign in at `/admin/login`.
