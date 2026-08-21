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
- `Scan` — `id`, `user_id` (FK), `scanned_url`, `scanned_at`.

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
| `GET`  | `/api/scan/<url_id>` | session | Fetch a previously submitted VirusTotal analysis by id. |
| `GET`  | `/api/domain/<hostname>` | session | Return SecurityTrails subdomains for a hostname. |

External calls (VirusTotal, SecurityTrails) run with request timeouts and
non-2xx handling; callers receive JSON with an explicit HTTP status code.

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
FLASK_APP=backend/app.py .venv/bin/flask run --port=4000
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
