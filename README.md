# Autorização Oncologia

React app for managing oncology treatment authorization requests.

## Stack

- **React 18 + TypeScript** — type-safe UI
- **Vite** — fast dev server and build
- **TanStack Query** — server state, caching, loading/error handling
- **React Router v6** — client-side routing
- **Zustand** (available for local UI state if needed)
- **Tailwind CSS** — utility-first styling
- **Supabase** — PostgreSQL database + auth + realtime
- **xlsx + mammoth** — Excel import/export, DOCX parsing
- **react-hook-form** — form management
- **react-hot-toast** — notifications

## Project structure

```
src/
├── components/
│   ├── ui/           # Reusable: Badge, Button, Card, DropZone, Input, Select
│   └── layout/       # AppShell (sidebar), PageHeader
├── features/
│   └── patients/
│       ├── api.ts         # Supabase queries (fetchPatients, createPatient, ...)
│       ├── hooks.ts       # TanStack Query hooks (usePatients, useCreatePatient, ...)
│       └── useDashboard.ts  # Derived stats + lists for the dashboard
├── lib/
│   ├── supabase.ts    # Supabase client
│   ├── docxParser.ts  # DOCX → PatientCreateInput
│   └── xlsxHandler.ts # XLSX import/export
├── pages/
│   ├── DashboardPage.tsx
│   ├── NewRequestPage.tsx
│   ├── ResponsePage.tsx
│   ├── PatientsPage.tsx
│   └── ImportPage.tsx
├── types/index.ts     # All TypeScript interfaces
└── utils/
    ├── cn.ts          # clsx + tailwind-merge
    └── dates.ts       # Excel serial dates, formatDate, daysFromToday, calcPrazo
```

## Setup

### 1. Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run the contents of `supabase-schema.sql`
3. Go to **Authentication → Providers** and enable **Email**
4. Create user accounts at **Authentication → Users** for each team member
5. Copy your **Project URL** and **anon key** from **Settings → API**

### 2. App

```bash
# Clone / unzip the project
npm install

# Create environment file
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm run dev
# App runs at http://localhost:5173
```

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel
# Follow prompts; set the two env vars in the Vercel dashboard
```

Or connect your GitHub repo in the Vercel dashboard — it auto-deploys on every push.

## First-time use

1. Go to **Importar Excel** and upload the current `.xlsx` file — all existing patients are imported into Supabase
2. The **Painel** shows urgent cases, upcoming cycles, and items under analysis automatically
3. For new requests: go to **Nova Solicitação**, upload the DOCX or fill manually
4. When an insurer replies: go to **Registrar Resposta**, search the patient, fill in the answer
5. **Exportar Excel** (bottom of sidebar) always generates an up-to-date `.xlsx` matching the original format

## Adding a new field

1. Add column to `supabase-schema.sql` and run `ALTER TABLE` in Supabase
2. Add the field to `src/types/index.ts`
3. Update `src/lib/xlsxHandler.ts` (import/export mapping)
4. Add the field to the relevant form page

## Generating Supabase types (optional, for full type safety)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```
