# COPA Route Optimizer

A comprehensive web application for monitoring, optimizing, and managing AI-assisted flight route optimizations for COPA Airlines. The system analyzes wind patterns, fuel prices, turbulence data, and operational constraints to recommend optimal flight routes that maximize savings while maintaining safety standards.

## Features

- **Real-time Operations Dashboard** – Monitor optimization executions, track KPIs, and view performance metrics
- **3D Flight Visualization** – Interactive 3D map with Deck.gl showing flight paths, waypoints, and altitude profiles
- **Approval Workflow** – Dispatcher interface to review, approve, or reject route optimizations
- **Wind Optimization** – Analyze wind patterns and recommend optimal flight altitudes
- **Fuel Tankering Calculator** – Calculate optimal fuel tankering amounts based on price differentials
- **Turbulence Detection** – Real-time turbulence alerts and avoidance recommendations
- **Savings Analytics** – Track and visualize cost savings across all optimizations
- **Fuel Price Management** – Manage and track fuel prices across airports

## Tech Stack

| Area | Technology | Purpose |
| --- | --- | --- |
| Frontend Framework | React 18 | UI component library |
| Build Tool | Vite | Fast development and bundling |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Database & Backend | Supabase (PostgreSQL) | Data storage and real-time updates |
| 2D Maps | Mapbox GL JS | Interactive 2D mapping |
| 3D Visualization | Deck.gl | WebGL-powered 3D flight paths |
| Charts | Recharts | Data visualization |
| Icons | Lucide React | Icon library |
| Animations | Framer Motion | Smooth UI transitions |

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Supabase account (free tier works)
- Mapbox account (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jbandu/routeoptimizer.git
   cd routeoptimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MAPBOX_TOKEN=your_mapbox_access_token
   ```

   See [Developer Guide](docs/DEVELOPER_GUIDE.md#initial-setup) for detailed instructions on obtaining credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:5173`

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Complete setup, development workflow, and best practices
- **[API Documentation](docs/API.md)** - Database tables, queries, and service functions
- **[Component Documentation](docs/COMPONENTS.md)** - Detailed component API and usage
- **[Architecture Documentation](docs/ARCHITECTURE.md)** - System design and technical architecture
- **[Database Schema](docs/data-model.md)** - Complete database schema reference

## Project Structure

```
routeoptimizer/
├── docs/                   # Comprehensive documentation
│   ├── API.md
│   ├── COMPONENTS.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPER_GUIDE.md
│   └── data-model.md
├── src/
│   ├── components/        # React components
│   │   ├── Dashboard.jsx
│   │   ├── MapView.jsx
│   │   ├── RouteVisualization3D.jsx
│   │   ├── ApprovalWorkflow.jsx
│   │   └── ...
│   ├── services/          # Business logic layer
│   │   ├── fuelService.js
│   │   ├── weatherService.js
│   │   └── turbulenceService.js
│   ├── lib/               # External library configs
│   │   └── supabase.js
│   ├── utils/             # Utility functions
│   └── App.jsx            # Main application
├── supabase/
│   └── migrations/        # Database migrations
├── package.json
└── README.md
```

## Key Features in Detail

### Real-time Dashboard

Monitor all optimization executions with live updates:
- Total optimizations count
- Active routes
- Cumulative savings
- Success rate
- Performance trends
- Recent execution history

### 3D Flight Visualization

Interactive 3D map powered by Deck.gl and Mapbox:
- 3D flight paths with altitude data
- Waypoint markers
- Airport locations
- Route network overview
- Altitude profile charts
- Toggle between 2D and 3D views

### Approval Workflow

Dispatcher interface for route approval:
- Pending optimization queue
- Urgency indicators (Critical/High/Normal)
- Detailed route information
- Savings and confidence metrics
- Approve/reject with reason tracking
- Audit trail

### Wind Optimization

Analyze wind patterns for route optimization:
- Fetch real-time wind data
- Calculate great circle waypoints
- Analyze winds at multiple altitudes
- Recommend optimal flight level
- Estimate time savings

### Fuel Tankering

Calculate optimal fuel tankering:
- Compare fuel prices between airports
- Calculate trip fuel requirements
- Determine tankering capacity
- Optimize tankering amount
- Account for weight penalties
- Show net savings

### Turbulence Detection

Real-time turbulence monitoring:
- Detect turbulence zones along route
- Classify severity (Light/Moderate/Severe)
- Provide avoidance recommendations
- Estimate detour costs

## Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run typecheck   # TypeScript type checking
npm test            # Run tests (if configured)
```

## Environment Variables

Required environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `VITE_MAPBOX_TOKEN` | Mapbox access token | `pk.eyJ1...` |

## Database Setup

The application uses Supabase (PostgreSQL) for data storage. Database migrations are located in `supabase/migrations/`.

### Key Tables

- `agent_executions` - Optimization execution metadata
- `optimized_routes` - Route optimization results
- `airports` - Airport master data
- `aircraft_types` - Aircraft specifications
- `copa_routes` - Route catalog
- `wind_data` - Wind forecast data
- `turbulence_data` - Turbulence zones
- `fuel_prices` - Fuel price history

See [Database Schema Documentation](docs/data-model.md) for complete details.

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run linter: `npm run lint`
4. Type check: `npm run typecheck`
5. Commit: `git commit -m "feat: your feature"`
6. Push: `git push origin feature/your-feature`
7. Create Pull Request

See [Developer Guide](docs/DEVELOPER_GUIDE.md) for detailed workflow and best practices.

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Code Style**: Follow the existing code style (enforced by ESLint)
2. **Commits**: Use conventional commit messages (feat, fix, docs, etc.)
3. **Documentation**: Update docs when adding features or changing APIs
4. **Testing**: Add tests for new functionality
5. **Review**: All PRs require review before merging

See [Developer Guide - Contributing](docs/DEVELOPER_GUIDE.md#contributing) for complete guidelines.

## Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)

```bash
npm install -g vercel
vercel deploy --prod
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

See [Developer Guide - Deployment](docs/DEVELOPER_GUIDE.md#deployment) for detailed instructions.

## Architecture

The application follows a layered architecture:

- **Presentation Layer**: React components and UI
- **Service Layer**: Business logic and calculations
- **Data Access Layer**: Supabase client and queries
- **Real-time Layer**: WebSocket subscriptions

See [Architecture Documentation](docs/ARCHITECTURE.md) for complete system design details.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

WebGL support required for 3D visualizations.

## Performance

- Initial load: < 3 seconds
- Time to interactive: < 5 seconds
- Real-time updates: < 1 second latency
- 3D rendering: 60 FPS on modern hardware

## Security

- Row Level Security (RLS) enabled on all tables
- API keys secured via environment variables
- Input validation and sanitization
- HTTPS required in production

## License

Copyright (c) 2024 COPA Airlines. All rights reserved.

## Support

For issues, questions, or contributions:

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Open a GitHub issue
- **Developer Guide**: See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Deck.gl Documentation](https://deck.gl/)

---

Built with ❤️ by the COPA Airlines Engineering Team
