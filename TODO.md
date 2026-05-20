# CRM Manager — To do

Living backlog for the **whole product** (not only Products). Check items off as you ship them.

**Constraints:** Neon ~**0.5 GB** — defer blob storage, media library, and large file uploads until you have more space or external object storage (S3/R2/Cloudinary).

**Related docs:** [README.md](README.md) · [DEPLOY.md](DEPLOY.md) (deploy checklist)

---

## Suggested order

Work top-down when unsure what to pick next:

1. [x] **Foundation** — DB stable, deploy path, RBAC basics (partial — see DEPLOY.md + SQL patch)
2. [x] **Saved views** — contacts / deals / leads (API + UI)
3. [x] **Automations v2** + deal webhooks on any PATCH (lead_created + deal.updated)
4. [ ] **Real email send** — drawer + sequences
5. [ ] **Reports & dashboard** — real metrics, not placeholders
6. [ ] **One integration depth** — HubSpot v2 *or* Stripe inbound
7. [ ] **RBAC + production hardening** — expand to more routes

---

## 1. Foundation & stability

- [ ] **Database fully synced** — run updated [`server/prisma/fix-bootstrap-columns.sql`](server/prisma/fix-bootstrap-columns.sql) (SavedView + Notification.linkPath + Product columns) or `npm run db:push` from `server/`
- [ ] **Bootstrap reliable** — sign-in loads workspace without Prisma P2022
- [x] **Deploy checklist** — [DEPLOY.md](DEPLOY.md)
- [x] **Document DB workflow** — README + `db:fix:bootstrap`
- [x] **RBAC middleware** — API keys + pipeline stages (admin/manager); invites already gated
- [ ] **E2E smoke tests** — Playwright: login → create deal → move stage → webhook fired

---

## 2. Sales CRM

| Item | Status |
|------|--------|
| Saved views & segments | [x] SavedView model + `/api/v1/saved-views` + contacts/deals/leads UI |
| Lead scoring on PATCH | [x] Already on `PATCH /leads/:id` |
| Deal webhooks on any PATCH | [x] `deal.updated` event |
| Lead webhooks on PATCH | [x] `lead.updated` event |
| Record drawer email | [ ] SMTP / Gmail |
| Custom fields on contacts/companies/leads | [ ] |
| Territories & multi-pipeline UI | [ ] |

### Small PRs (sales)

- [x] **Deal updated** webhook on generic PATCH
- [x] **Lead score** on PATCH (existing)
- [x] **Multi-step modals** — Products, Companies, Contacts, Deals

---

## 3. Work management

### Tasks & time

- [ ] Task dependencies / recurring — validate API + UX
- [ ] Time entries roll-up on Reports
- [x] Quick-create FAB — hidden on `/products` and when modals open

### Boards

- [x] Delete board cards (API existed; UI added)
- [ ] Edit card title / due date in UI
- [ ] Create / rename / delete board columns

### Goals & sprints

- [x] Sprint PATCH + DELETE API
- [ ] Sprint edit UI on Goals page
- [ ] Goal progress vs target

### Calendar

- [ ] Google / Outlook calendar ingest

---

## 4. Marketing & support

### Marketing

- [x] **Public form submit** — `POST /api/public/forms/:id/submit`
- [x] Marketing page shows submit URL + body shape
- [ ] Form builder UI
- [ ] Campaign attribution dashboard
- [ ] Email sequences scheduler

### Support

- [ ] Ticket assignee, SLA, drawer links
- [ ] NPS trends

### Products

- [x] Small image upload (2 MB data URL)
- [ ] Optional external image URL field alongside upload

---

## 5. Automations & integrations

- [x] **lead_created** trigger + starter rule + form submit hook
- [x] Deal stage automations notify with `/deals` link
- [ ] More triggers (task overdue, deal won)
- [ ] Automation builder UI for custom rules
- [ ] HubSpot sync v2, Stripe inbound, Gmail sync
- [ ] OpenAPI replacement

---

## 6. Collaboration & platform

- [x] Notification **linkPath** + bell deep links
- [ ] WebSockets for inbox
- [ ] Dashboard/reports hardening (pages exist; more metrics TBD)
- [ ] Audit log filters in Settings

---

## 7. Deferred (storage / scope)

- [ ] Media library, S3 uploads, large images in DB

---

## 8. Later

- [ ] Billing, AI copilot, PWA, i18n

---

## 9. UX & polish

- [x] Modals viewport-safe, centered, multi-step
- [x] FAB + delete confirm behavior
- [ ] Accessibility pass

---

## Done recently

- [x] Saved views API + server-backed filters (contacts, deals, leads)
- [x] Public marketing form submit → lead + notifications
- [x] `deal.updated` / `lead.updated` CRM events
- [x] `lead_created` automations
- [x] RBAC on API keys & pipeline edit
- [x] Sprint PATCH/DELETE, board card delete UI
- [x] Notification deep links
- [x] DEPLOY.md

---

*Last updated: May 2026*
