# Deploy checklist

Use this when moving CRM Manager from local dev to production.

## Environment

| Variable | Where | Notes |
|----------|--------|--------|
| `DATABASE_URL` | `server/.env` | Neon connection string; add `?sslmode=require` if missing |
| `JWT_SECRET` | `server/.env` | 32+ random characters |
| `REFRESH_SECRET` | `server/.env` | 32+ random characters |
| `COOKIE_SECURE` | `server/.env` | **`true`** when the site uses HTTPS |
| `FRONTEND_URL` | `server/.env` | Public web origin, e.g. `https://app.example.com` |
| `API_URL` | `server/.env` | Public API origin, e.g. `https://api.example.com` |
| `VITE_API_URL` | project `.env` | Same as `API_URL` in prod, or empty if same host + reverse proxy |

## Database

1. Run schema sync when TCP works: `npm run db:push` from `server/`
2. If port **5432** is blocked: run `server/prisma/fix-bootstrap-columns.sql` in Neon SQL editor, or `npm run db:fix:bootstrap` from `server/`
3. Optional seed: `npm run db:seed` from `server/`

## Hosting (typical)

- **Frontend:** Vercel / Netlify / static host — build: `npm run build` from repo root
- **API:** Render / Railway / Fly — start: `npm run start --prefix server`
- **Database:** Neon (free tier ~0.5 GB — avoid large blobs in Postgres)

## After deploy

1. Sign in and confirm **bootstrap** loads (no Prisma column errors)
2. Test **invite link** and **SSO** callback URLs if enabled
3. Test **public catalog** and **public form submit** URLs if used externally

## Public endpoints (no auth)

- Product catalog: `GET {API_URL}/api/public/catalog/:token`
- Form submit: `POST {API_URL}/api/public/forms/:formId/submit` with JSON body `{ "values": { "email": "...", "company": "..." } }`
