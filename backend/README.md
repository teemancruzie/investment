# Investment Platform — Backend API

Express + MongoDB REST API following an MVC architecture.

## Installation

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
npm run seed           # optional: admin user, categories, demo content
npm run dev            # http://localhost:5000
```

`npm start` runs the production server.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no | HTTP port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` |
| `MONGODB_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | Access token signing secret |
| `JWT_EXPIRES_IN` | no | Access token lifetime (default `7d`) |
| `JWT_REFRESH_SECRET` | no | Refresh token secret (falls back to `JWT_SECRET`) |
| `JWT_REFRESH_EXPIRES_IN` | no | Refresh token lifetime (default `30d`) |
| `CLIENT_URL` | no | Allowed CORS origin(s), comma separated |
| `UPLOAD_DIR` | no | Upload root folder (default `uploads`) |
| `MAX_UPLOAD_SIZE_MB` | no | Per-file upload limit (default `5`) |
| `EMAIL_PROVIDER` | no | `resend` or empty to log emails instead of sending |
| `EMAIL_API_KEY` | no | Provider API key |
| `EMAIL_FROM` | no | Sender address |

## Folder structure

```
backend/
├── config/        env loading and Mongo connection
├── controllers/   request handlers (thin, delegate to services)
├── middleware/    auth, validation, uploads, rate limits, errors
├── models/        Mongoose schemas and indexes
├── routes/        Express routers mounted under /api
├── services/      wallet, email and notification logic
├── uploads/       stored files (investments / team / avatars)
├── utils/         helpers: errors, responses, pagination, tokens, seed
├── validations/   express-validator rule sets
├── app.js         express app wiring
└── server.js      bootstrap + graceful shutdown
```

## Response format

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "total": 0 } }
```

Errors: `{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }`
with status `400`, `401`, `403`, `404`, `409`, `422` or `500`.

## API overview

Base path: `/api`

| Group | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/admin/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/change-password`, `GET /auth/me` |
| Users | `PATCH /users/profile`, `/users/preferences`, `/users/security`, `DELETE /users/me`; admin: `GET /users`, `GET /users/:id`, `PATCH /users/:id/status`, `PATCH /users/:id/role`, `DELETE /users/:id` |
| Investments | `GET /investments` (search, filter, sort, paginate), `GET /investments/:idOrSlug`, `GET /investments/mine/list`, `POST /investments/:id/invest`; admin: `POST /investments`, `PATCH /investments/:id`, `PATCH /investments/:id/archive`, `DELETE /investments/:id` |
| Categories | `GET /categories`; admin: `POST`, `PATCH /:id`, `DELETE /:id` |
| Dashboard | `GET /dashboard` |
| Wallet | `GET /wallet`, `POST /wallet/deposit`, `POST /wallet/withdraw` |
| Transactions | `GET /transactions` |
| Notifications | `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`; admin: `POST /notifications/broadcast`, `DELETE /notifications/:id` |
| Analytics | `GET /analytics/overview` (admin) |
| Content | `GET /content/testimonials|faqs|team|settings`; admin write equivalents and `PUT /content/settings` |
| Uploads | `POST /uploads/avatar`; admin: `POST /uploads/investment`, `/uploads/investment/gallery`, `/uploads/team` |
| Health | `GET /health` |

### Listing query parameters

`page`, `limit`, `sort` (`newest`, `oldest`, `return-desc`, `return-asc`, `min-asc`, `min-desc`, `funding-desc`),
`search`, `category`, `riskLevel`, `status`, `minReturn`, `maxReturn`, `minAmount`, `maxAmount`, `featured`.

## Security

JWT access/refresh tokens, bcrypt password hashing (cost 12), role-based authorization,
Helmet headers, CORS allow-list, `express-mongo-sanitize`, `hpp`, rate limiting
(20 auth requests / 15 min, 300 API requests / 15 min) and centralized error handling
that never leaks stack traces in production.

## Deployment

1. Provision MongoDB (Atlas or self-hosted) and set `MONGODB_URI`.
2. Set strong `JWT_SECRET` / `JWT_REFRESH_SECRET` values.
3. Set `CLIENT_URL` to your deployed frontend origin.
4. Run `npm ci --omit=dev` and `npm start` behind a reverse proxy (nginx, Caddy) with TLS.
5. Mount a persistent volume at `uploads/`, or swap `middleware/upload.js` for object storage.
