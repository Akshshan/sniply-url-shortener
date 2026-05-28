# Sniply — URL Shortener

A full-stack URL Shortener web application built with React, Node.js, Express, and MongoDB.
Features JWT authentication, click analytics, QR code generation, custom aliases, and link expiry.

---

## Demo Video

🎬 **[Click here to watch the full demo on Loom/YouTube](https://www.loom.com/share/afe016e4963442c58a052aa0acc24e48)**

---

## AI Planning Document

### Step 1 — Planning the App

This application was planned and built using **Claude AI (claude.ai)** as the primary code
generation tool. The development followed a structured workflow:

1. **Requirement Analysis** — Read the hackathon problem statement carefully and identified
   all mandatory and bonus features required.

2. **Tech Stack Decision**
   - Frontend: React + Vite + Tailwind CSS (fast, modern, responsive)
   - Backend: Node.js + Express (lightweight REST API)
   - Database: MongoDB + Mongoose (flexible document storage)
   - Auth: JWT + bcryptjs (stateless, secure)
   - Short codes: nanoid (URL-safe unique IDs)
   - Charts: Recharts (React-native charting)
   - QR Code: qrcode npm package (server-side generation)

3. **Database Modeling**
   - `User` — name, email, bcrypt-hashed password
   - `Url` — originalUrl, shortCode, user reference, expiresAt, totalClicks
   - `Click` — url reference, ipAddress, userAgent, clickedAt timestamp

4. **API Design** — REST endpoints planned before coding:
   - Auth: signup, login, get profile
   - URLs: create, list, delete, QR code
   - Analytics: summary with 7-day aggregation, paginated clicks
   - Redirect: server-side `GET /:shortCode`

5. **Frontend Pages Planned**
   - Login, Signup, Dashboard, Analytics

6. **Code Generation** — Used Claude AI to generate all 23 files one by one in a
   structured order (backend first, then frontend), then debugged and fixed issues
   during local setup and testing.

---

### Step 2 — Feature List

#### Mandatory Features
| Feature | Implementation |
|---------|---------------|
| User Signup & Login | JWT + bcryptjs, POST /api/auth/signup & /login |
| Protected dashboard routes | React ProtectedRoute + JWT middleware |
| Each user manages own URLs | All queries filtered by `user: req.user.id` |
| Submit long URL → get short URL | POST /api/urls/ with nanoid short code |
| Unique short code | nanoid(8) + MongoDB unique index |
| Clicking short URL redirects | Server-side GET /:shortCode → 302 redirect |
| Validate URL before shortening | Built-in URL constructor validation |
| View all created short URLs | GET /api/urls/ filtered by logged-in user |
| Show original URL, short URL, date, clicks | URLCard component on Dashboard |
| Delete a shortened URL | DELETE /api/urls/:id + cascade delete clicks |
| Copy short URL from UI | Clipboard API + toast notification |
| Count clicks per short URL | Click model + totalClicks counter on Url |
| Record timestamp of each visit | clickedAt field in Click model |
| Analytics page per URL | GET /api/analytics/:shortCode |
| Total click count | Stored in Url.totalClicks |
| Last visited time | Url.lastClickedAt updated on redirect |
| Recent visit history | Last 10 Click documents |
| Responsive interface | Tailwind CSS responsive classes |
| Loading, success, error states | Skeletons, toasts, error banners |
| Form validation messages | Client-side + server-side validation |

#### Bonus Features Implemented
| Bonus Feature | Implementation |
|---------------|---------------|
| Custom alias | Optional customAlias field, validated & checked for uniqueness |
| QR code generation | GET /api/urls/:id/qr → qrcode npm → base64 PNG |
| Expiry date for links | expiresAt field → 410 Gone if expired |
| Charts for daily click trends | Recharts AreaChart with 7-day MongoDB aggregation |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│              React 18 + Vite + Tailwind CSS                  │
│                                                              │
│   ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│   │  Login   │  │  Signup  │  │ Dashboard │  │ Analytics │ │
│   └──────────┘  └──────────┘  └───────────┘  └───────────┘ │
│                                                              │
│   AuthContext (JWT stored in localStorage)                   │
│   Axios instance (auto-attaches JWT to every request)        │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP REST API
                        │ Authorization: Bearer <JWT>
┌───────────────────────▼──────────────────────────────────────┐
│                  EXPRESS SERVER (Node.js)                    │
│                     localhost:5000                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Middleware Layer                        │    │
│  │   CORS  │  JSON Parser  │  JWT Auth (protect)       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  /api/auth/*      →  routes/auth.js                         │
│  /api/urls/*      →  routes/url.js                          │
│  /api/analytics/* →  routes/analytics.js                    │
│  /:shortCode      →  Redirect handler (server.js)           │
└───────────────────────┬──────────────────────────────────────┘
                        │ Mongoose ODM
┌───────────────────────▼──────────────────────────────────────┐
│                       MONGODB                                │
│                                                              │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │    users    │  │       urls       │  │    clicks     │  │
│  │─────────────│  │──────────────────│  │───────────────│  │
│  │ name        │  │ originalUrl      │  │ url (ref)     │  │
│  │ email       │  │ shortCode        │  │ ipAddress     │  │
│  │ password    │  │ user (ref)       │  │ userAgent     │  │
│  │ (bcrypt)    │  │ totalClicks      │  │ clickedAt     │  │
│  │             │  │ expiresAt        │  │               │  │
│  └─────────────┘  └──────────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## How It Works

1. **Auth flow** — User signs up or logs in. The backend hashes the password with bcrypt,
   issues a signed JWT, and returns it. The frontend stores the JWT in `localStorage`.
   Every subsequent API request automatically attaches it via the Axios request interceptor.
   On page refresh, `AuthContext` calls `GET /api/auth/me` to rehydrate the session.

2. **URL shortening** — The frontend sends the long URL (plus optional alias/expiry) to
   `POST /api/urls/`. The backend validates the URL, generates a unique 8-character short
   code via `nanoid` (or uses the custom alias), and saves the document to MongoDB.

3. **Redirect** — When someone visits `http://localhost:5000/:shortCode`, the Express server
   looks up the short code, checks expiry, records a `Click` document, increments
   `totalClicks`, and issues a `302` redirect to the original URL. The frontend is never
   involved in redirects.

4. **Analytics** — `GET /api/analytics/:shortCode` runs a MongoDB aggregation pipeline to
   count clicks per day for the last 7 days, fetches the 10 most recent click events, and
   returns everything in one response. The frontend renders the data with a Recharts
   `AreaChart`.

5. **QR Code** — `GET /api/urls/:id/qr` uses the `qrcode` npm package to generate a
   base64-encoded PNG data URL on the server and returns it to the frontend for display
   and download.

---

## Features

- **Authentication** — Signup / Login with JWT, bcrypt-hashed passwords, protected routes
- **URL Shortening** — Unique short code via nanoid, URL validation, server-side redirect
- **Custom Alias** — User can provide an optional custom short code
- **Expiry Date** — Optional expiry; expired links return `410 Gone`
- **Dashboard** — All user URLs with original URL, short URL, date, click count, copy, delete
- **Analytics** — Total clicks, last visited, recent visit history, 7-day line chart
- **QR Code** — Generate and download QR code PNG for any short URL
- **Responsive UI** — Mobile-friendly, loading skeletons, error states, success toasts,
  form validation

---

## Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Router v6     |
| Charts     | Recharts (AreaChart)                              |
| HTTP       | Axios (with request/response interceptors)        |
| Backend    | Node.js, Express                                  |
| Database   | MongoDB, Mongoose                                 |
| Auth       | JWT (jsonwebtoken), bcryptjs                      |
| Short Code | nanoid                                            |
| QR Code    | qrcode (npm)                                      |

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── models/
│   │   ├── User.js           # User schema (bcrypt password hashing)
│   │   ├── Url.js            # Short URL schema (nanoid code generation)
│   │   └── Click.js          # Click event schema (analytics tracking)
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/signup, /login, GET /me
│   │   ├── url.js            # CRUD for short URLs + QR code generation
│   │   └── analytics.js      # Per-URL analytics + daily click aggregation
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── server.js             # Express entry point + redirect handler
│   └── .env.example          # Environment variable template
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js          # Pre-configured Axios (auto JWT attach)
        ├── context/
        │   └── AuthContext.jsx   # Global auth state (login, logout, rehydrate)
        ├── pages/
        │   ├── Login.jsx         # Login form with validation
        │   ├── Signup.jsx        # Signup form with password strength meter
        │   ├── Dashboard.jsx     # URL list, create form, search, stats
        │   └── Analytics.jsx     # Per-URL stats, line chart, click history
        ├── components/
        │   ├── Navbar.jsx        # Top nav with user info + logout
        │   ├── URLCard.jsx       # URL card (copy, QR, analytics, delete)
        │   └── ClickChart.jsx    # Recharts area chart (7-day clicks)
        ├── App.jsx               # React Router + protected routes
        ├── main.jsx              # React app entry point
        └── index.css             # Tailwind CSS directives
```

---

## Prerequisites

- **Node.js** v18 or higher — https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** — either:
  - Local: https://www.mongodb.com/try/download/community
  - Cloud (free): https://cloud.mongodb.com

---

## Setup & Installation

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/url-shortener.git
cd url-shortener
```

### Step 2 — Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```bash
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/url-shortener
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

> Generate a strong JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### Step 3 — Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Sniply
```

---

## Running the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# ✅ MongoDB connected successfully
# 🚀 Server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# ➜ Local: http://localhost:5173/
```

Open browser → **http://localhost:5173**

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | `/api/auth/signup` | No   | Register a new user      |
| POST   | `/api/auth/login`  | No   | Login and receive JWT    |
| GET    | `/api/auth/me`     | Yes  | Get current user profile |

### URLs — `/api/urls`

| Method | Endpoint           | Auth | Description                   |
|--------|--------------------|------|-------------------------------|
| POST   | `/api/urls/`       | Yes  | Create a new short URL        |
| GET    | `/api/urls/`       | Yes  | Get all URLs for current user |
| DELETE | `/api/urls/:id`    | Yes  | Delete URL and its clicks     |
| GET    | `/api/urls/:id/qr` | Yes  | Generate QR code PNG          |

### Analytics — `/api/analytics`

| Method | Endpoint                          | Auth | Description                  |
|--------|-----------------------------------|------|------------------------------|
| GET    | `/api/analytics/:shortCode`       | Yes  | Full analytics for one URL   |
| GET    | `/api/analytics/:shortCode/clicks`| Yes  | Paginated click history      |

### Redirect

| Method | Endpoint      | Auth | Description                        |
|--------|---------------|------|------------------------------------|
| GET    | `/:shortCode` | No   | Server-side redirect to origin URL |

---

## Assumptions

1. **Single-user ownership** — Each URL belongs to one user. Users only see and manage their own URLs.
2. **Server-side redirects** — All redirects happen on the Express server. React frontend is never involved.
3. **Click tracking** — Every redirect is recorded as a `Click` document. IPs are masked in the UI for privacy.
4. **No email verification** — Users are immediately active after signup. Out of scope for this build.
5. **No rate limiting** — Not implemented. Recommended before production deployment.
6. **nanoid short codes** — 8-character URL-safe codes. Collision probability is negligible at hackathon scale.
7. **MongoDB Atlas or local** — Works with either. Just update `MONGO_URI` in `.env`.
8. **JWT in localStorage** — Simple approach for hackathon. Production apps should use `httpOnly` cookies.

---

## Quick Start (TL;DR)

```bash
# Terminal 1 — Backend
cd backend && npm install && cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && cp .env.example .env
npm run dev

# Open → http://localhost:5173
```

---

This project is a part of a hackathon run by https://katomaran.com