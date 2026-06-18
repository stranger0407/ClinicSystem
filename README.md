# Clinic OS

Clinic OS is a production-ready, multi-tenant Clinic Management System optimized for solo doctors and small clinics in India. Built with a focus on speed, minimal clicks, mobile responsiveness, and zero learning curve, it facilitates paperless clinic management including patient registration, slot/walk-in appointments, clinical encounters, prescription autocompleting, split-payment billing ledgers, and audit trailing.

---

## 🚀 Key Features

### 1. Patient Portal
*   **Self-Registration**: Book slot-based appointments with preferred doctors.
*   **Medical Dashboard**: Access visit history, digital prescriptions, and invoice dues.

### 2. Front Desk & Reception Portal (`/dashboard/staff`)
*   **Triage Management**: Walk-in queue auto-numbering and scheduled calendar slot booking.
*   **Patient Registry & Fast Search**: Optimized database searches by phone or name.
*   **Duplicate Record Merging**: Prevents duplicate files. Relinks historical appointments, encounters, prescriptions, and invoices from duplicate records to a survivor profile in a database transaction with audit trail logging.
*   **Split Billing Ledger**: Process partial payments, allocate splits across **Cash, UPI, and Card**, calculate taxes, apply discounts, and generate print-friendly receipts (optimized stylesheet for thermal/laser printers).

### 3. Doctor Workspace (`/dashboard/doctor`)
*   **OPD Queue**: Live status queue tracking patients from check-in to completed consults.
*   **One-Click Charting**: Instantly view historical timelines, vitals, complaints, and previous prescriptions.
*   **Clinical Encounter**: Record vitals, chief complaints, diagnosis notes, and recommended diagnostic tests.
*   **Smart Prescription Pad**: Autocompletes medication names, dosage strengths, and schedules directly from the clinic's medicine catalog.

### 4. Owner Console (`/dashboard/owner`)
*   **Real-time Revenue Reports**: Today's collection totals, visit counts, outstanding dues, and active personnel.
*   **Collection Channel Analysis**: Visual split breakdowns showing cash vs. UPI vs. card ratios.
*   **Medicine Master CRUD**: Administer the global clinic medicine list.
*   **Audit Trail Logs**: Audit logs tracking data modifications, user role operators, and IP addresses.

---

## 🛠 Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide React
*   **Backend**: NestJS (Modular structure, Guards, Interceptors)
*   **Database**: PostgreSQL
*   **ORM**: Prisma ORM v7.8.0 (configured with native `pg` Pool and `PrismaPg` driver adapter)

---

## 📂 Project Structure

```
ClinicSystem/
├── backend/                  # NestJS API Backend
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   └── seed.ts           # DB Seeding Script
│   └── src/
│       ├── admin/            # Owner reports & stats module
│       ├── auth/             # JWT, passwords & permissions
│       ├── prisma/           # Database service & soft delete extensions
│       ├── test-apis.ts      # Integration test script
│       └── main.ts           # App bootstrap & validation pipes
├── frontend/                 # Next.js Frontend App
│   └── src/
│       ├── app/
│       │   ├── dashboard/    # Doctor, Staff, Owner, Patient panels
│       │   ├── login/
│       │   └── register/
│       └── context/          # Auth Context & Session handling
└── package.json              # Monorepo workspaces setup
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your system:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [PostgreSQL](https://www.postgresql.org/) (Running on default port `5432` with a database named `clinic_db`)

### 2. Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/clinic_db?schema=public"
JWT_SECRET="super-secret-clinic-key-change-in-production"
```

### 3. Install Dependencies
Run from the root workspace directory:
```bash
npm install
```

### 4. Migrate and Seed Database
Run database setup commands in the `backend` directory to initialize the tables and seed dummy clinic datasets (Apollo Family Clinic):
```bash
# Push schema to PostgreSQL
npx prisma db push

# Seed database with dummy accounts (Owner, Doctor, Staff, Patient)
npx ts-node prisma/seed.ts
```

### 5. Start Development Servers
Run the dev servers from the root workspace:
```bash
# Start NestJS backend (localhost:3001)
npm run dev:backend

# Start Next.js frontend (localhost:3000)
npm run dev:frontend
```

---

## 🔑 Ready-to-Use Seed Accounts (Password: `Password123`)

*   **Subdomain**: `apollo`
*   **Owner**: `owner@apollo.com`
*   **Doctor**: `doctor@apollo.com`
*   **Staff**: `staff@apollo.com`
*   **Patient**: `9876543210`

---

## 🛡️ Security & Performance Guardrails

1.  **Strict Multi-Tenancy**: All tables hold a mandatory `clinicId` column. The NestJS `TenantMiddleware` extracts the tenant context via the `x-clinic-id` request header, and the custom Prisma Client `$extends` query block enforces `WHERE clinicId = X` on all queries.
2.  **Global Soft Delete**: Queries automatically filter out deleted items (`deletedAt: null`). Hard `delete` operations are converted into update statements setting `deletedAt` at runtime.
3.  **Observability & Logs**: Exceptions are caught globally by the `GlobalExceptionFilter` and logged to `stdout` in structured JSON format for indexing in log management platforms.
4.  **Health Diagnostics**: Call **`http://localhost:3001/health`** to check application uptime and verify active database connections.

---

## 🧪 Integration Testing
You can verify the API lifecycle, including auth token issuance, walk-in appointment check-in, clinical consultation, billing invoicing, split payments ledger processing, owner report calculations, and audit trails, by executing:
```bash
# In the backend directory
npx ts-node src/test-apis.ts
```
