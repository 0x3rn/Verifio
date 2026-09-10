<h1 align="center">
  <img src="public/logo.png" alt="Verifio" width="40" />
  <br/>
  Verifio
</h1>

<p align="center">
  <strong>OTP & Phone Verification Platform</strong><br/>
  SMS verification · Residential proxies · Rental phone numbers
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#project-structure">Structure</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#license">License</a>
</p>

---

## Overview

**Verifio** is a full-stack verification platform that provides disposable and rental phone numbers for receiving SMS codes, plus residential proxies. Built on **Next.js 16** with vanilla CSS (no utility frameworks), it integrates with provider APIs to provision real phone numbers across **100+ countries** for **50+ services** including Google, WhatsApp, Telegram, Facebook, Instagram, Discord, Microsoft, Apple, and more.

### Verification Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **SMS** | Receive OTP codes via text message | One-time account verifications |
| **Proxy** | Residential proxy access with managed credentials | Network access and privacy workflows |
| **Rental** | Dedicated number for days/weeks/months | Ongoing verification needs |

### Rental Plans

| Plan | Duration | Savings |
|------|----------|---------|
| Weekly | 7 days | — |
| Monthly | 30 days | 20% off |
| Quarterly | 90 days | 35% off |
| Biannual | 180 days | 42% off |

---

## Features

- 🔐 **Better Auth** — Database-backed username/email and password sessions
- 🎨 **Dark Mode** — System-preference-aware theme with localStorage persistence
- 📱 **Responsive Design** — Fully responsive across mobile, tablet, and desktop
- 🔍 **Search & Filter** — Search services/countries, filter orders by status/type
- 📋 **Order History** — View all past verification orders with codes
- 📞 **Rental Management** — Track rented numbers, view received SMS with timestamps
- 📊 **Dashboard** — Quick stats, balance overview, account management
- 🌍 **100+ Countries** — Phone numbers from virtually every country
- 🚀 **No CSS Framework** — Zero-dependency vanilla CSS with CSS custom properties

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Vanilla CSS (BEM methodology, CSS custom properties) |
| **Auth** | Better Auth (username/email and password, database-backed sessions) |
| **API** | SMSpool API for number provisioning |
| **Database** | Neon PostgreSQL with an auditable wallet ledger |
| **Deployment** | Vercel |

---

## Project Structure

```
verifio/
├── app/
│   ├── api/
│   │   ├── auth/me/route.ts        # GET — current signed-in profile
│   │   ├── orders/route.ts         # GET — fetch order history
│   │   ├── rentals/route.ts        # GET/DELETE — manage rentals
│   │   └── verify/
│   │       ├── sms/route.ts        # POST/GET/DELETE — SMS verification
│   ├── dashboard/
│   │   ├── page.tsx                # Dashboard home (new verification)
│   │   ├── orders/page.tsx         # Order history with filters
│   │   └── rentals/page.tsx        # Rental management with SMS viewer
│   ├── login/page.tsx              # Sign-in page
│   ├── register/page.tsx           # Registration page
│   ├── layout.tsx                  # Root layout (navbar + footer)
│   ├── page.tsx                    # Landing page
│   ├── providers.tsx               # Theme provider (light/dark)
│   └── globals.css                 # Global stylesheet (~1400 lines vanilla CSS)
├── components/
│   ├── Navbar.tsx                  # Responsive navigation with auth
│   ├── Footer.tsx                  # Site footer with links
│   └── Icons.tsx                   # SVG icon library (30+ icons)
├── lib/
│   ├── auth.ts                     # Better Auth session → Neon profile synchronization
│   ├── request-security.ts         # Origin validation and rate-limit keys
│   ├── neon.ts                     # Server-side Neon database client
│   ├── smspool.ts                  # SMSpool API client
│   ├── store.ts                    # In-memory data store
│   └── types.ts                    # TypeScript interfaces & constants
├── app/api/auth/[...all]/route.ts   # Better Auth request handler
├── vercel.json                     # Vercel deployment configuration
├── next.config.ts                  # Next.js configuration
└── tsconfig.json                   # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- SMSpool API key (register at [smspool.net](https://smspool.net))

### Installation

```bash
# Clone the repository
git clone https://github.com/0x3rn/Verifio.git
cd Verifio

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with the following:

```env
# Neon (use the pooled URL at runtime and the direct URL for migrations)
DATABASE_URL=your-neon-pooled-url
DIRECT_URL=your-neon-direct-url

# Better Auth
BETTER_AUTH_SECRET=generate-a-long-random-secret
BETTER_AUTH_URL=http://localhost:3001

# SMSpool API key
SMSPOOL_API_KEY=your-smspool-api-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

Before the first run, apply and verify the Neon schema:

```bash
npm run db:migrate
npm run db:check
npm run auth:check
npm run auth:test
```

Authentication is now owned by Better Auth. Existing accounts from the former
provider are not password-migrated; create new Better Auth accounts or perform
a deliberate account-recovery migration before production launch.

### Production Build

```bash
npm run build
npm start
```

---

## API Reference

All API routes are prefixed with `/api/`. Protected routes verify the active Better Auth session server-side and use its immutable user ID for Neon ownership checks.

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/auth/me` | Get current user | Yes |

### Verification

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/verify/sms` | Order an SMS verification number | Yes |
| `GET` | `/api/verify/sms?orderId=` | Check code status | Yes |
| `DELETE` | `/api/verify/sms?orderId=` | Cancel order | Yes |

### Orders & Rentals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/orders` | Fetch all orders | Yes |
| `GET` | `/api/rentals` | Fetch all rentals | Yes |
| `GET` | `/api/rentals?rentalId=&action=codes` | Fetch rental SMS codes | Yes |
| `DELETE` | `/api/rentals?rentalId=` | Cancel a rental | Yes |

---

## Deployment

This project is configured for **Vercel**. Deploy with a single command:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

### Production Checklist

1. Set all environment variables in Vercel dashboard
2. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` in Vercel
3. Set the Neon and Better Auth environment variables in Vercel
4. Run `npm run db:migrate` against the production Neon database before deploying
4. Enable HTTPS (automatic on Vercel)
5. Set up a custom domain

---

## Contributing

This is a proprietary project. Contributions are not accepted at this time.

---

## License

© 2026 Verifio. All rights reserved.

This software and its source code are proprietary and confidential. **Unauthorized copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited.** See the [LICENSE](./LICENSE) file for the full terms.
