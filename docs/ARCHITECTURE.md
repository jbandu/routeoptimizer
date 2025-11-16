# Architecture Documentation

## System Overview

The COPA Route Optimizer is a full-stack web application designed to optimize flight routes for COPA Airlines through AI-assisted analysis of wind patterns, fuel prices, turbulence data, and operational constraints.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              React Frontend (Vite)                    │ │
│  │                                                       │ │
│  │  ├─ Components (UI Layer)                            │ │
│  │  ├─ Services (Business Logic)                        │ │
│  │  ├─ Real-time Subscriptions                          │ │
│  │  └─ Mapbox/Deck.gl (Visualization)                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           │ HTTPS/WSS                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                        │
│                                                             │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  PostgreSQL DB │  │  Realtime    │  │   Auth & RLS   │ │
│  │                │  │  Server      │  │                │ │
│  │  - Routes      │  │              │  │  - API Keys    │ │
│  │  - Airports    │  │  - Live      │  │  - Policies    │ │
│  │  - Executions  │  │    Updates   │  │  - Security    │ │
│  │  - Wind Data   │  │  - Channels  │  │                │ │
│  │  - Fuel Data   │  │              │  │                │ │
│  └────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ External APIs (Future)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                         │
│                                                             │
│  ├─ Weather APIs (NOAA, AccuWeather)                       │
│  ├─ Fuel Price Feeds                                       │
│  ├─ Amadeus Flight Data                                    │
│  └─ AI/ML Optimization Engine                              │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | UI component library |
| Build Tool | Vite | Fast development and bundling |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Maps (2D) | Mapbox GL JS | Interactive 2D mapping |
| Maps (3D) | Deck.gl | WebGL-powered 3D visualization |
| Charts | Recharts | Data visualization |
| Icons | Lucide React | Icon library |
| Animations | Framer Motion | Smooth UI transitions |
| State | React Hooks | Local component state |
| Backend Client | Supabase JS | Database and real-time |

### Application Layers

#### 1. Presentation Layer (Components)

**Responsibility:** Render UI and handle user interactions

**Structure:**
```
components/
├── Dashboard.jsx           # Metrics and KPI display
├── SavingsDashboard.jsx    # Financial analytics
├── ApprovalWorkflow.jsx    # Route approval interface
├── MapView.jsx             # 2D map visualization
├── RouteVisualization3D.jsx # 3D flight paths
├── OptimizationTrigger.jsx # Manual optimization
├── WindOptimization.jsx    # Wind analysis UI
├── FuelTankering.jsx       # Tankering calculator
├── FuelPriceManagement.jsx # Price admin
├── TurbulenceAlert.jsx     # Safety alerts
├── AltitudeProfile.jsx     # Altitude charts
├── ExecutionCard.jsx       # Execution summary
└── StatCard.jsx            # Reusable stat display
```

**Design Patterns:**
- Container/Presentational pattern
- Composition over inheritance
- Controlled components for forms
- Lifting state up for shared data

#### 2. Service Layer

**Responsibility:** Business logic and data transformation

**Services:**

```
services/
├── fuelService.js          # Fuel calculations
│   ├── getFuelPriceComparison()
│   ├── calculateTankering()
│   └── getFuelPriceHistory()
│
├── weatherService.js       # Weather and wind analysis
│   ├── getWindData()
│   ├── calculateGreatCircleWaypoints()
│   ├── interpolateWindAtWaypoint()
│   ├── calculateWindComponent()
│   └── analyzeRouteWinds()
│
└── turbulenceService.js    # Turbulence detection
    ├── detectTurbulenceAlongRoute()
    ├── estimateDetourCost()
    └── getTurbulenceSeverityColor()
```

**Service Pattern:**
```javascript
// Service exports pure functions
export async function calculateTankering(origin, dest, aircraft, distance) {
  // 1. Fetch required data
  // 2. Apply business logic
  // 3. Return calculated result
  return {
    recommended: boolean,
    savings: number,
    breakdown: object
  };
}
```

#### 3. Data Access Layer

**Responsibility:** Database queries and real-time subscriptions

**Implementation:**
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Query Patterns:**

```javascript
// 1. Simple Select
const { data, error } = await supabase
  .from('airports')
  .select('*')
  .eq('iata_code', 'PTY')
  .single();

// 2. Complex Join
const { data } = await supabase
  .from('optimized_routes')
  .select(`
    *,
    origin:airports!origin_iata(name, city),
    destination:airports!destination_iata(name, city)
  `)
  .eq('status', 'pending');

// 3. Real-time Subscription
const channel = supabase
  .channel('executions')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'agent_executions' },
    handleNewExecution
  )
  .subscribe();
```

### State Management

#### Local Component State

```javascript
// Using useState for component-specific data
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const [error, setError] = useState(null);
```

#### Shared State Patterns

**1. Prop Drilling** (Current approach)
```javascript
// App.jsx passes data down
<MapView
  routes={routes}
  airports={airports}
  optimizedRoute={optimizedRoute}
/>
```

**2. Context API** (For future scaling)
```javascript
// AppContext.jsx
const AppContext = createContext();

export function AppProvider({ children }) {
  const [routes, setRoutes] = useState([]);
  const [airports, setAirports] = useState([]);

  return (
    <AppContext.Provider value={{ routes, airports }}>
      {children}
    </AppContext.Provider>
  );
}

// Usage in components
const { routes, airports } = useContext(AppContext);
```

**3. Custom Hooks** (Reusable logic)
```javascript
// hooks/useExecutions.js
export function useExecutions() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutions();
    const channel = subscribeToExecutions(setExecutions);
    return () => supabase.removeChannel(channel);
  }, []);

  return { executions, loading };
}

// Usage
const { executions, loading } = useExecutions();
```

### Routing Strategy

**Current:** View-based navigation with state
```javascript
const [currentView, setCurrentView] = useState('dashboard');

// Navigation
<button onClick={() => setCurrentView('dashboard')}>Dashboard</button>

// Rendering
{currentView === 'dashboard' && <Dashboard />}
{currentView === 'map' && <MapView />}
```

**Future Enhancement:** React Router for URL-based routing
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/map" element={<MapView />} />
    <Route path="/approval/:id" element={<ApprovalWorkflow />} />
  </Routes>
</BrowserRouter>
```

## Backend Architecture

### Database Design

#### Schema Organization

**1. Core Operations Tables**
- `agent_executions` - Optimization run metadata
- `optimized_routes` - Route optimization results
- `route_performance_actual` - Post-flight actuals

**2. Reference Data**
- `airports` - Airport master data
- `aircraft_types` - Fleet specifications
- `copa_routes` - Route catalog
- `copa_fleet` - Individual aircraft

**3. Environmental Data**
- `wind_data` - Gridded wind forecasts
- `turbulence_data` - Turbulence zones
- `weather_cache` - Weather snapshots
- `fuel_prices` - Fuel price history

**4. Analytics Views**
- `phase1_savings_summary` - Aggregated savings

#### Data Flow

```
┌──────────────┐
│   Frontend   │
│   Component  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Service Function    │
│  (Business Logic)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Supabase Client     │
│  (Query Builder)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  PostgreSQL DB       │
│  (Data Storage)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Real-time Server    │
│  (Push Updates)      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Frontend Component  │
│  (State Update)      │
└──────────────────────┘
```

### Security Architecture

#### Row Level Security (RLS)

Supabase RLS policies control data access at the database level:

```sql
-- Example: Only show approved routes
CREATE POLICY "Users can view approved routes"
ON optimized_routes
FOR SELECT
USING (status = 'approved' OR auth.uid() = dispatcher_id);

-- Example: Only dispatchers can approve
CREATE POLICY "Only dispatchers can approve"
ON agent_executions
FOR UPDATE
USING (auth.role() = 'dispatcher');
```

#### API Key Management

**Anon Key:**
- Used in frontend
- Limited permissions via RLS
- Safe to expose in client code

**Service Role Key:**
- Server-side only
- Full database access
- Never exposed to client

#### Authentication Flow (Future)

```
User Login
    ├─> Supabase Auth
    ├─> JWT Token Generated
    ├─> Token Stored (localStorage/cookie)
    └─> Token Sent with Requests
         └─> RLS Policies Applied
```

## Data Visualization Architecture

### 2D Mapping (Mapbox)

```javascript
// Initialization
const map = new mapboxgl.Map({
  container: containerRef,
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-79.3834, 9.0714],
  zoom: 4
});

// Layers
map.addLayer({
  id: 'routes',
  type: 'line',
  source: routeSource,
  paint: {
    'line-color': '#0066CC',
    'line-width': 2
  }
});

// Markers
new mapboxgl.Marker(element)
  .setLngLat([lon, lat])
  .addTo(map);
```

### 3D Visualization (Deck.gl)

```javascript
// Deck.gl overlay on Mapbox
const deckOverlay = new MapboxOverlay({
  layers: [
    new ArcLayer({
      id: 'routes',
      data: routes,
      getSourcePosition: d => d.source,
      getTargetPosition: d => d.target,
      getHeight: 0.3
    }),
    new PathLayer({
      id: 'flight-path',
      data: [flightPath],
      getPath: d => d.waypoints,
      getWidth: 5,
      extruded: true
    })
  ]
});

map.addControl(deckOverlay);
```

### Charts (Recharts)

```javascript
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={performanceData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="time" />
    <YAxis />
    <Tooltip />
    <Line dataKey="savings" stroke="#10B981" />
    <Line dataKey="confidence" stroke="#0066CC" />
  </LineChart>
</ResponsiveContainer>
```

## Real-time Architecture

### Supabase Realtime

**Protocol:** WebSocket (WSS)

**Channel Pattern:**
```javascript
// Subscribe to table changes
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes',
    {
      event: 'INSERT',        // or UPDATE, DELETE, *
      schema: 'public',
      table: 'table_name',
      filter: 'column=eq.value' // optional
    },
    (payload) => {
      // Handle change
      console.log('Change received:', payload);
    }
  )
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);
```

**Use Cases:**
1. Dashboard live updates
2. Approval workflow notifications
3. Real-time execution status
4. Collaborative editing

## Performance Optimization

### Frontend Optimization

**1. Code Splitting**
```javascript
// Lazy load heavy components
const RouteVisualization3D = lazy(() =>
  import('./components/RouteVisualization3D')
);

<Suspense fallback={<LoadingSpinner />}>
  <RouteVisualization3D />
</Suspense>
```

**2. Memoization**
```javascript
// Memoize expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

**3. Virtualization**
```javascript
// For large lists, use react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
>
  {Row}
</FixedSizeList>
```

### Database Optimization

**1. Indexes**
```sql
CREATE INDEX idx_executions_status ON agent_executions(status);
CREATE INDEX idx_routes_airports ON optimized_routes(origin_iata, destination_iata);
CREATE INDEX idx_wind_spatial ON wind_data(latitude, longitude, altitude_ft);
```

**2. Query Optimization**
```javascript
// Select only needed columns
.select('id, status, timestamp')

// Use limit for pagination
.limit(20)

// Add indexes on frequently queried columns
```

**3. Materialized Views**
```sql
CREATE MATERIALIZED VIEW savings_summary AS
SELECT
  DATE_TRUNC('day', approved_at) as date,
  SUM(estimated_savings_usd) as total_savings,
  COUNT(*) as optimization_count
FROM optimized_routes
WHERE status = 'approved'
GROUP BY DATE_TRUNC('day', approved_at);
```

### Network Optimization

**1. Request Batching**
```javascript
// Fetch multiple resources in parallel
const [routes, airports, executions] = await Promise.all([
  supabase.from('copa_routes').select('*'),
  supabase.from('airports').select('*'),
  supabase.from('agent_executions').select('*').limit(10)
]);
```

**2. Caching**
```javascript
// Cache static data
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map();

async function getCachedAirports() {
  const cached = cache.get('airports');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const { data } = await supabase.from('airports').select('*');
  cache.set('airports', { data, timestamp: Date.now() });
  return data;
}
```

## Error Handling Strategy

### Error Boundaries

```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### API Error Handling

```javascript
async function fetchWithErrorHandling() {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*');

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);

    // User-friendly error messages
    const message =
      error.code === '23505' ? 'Duplicate entry' :
      error.code === '42501' ? 'Permission denied' :
      'An error occurred. Please try again.';

    return { success: false, error: message };
  }
}
```

## Deployment Architecture

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Type checking
npm run typecheck

# 3. Linting
npm run lint

# 4. Build for production
npm run build

# Output: dist/ directory with optimized assets
```

### Environment Configuration

**Development (.env.local):**
```bash
VITE_SUPABASE_URL=https://dev.supabase.co
VITE_SUPABASE_ANON_KEY=dev_key
VITE_MAPBOX_TOKEN=dev_token
```

**Production (.env.production):**
```bash
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod_key
VITE_MAPBOX_TOKEN=prod_token
```

### Hosting Options

**1. Vercel (Recommended)**
```bash
npm install -g vercel
vercel deploy --prod
```

**2. Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**3. Static Hosting**
- Upload `dist/` to any static host
- Configure SPA routing (redirect all to index.html)

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
      - run: npm run deploy
```

## Scalability Considerations

### Frontend Scaling

**1. Component Lazy Loading**
- Load components on-demand
- Reduce initial bundle size
- Faster first paint

**2. CDN Distribution**
- Serve static assets from CDN
- Edge caching for faster delivery
- Geographic distribution

**3. Progressive Web App (PWA)**
- Service worker for offline support
- App-like experience
- Push notifications

### Backend Scaling

**1. Database Connection Pooling**
- Supabase handles automatically
- Configure pool size for load

**2. Read Replicas**
- Separate read/write traffic
- Reduce load on primary database

**3. Caching Layer**
- Redis for session data
- Cache computed results
- Reduce database load

## Monitoring & Observability

### Metrics to Track

**Frontend:**
- Page load time
- Time to interactive
- API response times
- Error rates
- User interactions

**Backend:**
- Query performance
- Database connections
- Error rates
- Request volume

### Logging Strategy

```javascript
// Structured logging
const logger = {
  info: (message, context) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message, error, context) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    }));
  }
};
```

## Future Architecture Enhancements

### 1. Microservices

Potential service separation:
- Optimization Engine (Python/Go)
- Weather Data Ingestion
- Fuel Price Aggregation
- Notification Service

### 2. Event-Driven Architecture

```
Event Bus (e.g., AWS EventBridge)
├─ Route Optimized Event
├─ Approval Required Event
├─ Price Update Event
└─ Weather Alert Event
```

### 3. Machine Learning Integration

```
ML Pipeline
├─ Data Collection
├─ Feature Engineering
├─ Model Training
├─ Model Deployment
└─ Prediction API
```

### 4. Advanced Caching

```
Multi-Layer Caching
├─ Browser Cache (Service Worker)
├─ CDN Cache (Static Assets)
├─ API Cache (Redis)
└─ Database Cache (Query Results)
```

## Technology Decision Rationale

| Technology | Chosen | Reason |
|-----------|--------|--------|
| Framework | React | Component-based, large ecosystem, team familiarity |
| Build Tool | Vite | Fast HMR, modern, optimized builds |
| Backend | Supabase | PostgreSQL, real-time, auth, fast development |
| Styling | Tailwind | Utility-first, rapid development, consistency |
| 2D Maps | Mapbox | Rich features, performance, customization |
| 3D Viz | Deck.gl | WebGL performance, aviation-specific layers |
| Charts | Recharts | React-native, composable, good defaults |

## Design Principles

1. **Separation of Concerns**: Clear layer boundaries
2. **DRY**: Reusable components and services
3. **KISS**: Simple solutions over complex
4. **Performance First**: Optimize for user experience
5. **Security by Default**: RLS, validation, sanitization
6. **Real-time When Needed**: Live updates for critical data
7. **Progressive Enhancement**: Core functionality works everywhere
8. **Mobile-Responsive**: Works on all screen sizes
9. **Accessibility**: WCAG 2.1 compliant
10. **Maintainability**: Clear code, good documentation
