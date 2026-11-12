# Architecture

## Request flow

```
Browser (ES modules)
   │  fetch('/api/…', Bearer JWT)
   ▼
routes/            maps URL + HTTP verb to a controller, adds middleware
   ▼
middleware/        requireAuth → requireRole → validate → rate limit
   ▼
controllers/       reads the request, validates input, shapes the response
   ▼
services/          business rules (sign-up/login, AI chat, NPI lookup)
   ▼
models/            the only place SQL is written
   ▼
MySQL
```

Errors thrown anywhere (`utils/httpError.js`) are caught by `middleware/errorHandler.js` and returned as `{ "error": "message" }`.

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/signup` · `login` · `forgot` · `GET /me` · `GET /doctors` |
| Mood | `GET /api/mood?days=30` · `POST /api/mood` `{ score, tags, note }` |
| Check-in | `GET /api/assessments/questions` · `POST /api/assessments` · `GET /api/assessments` |
| Self-care | `GET/POST /api/reminders` · `PATCH/DELETE /api/reminders/:id` · `GET /api/tips` |
| Companion | `GET/POST/DELETE /api/chat` |
| Appointments | `GET /mine` · `GET /slots` · `POST /` · `PATCH /:id/cancel` (student) · `GET /inbox` · `PATCH /:id/accept│pending│reject` (doctor) |
| Doctor | `GET /api/doctor/caseload` · `GET /students/:id` · `POST /recommendations` |
| Admin | `GET /api/admin/overview` · `doctors` · `POST doctors/:id/approve│reject` · `npi-lookup` · `users` |
| Notifications | `GET /api/notifications` · `PATCH /read-all` · `PATCH /:id/read` |

## Frontend

The app is a hash-routed single page (`#/today`, `#/care`, …).

- `main.js` decides between the sign-in screen and the app shell, then loads the page module for the current route.
- `core/` holds the shared plumbing: `api.js` (fetch + token), `router.js`, `store.js` (user, theme, mood tint), `dom.js` (a tiny `h()` element builder) and `ui.js` (toasts, dialogs, drawers).
- `components/` are reusable widgets with no page knowledge: `moodOrb`, `garden`, `lineChart`, `heatmap`, `breathing`, `commandPalette`, `notificationBell`, `shell`.
- `pages/<role>/` has one file per screen. Each exports a `render…()` function that returns a DOM node.
- CSS is layered: `tokens` (colours, spacing, dark mode) → `base` → `components` → `layout` → `pages`.

## Scoring (`server/utils/scoring.js`)

8 questions × 0–3 points = 0–24. Questions 1–4 measure mood, 5–8 measure anxiety.

| Total | Result |
|---|---|
| 0–7 | mild |
| 8–15 | moderate |
| 16–24 | severe |

## Appointment slots

Half-hour slots from 09:00 to 16:30. A slot is "taken" while an appointment for that doctor, date and time is `requested`, `pending` or `accepted`. Cancelled or rejected requests free the slot.
