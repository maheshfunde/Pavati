# Billing Frontend

React + TypeScript + Vite frontend for the Spring Boot billing API.

## Stack

- React 19
- TypeScript 5.9
- Vite 7
- React Router 7
- TanStack Query 5
- Axios
- React Hook Form + Zod

## Prerequisites

Install Node.js 22 LTS (or newer) and npm.

## Run

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:8080`.

Optional API override:

```bash
cp .env.example .env
```

## Pages implemented

- `/login`
- `/register`
- `/app/dashboard`
- `/app/products`
- `/app/customers`
- `/app/bills`
- `/app/purchases`
- `/app/staff`

## Extra API features wired

- Bill invoice download (`/api/bills/{id}/invoice`)
- Bill search by customer name (`/api/bills/search`)
- Bill filter by status (`/api/bills/status`)
- Pending and reminder-eligible bill lists (`/api/bills/pending`, `/api/bills/reminders`)
- Reminder message + WhatsApp link (`/api/bills/{id}/reminder-message`, `/api/bills/{id}/whatsapp-link`)
- Customer-specific bills and ledger (`/api/customers/{id}/bills`, `/api/customers/{id}/ledger`)
- Staff creation (`/api/auth/create-staff`)
- Purchase entry (`/api/purchases`)

## Notes

- JWT token is stored in `localStorage` key `billing_token`.
- Protected routes redirect to `/login` when token is missing.
