# Phishion

Phishion is a phishing-analysis web application. Authenticated users submit URLs
to VirusTotal, view the reputation results, and have every scan associated with
their account. A SecurityTrails-backed endpoint supports domain / subdomain
discovery for reconnaissance.

> **For AI agents:** operational rules, coding conventions, the task-graph
> workflow, and the definition of done live in [`AGENTS.md`](./AGENTS.md). Read it
> before making changes. This README is the human-facing overview.

---

## Architecture

```
Browser (localhost:3000)  ->  Flask API (localhost:4000/api/*)  ->  PostgreSQL
                                                               \->  VirusTotal API
                                                               \->  SecurityTrails API
```

| Path | Responsibility |
|------|----------------|
| `backend/app.py` | Flask API, Google OAuth login, SQLAlchemy models (`User`, `Scan`), VirusTotal and SecurityTrails integrations. |
| `frontend/pages/` | Next.js 12 Pages Router entry points (`index`, `login`, `inspect`, `result`, `profile`, `logout`, `delete`). |
| `frontend/pages-sections/` | Feature UI + the client-side `fetch` calls to the API. |
| `frontend/components/`, `frontend/styles/` | Material UI 4 / Creative Tim component system. |
| `compose.yml` | `frontend`, `backend`, and PostgreSQL (`db`) services. |

Authentication uses a Flask session cookie. Any browser request that needs auth
**must** set `credentials: "include"`; the backend enables CORS with
`supports_credentials=True`.

### Data model

- `User` — `id`, `username` (unique), `email` (unique), `scans` (relationship).
- `Scan` — `id`, `user_id` (FK), `scanned_url`, `scanned_at`, `tags` (relationship).
- `ScanTag` — `id`, `user_id` (FK), `name` (unique per user), `color`.
- `URLWhitelist` — `id`, `user_id` (FK), `url_pattern`.
- `URLBlacklist` — `id`, `user_id` (FK), `url_pattern`, `reason`.
- `ScheduledScan` — `id`, `user_id` (FK), `url`, `frequency` (daily/weekly/monthly).
- `UserPreferences` — `id`, `user_id` (FK unique), `theme`, `timezone`, `email_notifications`, `scan_completion_notifications`, `daily_digest`.
- `APIUsage` — `id`, `user_id` (FK), `endpoint`, `method`, `status_code`, `timestamp`.

Users are provisioned on first Google login. Each user is limited to **5 scans
per calendar day** (enforced server-side in `/api/scan`).

---

## API reference

All routes are served under the backend root; user-specific routes require a
valid session cookie.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET`  | `/api` | no | Health / welcome message. |
| `GET`  | `/login/google` | no | Start Google OAuth flow. |
| `GET`  | `/callback/google` | no | OAuth callback; provisions user, sets session, redirects to the dashboard. |
| `POST` | `/api/logout` | session | Clear the session. |
| `GET`  | `/api/userinfo` | session | Return `{ username, email }` for the logged-in user. |
| `POST` | `/api/delete` | session | Delete the logged-in user's account. |
| `POST` | `/api/scan` | session | Submit a URL to VirusTotal (`{ "url": "..." }`), enforce the daily limit, persist the scan, return the analysis. |
| `POST` | `/api/batch-scan` | session | Submit multiple URLs at once (`{ "urls": [...] }`), max 10 per batch. |
| `GET`  | `/api/scans` | session | Get all scans for user. |
| `GET`  | `/api/scans/<id>` | session | Fetch a specific scan with full result. |
| `GET`  | `/api/scans/search` | session | Advanced search by URL, verdict, date range. |
| `GET`  | `/api/scans/<id>/compare/<id2>` | session | Compare two scans side-by-side. |
| `GET`  | `/api/scans/export/csv` | session | Export all scans as CSV file. |
| `GET`  | `/api/scans/export/json` | session | Export all scans as JSON file. |
| `POST` | `/api/scans/import` | session | Bulk import URLs from CSV/TXT file. |
| `POST` | `/api/tags` | session | Create a new tag for organizing scans. |
| `GET`  | `/api/tags` | session | List all tags for user. |
| `POST` | `/api/scans/<id>/tags/<tag_id>` | session | Add tag to a scan. |
| `POST` | `/api/whitelist` | session | Add URL pattern to whitelist. |
| `GET`  | `/api/whitelist` | session | List whitelisted URLs. |
| `DELETE` | `/api/whitelist/<id>` | session | Remove URL from whitelist. |
| `POST` | `/api/blacklist` | session | Add URL pattern to blacklist with optional reason. |
| `GET`  | `/api/blacklist` | session | List blacklisted URLs. |
| `POST` | `/api/scheduled-scans` | session | Create a scheduled scan (daily/weekly/monthly). |
| `GET`  | `/api/scheduled-scans` | session | List all scheduled scans. |
| `PUT` | `/api/scheduled-scans/<id>` | session | Update scheduled scan (toggle active, change frequency). |
| `DELETE` | `/api/scheduled-scans/<id>` | session | Delete a scheduled scan. |
| `GET`  | `/api/preferences` | session | Get user preferences (theme, timezone, notifications). |
| `PUT` | `/api/preferences` | session | Update user preferences. |
| `GET`  | `/api/analytics` | session | Get analytics dashboard data (stats, verdicts, threats). |
| `GET`  | `/api/api-usage` | session | Get user's API request history and usage stats. |
| `GET`  | `/api/domain/<hostname>` | session | Return SecurityTrails subdomains for a hostname. |

External calls (VirusTotal, SecurityTrails) run with request timeouts and
non-2xx handling; callers receive JSON with an explicit HTTP status code.

### Advanced Features (v2.0)

Phishion now includes 12 advanced features to enhance threat intelligence workflows:

1. **Batch URL Scanning** — Submit up to 10 URLs in a single request for efficient bulk scanning.
2. **URL Tagging & Labeling** — Organize scans with custom tags and colors for quick categorization.
3. **URL Whitelist/Blacklist** — Maintain personal whitelist and blacklist to skip or auto-flag URLs.
4. **Automated Scan Scheduling** — Set up daily, weekly, or monthly recurring scans for critical URLs.
5. **User Preferences & Settings** — Customize theme, timezone, and notification preferences.
6. **Advanced Analytics Dashboard** — View detailed statistics including threat distribution and completion rates.
7. **Advanced Search & Filtering** — Filter scans by date range, verdict, URL pattern, and threat level.
8. **Scan Result Comparison** — Compare two scans side-by-side to identify differences in vendor verdicts.
9. **Export Functionality** — Export scan history to CSV or JSON formats for reporting and analysis.
10. **Bulk URL Import** — Import multiple URLs from CSV or TXT files to queue for scanning.
11. **Email Notifications** — Get notified when scans complete (configurable in preferences).
12. **API Usage Tracking** — Monitor API request history and usage statistics.

### UI/UX Overhaul (v2.1)

The five feature pages shipped in v2.0 originally used Tailwind CSS classes and a
non-installed `@mui/material` v5 import path — neither works in this project,
which only ships `@material-ui/core` v4. All pages were rewritten to the
project's actual Material-UI v4 / Creative Tim component system, and 12 new
UI/UX improvements were added on top:

1. **Unified Tools navigation** — a "Tools" dropdown in the header links every
   feature page (History, Batch Scan, Bulk Import, Compare, Search, Analytics,
   Scheduled Scans, Manage, Settings) so they're actually reachable.
2. **Global toast notifications** — `context/NotificationContext.js` replaces
   scattered inline `message` state with a consistent `useNotify()` API.
3. **Confirmation dialogs** — `components/ConfirmDialog/ConfirmDialog.js` guards
   destructive actions (delete whitelist entry, delete scheduled scan).
4. **Fixed unguarded account deletion** — `pages/delete.js` previously deleted
   the account immediately on page load with no confirmation; it now requires
   an explicit click.
5. **Dark mode toggle** — `context/ThemeContext.js` drives a real MUI palette
   switch, persisted to `localStorage` and synced with `/api/preferences`.
6. **SVG donut chart** — verdict distribution on the Analytics page is now a
   real chart instead of plain divs, with no new dependency.
7. **Batch Scan UI** (`pages/batch.js`) — frontend for the batch-scan API.
8. **Compare UI** (`pages/compare.js`) — frontend for the scan comparison API.
9. **Bulk Import UI** (`pages/import.js`) — drag-and-drop CSV/TXT upload.
10. **Pagination** — `lib/usePagination.js` + the existing `Pagination`
    component are now wired into History and Search results.
11. **Tag chips & quick actions** — History rows show tag chips and inline
    whitelist/blacklist buttons.
12. **Loading and empty states** — `components/LoadingBar` and
    `components/EmptyState` replace bare "Loading..." text across every
    data-fetching page.

Also fixed: `node_modules` was out of sync with `package.json` (missing
`@material-ui/*` entirely); `frontend/package.json` was missing a `lint`
script and the `eslint` / `eslint-config-next` devDependencies its own
`.eslintrc.json` requires. Both are now in place and `npm run build` passes
cleanly with linting enabled.

> **Known gap:** `jest` and `@playwright/test` are referenced by
> `jest.config.js`, `playwright.config.js`, and the existing test files but are
> not yet in `package.json`. `npm test` and `npm run test:e2e` will not run
> until those are added — tracked as follow-up work, not fixed in this round.

---

## Runtime contracts

### Backend environment variables (required)

- `DATABASE_URL`
- `SECRET_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `VIRUSTOTAL_API_KEY`
- `SECURITYTRAILS_API_KEY`

### PostgreSQL environment variables (required by Compose)

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

### Frontend configuration

- `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- `NEXT_PUBLIC_BACKEND_NAME` (default `api`)
- `FRONTEND_PORT` (optional Compose host port; default `3000`)

> Never hardcode credentials, database passwords, API keys, or OAuth secrets.
> `.env*` files are git-ignored and must not be read or committed.

---

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev      # dev server on :3000
npm run build    # production build (required to pass before shipping)
```

### Backend (use a virtual environment)

```bash
python -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
export PYTHONPATH=backend
.venv/bin/flask --app app:app db upgrade  # Apply database migrations
.venv/bin/flask --app app:app run --port=4000
```

### Full stack

```bash
docker compose up --build
```

---

## Verification

The frontend `npm test` command is still a placeholder. Before declaring work
done, run the backend unit tests, syntax checks, and frontend production build:

```bash
python -m unittest discover -s backend/tests -v
python -m py_compile backend/app.py backend/validators.py
cd frontend && npm run build            # frontend production build
```

Add focused tests alongside new behaviour when practical.

---

## Contributing

- Inspect `git status` and the relevant diff before editing; preserve
  pre-existing uncommitted changes.
- Keep API responses JSON with explicit HTTP status codes.
- Validate request data before any database or network operation.
- Add timeouts and handle non-2xx responses for every external HTTP call.
- Do not commit or push without explicit approval.

See [`AGENTS.md`](./AGENTS.md) for the full task-graph workflow and definition of
done.
