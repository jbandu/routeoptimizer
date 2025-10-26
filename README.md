# COPA Route Optimizer

A web application for monitoring, simulating, and approving AI-assisted flight route optimizations for COPA Airlines. The frontend is built with React, Vite, Tailwind CSS, and Supabase for realtime data and persistence.

## Project Overview

- **Operations dashboard** – Track optimization runs, execution health, and savings outcomes.
- **Interactive map** – Visualize network routes, airport metadata, and optimized plans.
- **Approval workflow** – Review, approve, or reject optimization proposals before execution.
- **Fuel & wind modules** – Analyze tankering opportunities, weather impacts, and cost scenarios.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| Data access | Supabase JavaScript client |
| Icons & UI | `lucide-react` |
| Styling utilities | PostCSS, Autoprefixer |

## Application Structure

```
src/
├── App.jsx                 # Top-level navigation and view switching
├── main.tsx                # Vite entry point
├── index.css               # Tailwind base styles
├── lib/
│   └── supabase.js         # Supabase client configuration
├── services/
│   ├── fuelService.js      # Tankering calculators and helpers
│   ├── turbulenceService.js# Turbulence risk utilities
│   └── weatherService.js   # Weather fetch/cache helpers
└── components/
    ├── Dashboard.jsx       # Agent execution overview & metrics
    ├── SavingsDashboard.jsx# Aggregated savings visualization
    ├── ApprovalWorkflow.jsx# Approval queue for optimized routes
    ├── MapView.jsx         # Map of routes and airports
    ├── OptimizationTrigger.jsx
    ├── WindOptimization.jsx
    ├── FuelTankering.jsx
    ├── FuelPriceManagement.jsx
    ├── TurbulenceAlert.jsx
    ├── ExecutionCard.jsx   # Shared card UI for executions
    └── StatCard.jsx        # Shared statistics widget
```

Supporting SQL migrations live in `supabase/migrations/` and follow Supabase's timestamped file naming convention.

## Database & Schema Reference

A detailed description of every Supabase table, including relationships and operational purpose, is maintained in [`docs/data-model.md`](docs/data-model.md). Keep that document in sync with any schema migrations so engineering, analytics, and operations have a single source of truth.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in a `.env.local` file:
   ```bash
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Optional: set up Supabase locally or connect to the shared project. Apply migrations via the Supabase CLI or dashboard to mirror the schema described in `docs/data-model.md`.

## Contributing

- Follow the component structure shown above and keep UI logic modular.
- Update both this README and the schema document whenever new tables, views, or core features are introduced.
- Run `npm run lint` before opening a pull request.

## Additional Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
