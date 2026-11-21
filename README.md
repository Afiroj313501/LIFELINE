# LifeLine — Emergency Blood & Donor Network (জীবনরেখা)

[![CI Build](https://img.shields.io/badge/Build-Passing-emerald.svg)]()
[![Tests](https://img.shields.io/badge/Vitest-33%20Passed-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)]()
[![Prisma](https://img.shields.io/badge/Prisma-6.x-indigo.svg)]()
[![License](https://img.shields.io/badge/License-MIT-slate.svg)]()

> A verified, real-time emergency blood donation network and geospatial radar connecting critical patients with compatible donors across all 8 administrative divisions and 64 districts in Bangladesh.

---

## Key Features

* **Deterministic State Machine:** Manages emergency blood requests through verified lifecycle stages: `PENDING` &rarr; `UNDER_REVIEW` &rarr; `VERIFIED` &rarr; `BROADCASTING` &rarr; `DONOR_RESPONDED` &rarr; `FULFILLED`. Prevents panic spam and duplicate requests.
* **Clinical RBC Compatibility:** Automated verification adhering to WHO clinical transfusion matrix (e.g. $O^-$ universal donor, $AB^+$ universal recipient) to guarantee only medically safe donors can pledge.
* **Zero-Trust Privacy:** Donor contact details and exact residences are never publicly exposed. Mutual verified consent discloses the donor's contact phone number to the hospital/requester only upon confirmed pledge.
* **Interactive Emergency Map Radar:** Interactive Leaflet geospatial map featuring:
  * Automatic direct browser GPS location detection upon opening.
  * Dedicated **"My Direct Location"** button with a pulsating radar pin.
  * Turn-by-turn directions via **Direct Google Maps** integration for every hospital.
* **Live Donor Discovery:** Real-time volunteer directory filtering by blood group and administrative hierarchy (Division, District, Upazila).
* **Real-Time Notification Gateway:** Socket.IO v4 notification pipeline broadcasting regional emergency triage alerts.

---

## System Architecture

```
                          +------------------------------------------+
                          |        LifeLine Client (React + Vite)    |
                          |  - Leaflet Emergency Map with Direct GPS |
                          |  - Emergency Feed & Triage Cards         |
                          |  - Compatible Donor Discovery Directory  |
                          +------------------------------------------+
                                               |
                                               | HTTPS / WSS
                                               v
                          +------------------------------------------+
                          |      LifeLine API (Express + TypeScript) |
                          |  - RBC Compatibility Service             |
                          |  - Finite State Machine Validation Engine|
                          |  - JWT Auth with Token Rotation          |
                          |  - Socket.IO Real-Time Dispatcher        |
                          +------------------------------------------+
                                               |
                                               | Prisma ORM (Pooler)
                                               v
                          +------------------------------------------+
                          |      PostgreSQL Database (Supabase)      |
                          |  - Users & Profiles                      |
                          |  - Blood Requests & Pledges              |
                          |  - Audit Logs & Security Trails          |
                          +------------------------------------------+
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / OpenStreetMap |
| **Backend** | Node.js, Express, TypeScript, Socket.IO v4, Zod Validation, Helmet, CORS |
| **Database** | PostgreSQL, Prisma ORM, Supabase Connection Pooler |
| **Testing** | Vitest (33 unit & integration test suites passed) |
| **Deployment** | Vercel (Frontend SPA) + Render (Backend Web Service) |

---

## Project Structure

```
LIFELINE/
├── client/                     # Vite + React Frontend SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           # Login & Registration Modals
│   │   │   ├── common/         # Cascading Location Selectors
│   │   │   ├── donors/         # Live Donor Search & Directory
│   │   │   ├── map/            # Interactive Leaflet Emergency Map
│   │   │   └── requests/       # Emergency Feed & Creation Modals
│   │   ├── data/               # Bangladesh Geo Hierarchy & RBC Compatibility
│   │   ├── context/            # AuthContext & State Providers
│   │   └── services/           # API Client & Socket.IO Gateway
│   ├── vercel.json             # Vercel SPA Routing Configuration
│   └── vite.config.ts
├── server/                     # Express + Prisma Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database Models & Enums
│   │   └── seed.ts             # Development Seed Script
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & Token Management
│   │   │   ├── blood-requests/ # Request Lifecycle & State Machine
│   │   │   ├── donors/         # Donor Profiles & Medical Eligibility
│   │   │   ├── matching/       # Clinical Compatibility Matrix
│   │   │   └── notifications/  # Push & In-App Alerts
│   │   ├── tests/              # Vitest Test Suites
│   │   ├── app.ts              # Express App & Middleware
│   │   └── server.ts           # Server Bootstrapper & Socket Gateway
│   └── tsconfig.json
├── package.json                # Root Monorepo Scripts
└── README.md
```

---

## Getting Started Locally

### Prerequisites
* **Node.js** (v20+ recommended)
* **npm** (v9+)
* **PostgreSQL Database** (local instance or cloud database such as Supabase / Neon)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Afiroj313501/LIFELINE.git
cd LIFELINE

# Install both backend and frontend dependencies
npm run install:all
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
API_PREFIX=/api/v1

# PostgreSQL Connection String
DATABASE_URL="postgresql://user:password@localhost:5432/lifeline_db?schema=public"

# 256-bit Random Secrets for Authentication
JWT_ACCESS_SECRET="generate_a_minimum_32_character_random_string_here"
JWT_REFRESH_SECRET="generate_a_minimum_32_character_random_string_here"
```

### 3. Initialize Database
```bash
# Push Prisma schema to your database
npm run db:push

# Generate Prisma Client
npm run db:generate
```

### 4. Run Tests
```bash
npm run test
```

### 5. Start Development Servers
From the root directory, launch both the client and server concurrently:
```bash
npm run dev
```

* **Frontend:** `http://localhost:5173`
* **Backend API:** `http://localhost:5000`
* **API Health Check:** `http://localhost:5000/health`

---

## Production Deployment

### 1. Database (Supabase)
1. In your **Supabase Dashboard**, open **Project Settings** &rarr; **Database**.
2. Under **Connection Pooling**, choose **Mode: Session** (Port `5432`).
3. Copy the pooled IPv4 connection string:
   ```env
   DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

### 2. Backend on Render (Web Service)
1. Create a new **Web Service** on [Render](https://render.com) linked to your repo.
2. Settings:
   * **Root Directory:** `server`
   * **Build Command:** `npm install && npx prisma generate && npm run build`
   * **Start Command:** `npx prisma db push && npm start`
3. Environment Variables:
   * `NODE_ENV`: `production`
   * `PORT`: `10000`
   * `DATABASE_URL`: *(Your pooled Supabase connection string)*
   * `JWT_ACCESS_SECRET`: *(64-character hex string)*
   * `JWT_REFRESH_SECRET`: *(64-character hex string)*
   * `CLIENT_URL`: `https://*.vercel.app` *(or your exact Vercel frontend URL)*

### 3. Frontend on Vercel
1. Import your repository into [Vercel](https://vercel.com).
2. Settings:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `client`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Environment Variables:
   * `VITE_API_URL`: `https://your-render-backend.onrender.com`
4. Click **Deploy**.

---

## Red Blood Cell (RBC) Compatibility Matrix

| Recipient Blood Group | Compatible Donor Groups |
| :---: | :--- |
| **$O^-$** | $O^-$ |
| **$O^+$** | $O^+$, $O^-$ |
| **$A^-$** | $A^-$, $O^-$ |
| **$A^+$** | $A^+$, $A^-$, $O^+$, $O^-$ |
| **$B^-$** | $B^-$, $O^-$ |
| **$B^+$** | $B^+$, $B^-$, $O^+$, $O^-$ |
| **$AB^-$** | $AB^-$, $A^-$, $B^-$, $O^-$ |
| **$AB^+$** | $AB^+$, $AB^-$, $A^+$, $A^-$, $B^+$, $B^-$, $O^+$, $O^-$ *(Universal Recipient)* |

---

## Contributing

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/NewFeature`).
3. Commit your Changes (`git commit -m 'Add NewFeature'`).
4. Push to the Branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
