# CRM Manager

A React **revenue + work operating system** inspired by Monday.com, ClickUp, and HubSpot — with a **PostgreSQL-backed API**, JWT session cookies, OIDC SSO, webhooks, and API keys for integrations.

---

## Architecture

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind 4, React Router 7 |
| **API** | Express, Prisma, PostgreSQL, Zod validation |
| **Auth** | Email/password, refresh tokens (httpOnly cookies), Google / Microsoft / OIDC SSO |
| **Integrations** | Webhooks (signed delivery), API keys (`crm_…`), integration toggles per org |

```
Browser (5173) ──proxy──► API (3001) ──► PostgreSQL (5432)
                /api/*              Prisma
```

---

## Quick start (full stack)

**Prerequisites:** Node 20+

### Database: pick one

| Option | Best for |
|--------|----------|
| **[Neon](https://neon.tech)** (free) | Testing without Docker — recommended |
| **[Supabase](https://supabase.com)** (free) | Same; also gives a dashboard |
| **Docker** `npm run db:up` | Local Postgres when Docker Desktop is installed |

#### Free cloud DB (no Docker) — ~2 minutes

1. Sign up at [neon.tech](https://neon.tech) (or [supabase.com](https://supabase.com) → New project).
2. Copy the **PostgreSQL connection string** (Neon: use the **direct** / non-pooled URL for setup).
3. Paste into `server/.env` as `DATABASE_URL`. Add `?sslmode=require` at the end if the string doesn’t include SSL params.
4. Set `JWT_SECRET` and `REFRESH_SECRET` (any long random strings, 32+ chars).

```bash
npm install
npm run db:setup       # creates tables + demo user (no db:up needed)
npm run dev
```

**Port 5432 blocked?** (common on school/work Wi‑Fi) Use Neon over HTTPS instead:

```bash
npm run db:setup:neon
npm run dev
```

```bash
npm install
npm run db:up          # only if using Docker
cp .env.example server/.env
npm run db:setup
npm run dev            # web :5173 + API :3001
```

1. Open [http://localhost:5173](http://localhost:5173)
2. Sign in with **admin@crm.local** / **demo1234** (after seed), or register a new org
3. Use **⌘K** / **Ctrl+K** for navigation

### Invite teammates

Admins and managers can invite users from **Settings → Team**:

1. Enter email and role, click **Send invite**
2. Copy the invite link and share it (valid 7 days)
3. The invitee opens the link, sets a password (or signs in if they already have an account), and joins your workspace

Invite links use `FRONTEND_URL` in `server/.env` (default `http://localhost:5173`). After pulling invite changes, apply the schema:

```bash
npm run db:setup:neon   # or npm run db:push --prefix server && npx prisma generate --prefix server
```

### SSO (optional)

Set credentials in `server/.env`:

| Provider | Variables |
|----------|-----------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Microsoft | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` |
| Generic OIDC | `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` |

Redirect URIs must point at your API host, e.g. `http://localhost:3001/api/auth/sso/google/callback`.

### Programmatic API access

1. Sign in → **Settings → Security** → create an API key (shown once).
2. Call endpoints with `Authorization: Bearer crm_…` or header `X-API-Key: crm_…`.
3. Discover routes: `GET /api/v1/openapi` (stub) or see `server/src/routes/v1/index.ts`.

Core routes: `GET /api/v1/bootstrap`, CRUD for contacts/deals/companies/leads/tasks, activities, comments, webhooks, integrations, preferences.

---

## What’s implemented

### Phase 1–2 — Product UI (complete)

16 routed pages, record drawer, command palette, dark mode, CSV import/export, automations UI, marketing/support modules, reports, boards with multiple views, and a rich `CrmState` model.

### Phase 3 — Platform (current)

- [x] **PostgreSQL** + Prisma multi-tenant `Organization` model
- [x] **REST API** `/api/v1/*` with org-scoped data
- [x] **Bootstrap** endpoint returns full workspace state for the React app
- [x] **JWT auth** + refresh rotation (cookies)
- [x] **Register** new organization (pipeline + default stages created)
- [x] **SSO** Google, Microsoft Entra ID, generic OIDC (`openid-client`)
- [x] **Webhooks** with HTTP dispatch on contact/deal events
- [x] **API keys** for machine-to-machine access
- [x] **Audit log** on server for key mutations
- [x] **Docker Compose** for local Postgres
- [x] **Vite proxy** so the SPA uses same-origin `/api` in dev

Some UI actions still optimistically update or reload bootstrap only; extend `server/src/routes/v1` for tickets, automations, custom fields, etc. as you build out.

---

## Routes (app)

| Path | Page |
|------|------|
| `/login` | Sign in / register / SSO |
| `/` | Dashboard |
| `/contacts` | Contacts |
| `/leads` | Leads |
| `/companies` | Companies |
| `/deals` | Deals |
| `/tasks` | Tasks |
| `/boards` | Boards |
| `/calendar` | Calendar |
| `/goals` | Goals |
| `/reports` | Reports |
| `/automations` | Automations |
| `/marketing` | Marketing |
| `/support` | Support |
| `/inbox` | Inbox |
| `/docs` | Documents |
| `/settings` | Settings (incl. API keys & SSO status) |

---

## Project structure

```
CRM-Manager/
├── src/                      # React SPA
│   ├── context/
│   │   ├── CrmContext.tsx      # Types + hooks export
│   │   └── CrmProviderApi.tsx  # API-backed state
│   └── lib/api/client.ts       # Fetch client
├── server/
│   ├── prisma/schema.prisma    # Data model
│   ├── src/routes/auth.ts      # Login, SSO, refresh
│   └── src/routes/v1/          # CRM REST API
├── docker-compose.yml          # Postgres
└── .env.example
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Web + API concurrently |
| `npm run dev:web` | Vite only |
| `npm run dev:api` | API only |
| `npm run build` | Build server + SPA |
| `npm run db:up` | Start Postgres container |
| `npm run db:setup` | Push schema + seed demo org |

---

## Roadmap (build upon)

| Area | Next steps |
|------|------------|
| Email / calendar | Gmail & Microsoft Graph OAuth, sync jobs |
| Files | S3-compatible object storage for attachments |
| Real-time | WebSockets for inbox and presence |
| Automations | Server-side rule engine (today: partial UI + seed data) |
| Billing | Seats / plans per organization |
| AI | Replace heuristics with LLM via your provider of choice |

---

## License

MIT — see [LICENSE](LICENSE).
