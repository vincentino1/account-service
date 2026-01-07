# account-service

Node.js/Express service written in TypeScript for managing accounts.

## Prereqs
- Node 18+
- Postgres reachable from your machine

## Configure
Copy env template:

```bash
cp .env.example .env
```

Update DB settings as needed.

## Database
This service expects an `account` table containing at least:
- `id`
- `email`
- `name`
- `phone_number` (nullable)
- `date_of_birth` (nullable)
- `password_hash`
- `created_at`
- `updated_at`

A migration is provided at `db/migrations/001_add_phone_dob.sql`.

### Token revocation table (for logout)
Logout is implemented via a simple token blocklist table:

```sql
CREATE TABLE IF NOT EXISTS token_blocklist (
  jti text PRIMARY KEY,
  revoked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
```

## Run

```bash
npm install
npm run dev
```

Health check:

```bash
curl -s http://localhost:3001/health
```

## API

### Health
- `GET /health`

### Accounts
- `GET /accounts/:id`
- `POST /accounts`

`POST /accounts` body:

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "phoneNumber": "+15555550123",
  "dateOfBirth": "1990-01-01",
  "password": "a-strong-password"
}
```

### Authentication
- `POST /auth/login`
- `POST /auth/logout`

`POST /auth/login` body:

```json
{
  "email": "user@example.com",
  "password": "a-strong-password"
}
```

Response:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer"
}
```

`POST /auth/logout` body:

```json
{
  "token": "<jwt>"
}
```

Returns `204`.

### Profile / Account Management
Auth: `Authorization: Bearer <token>`

- `GET /profile/me`
- `PATCH /profile/me`
- `POST /profile/change-password`

`PATCH /profile/me` body:

```json
{ "name": "New Name", "phoneNumber": "+15555550999", "dateOfBirth": "1999-12-31" }
```

`POST /profile/change-password` body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-123"
}
```

Returns `204`.
