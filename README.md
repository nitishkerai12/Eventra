# Eventra - Event Discovery and Booking

Eventra is a full-stack event booking application. The React/Vite client talks
to an Express API backed by MongoDB. Account verification and booking requests
use email OTPs delivered over SMTP.

## Features

- Browse and search events, see event details, prices, dates, and seat counts.
- Register, verify an account by email OTP, and sign in with JWT authentication.
- Verify event booking requests with an email OTP.
- View and cancel bookings from the user dashboard.
- Create and manage events, review booking requests, and confirm bookings from
  the admin dashboard.
- Receive an email when a booking is confirmed.

## Requirements

- Node.js 20.19+ or 22.12+ and npm.
- A reachable MongoDB instance, such as MongoDB Atlas.
- An SMTP account. For Gmail, use an App Password, not your account password.

## Configure the backend

Copy `server/.env.example` to `server/.env` and set the values for your
environment. Keep real credentials in `.env`; never commit or share them.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `5000`. |
| `MONGODB_URI` | MongoDB connection string (`MONGO_URI` is also accepted). |
| `MONGODB_DNS_SERVERS` | Optional comma-separated DNS servers used if system DNS cannot resolve MongoDB SRV records. |
| `JWT_SECRET` | Secret used to sign login tokens. |
| `SMTP_HOST` | SMTP server; defaults to `smtp.gmail.com`. |
| `SMTP_PORT` | SMTP port; defaults to `465`. |
| `SMTP_SECURE` | Use implicit TLS; defaults to `true` for port `465`. |
| `EMAIL_USER` | SMTP account username and sender address. |
| `EMAIL_PASS` | SMTP password or provider app password. |

For Gmail, enable 2-Step Verification and create an App Password in
[Google Account security settings](https://myaccount.google.com/apppasswords).
Spaces in the generated password can be omitted.

The API connects to MongoDB and verifies SMTP before it starts listening. A
startup error means one of these required services could not be reached or
authenticated; check the API terminal and the environment values. Once running,
`http://localhost:5000/api/health` reports the database connection status.

## Install and run locally

From the project root, install the root process runner and both applications:

```powershell
npm install
npm run install:all
```

Then start the frontend and backend together:

```powershell
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). The Vite dev server
proxies `/api` requests to `http://localhost:5000`. To use a different API URL,
set `VITE_API_URL` in `clients/.env.local` and restart Vite.

Alternatively, start the API and frontend separately in two terminals:

```powershell
cd server
npm install
npm run dev
```

```powershell
cd clients
npm install
npm run dev
```

## Create the first administrator

Register and verify a normal account. In MongoDB Compass or a trusted MongoDB
shell, update that account's document in the `users` collection to set `role`
to `admin`. Sign out and sign back in. Public registration cannot assign
administrator roles.

## Commands

Run these from the project root unless otherwise indicated:

| Command | Description |
| --- | --- |
| `npm run dev` | Start API and Vite together. |
| `npm run build` | Build the production frontend. |
| `npm run lint` | Run ESLint on the frontend. |
| `npm start` | Start the API and Vite preview (build first). |
| `cd server; npm run dev` | Start only the API with automatic restarts. |
| `cd clients; npm run preview` | Preview a production build. |

## Deploy to Render

The repository includes a Render Blueprint in `render.yaml` for a single web
service. Create a Blueprint from the repository and provide `MONGODB_URI`,
`EMAIL_USER`, and `EMAIL_PASS` in the service environment. Render generates
`JWT_SECRET`. The build creates the client bundle; Express serves that bundle
and the API from the same origin. Confirm `/api/health` reports both services
connected before testing OTP delivery. If the host blocks outbound SMTP, use a
provider or relay allowed by its network policy.

## API routes

- `/api/health` — report whether the database is connected.
- `/api/auth` — registration, login, and account verification.
- `/api/events` — list, view, create, update, and delete events.
- `/api/bookings` — request booking OTPs, create and manage bookings, and
  confirm bookings as an administrator.

## Troubleshooting

- **API does not start:** check that MongoDB is reachable, SMTP credentials are
  valid, and the configured port is available.
- **No events appear:** check `/api/health` and create events from an admin
  account; an empty event list is normal for a new database.
- **OTP email is not delivered:** check SMTP authentication, the provider's
  outbound SMTP policy, and the API terminal.
- **Blank page:** check the browser console and confirm Vite finished starting.
- **Port 5173 is in use:** open the alternate URL printed by Vite.
