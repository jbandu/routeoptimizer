# Component Documentation

## Overview

The COPA Route Optimizer frontend is built with React 18 and uses a component-based architecture. This document provides detailed information about each component, its props, state, and usage.

## Table of Contents

- [Application Structure](#application-structure)
- [Core Components](#core-components)
- [Dashboard Components](#dashboard-components)
- [Visualization Components](#visualization-components)
- [Optimization Components](#optimization-components)
- [Shared Components](#shared-components)

## Application Structure

```
src/
├── App.jsx                     # Main application component
├── main.tsx                    # Vite entry point
├── index.css                   # Global styles (Tailwind)
├── lib/
│   └── supabase.js            # Supabase client
├── services/
│   ├── fuelService.js         # Fuel calculation services
│   ├── turbulenceService.js   # Turbulence detection
│   └── weatherService.js      # Weather and wind analysis
├── components/
│   ├── Dashboard.jsx          # Main dashboard
│   ├── SavingsDashboard.jsx   # Savings analytics
│   ├── ApprovalWorkflow.jsx   # Route approval interface
│   ├── MapView.jsx            # 2D map visualization
│   ├── RouteVisualization3D.jsx # 3D flight path
│   ├── OptimizationTrigger.jsx # Optimization controls
│   ├── WindOptimization.jsx   # Wind analysis
│   ├── FuelTankering.jsx      # Tankering calculator
│   ├── FuelPriceManagement.jsx # Fuel price admin
│   ├── TurbulenceAlert.jsx    # Turbulence warnings
│   ├── AltitudeProfile.jsx    # Altitude chart
│   ├── ExecutionCard.jsx      # Execution summary card
│   └── StatCard.jsx           # Statistics card
└── utils/
    └── sampleRouteData.js     # Sample data
```

## Core Components

### App.jsx

**Location:** `src/App.jsx`

Main application component that handles navigation and view switching.

**State:**
- `currentView` (string): Active view ('dashboard', 'savings', 'approval', 'map', 'optimizer', 'wind', 'fuel', 'fuelprices')
- `routes` (Array): List of COPA routes
- `airports` (Array): Airport data
- `optimizedRoute` (Object): Sample optimized route for visualization

**Effects:**
- Fetches map data (routes and airports) on mount
- Loads sample optimized route for 3D visualization

**Navigation:**
```javascript
const views = {
  dashboard: <Dashboard />,
  savings: <SavingsDashboard />,
  approval: <ApprovalWorkflow />,
  map: <MapView routes={routes} airports={airports} optimizedRoute={optimizedRoute} />,
  optimizer: <OptimizationTrigger />,
  wind: <WindOptimization />,
  fuel: <FuelTankering origin="PTY" destination="BOG" aircraftType="738" distanceNm={562} />,
  fuelprices: <FuelPriceManagement />
};
```

**Styling:**
- COPA Airlines brand colors:
  - Primary Blue: `#003B7A`
  - Secondary Blue: `#0066CC`
  - Accent Yellow: `#FFB81C`

**Example:**
```jsx
import App from './App';

// App is the root component
root.render(<App />);
```

## Dashboard Components

### Dashboard.jsx

**Location:** `src/components/Dashboard.jsx`

Main operations dashboard displaying optimization metrics and recent executions.

**State:**
- `stats` (Object): Aggregated statistics
  - `totalFlights` (number): Total optimization count
  - `totalRoutes` (number): Active routes count
  - `totalSavings` (number): Cumulative savings in USD
  - `successRate` (number): Success percentage
- `recentExecutions` (Array): Last 10 executions
- `performanceData` (Array): Chart data for visualizations
- `loading` (boolean): Loading state

**Real-time Features:**
- Subscribes to `agent_executions` table changes
- Auto-refreshes on new executions

**Visualizations:**
- Performance chart (Recharts LineChart)
- Stat cards for KPIs
- Recent execution cards

**Code Example:**
```jsx
<Dashboard />

// Displays:
// - Total Optimizations stat
// - Active Routes stat
// - Total Savings stat
// - Success Rate stat
// - Performance trend chart
// - Recent executions list
```

**Key Functions:**

```javascript
async function fetchDashboardData() {
  // Fetches executions
  const { data: executions } = await supabase
    .from('agent_executions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10);

  // Calculates stats
  const totalSavings = allExecs?.reduce((sum, exec) =>
    sum + (exec.output_data?.estimated_savings_usd || 0), 0
  );

  // Updates state
  setStats({ totalFlights, totalRoutes, totalSavings, successRate });
}
```

**Real-time Subscription:**
```javascript
useEffect(() => {
  const channel = supabase
    .channel('agent_executions')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'agent_executions' },
      (payload) => {
        console.log('New execution:', payload);
        fetchDashboardData();
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

### SavingsDashboard.jsx

**Location:** `src/components/SavingsDashboard.jsx`

Displays aggregated savings metrics and performance analytics.

**Features:**
- Phase 1 savings summary
- Trend analysis
- Cost breakdown
- Performance metrics

**Props:** None (fetches own data)

**Data Sources:**
- `phase1_savings_summary` view
- `optimized_routes` table
- `route_performance_actual` table

### ApprovalWorkflow.jsx

**Location:** `src/components/ApprovalWorkflow.jsx`

Route optimization approval interface for dispatchers.

**State:**
- `pendingOptimizations` (Array): Pending approvals
- `approvedOptimizations` (Array): Approved routes
- `rejectedOptimizations` (Array): Rejected routes
- `selectedOptimization` (Object): Currently selected route for review
- `activeTab` (string): Active tab ('pending', 'approved', 'rejected')
- `dispatcherName` (string): Dispatcher identifier

**Key Functions:**

```javascript
// Approve optimization
async function handleApprove(optimization) {
  const { error } = await supabase
    .from('agent_executions')
    .update({
      status: 'approved',
      approved_by: dispatcherName,
      approved_at: new Date().toISOString()
    })
    .eq('id', optimization.id);
}

// Reject optimization
async function handleReject(optimization, reason) {
  const { error } = await supabase
    .from('agent_executions')
    .update({
      status: 'rejected',
      approved_by: dispatcherName,
      approved_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', optimization.id);
}
```

**Urgency Calculation:**
```javascript
function getUrgency(timestamp) {
  const departureTime = new Date(timestamp);
  const now = new Date();
  const hoursUntil = (departureTime - now) / (1000 * 60 * 60);

  if (hoursUntil < 2) return { level: 'CRITICAL', color: 'bg-red-600' };
  if (hoursUntil < 6) return { level: 'HIGH', color: 'bg-orange-500' };
  return { level: 'NORMAL', color: 'bg-blue-500' };
}
```

**Usage:**
```jsx
<ApprovalWorkflow />

// Features:
// - Pending optimizations grid
// - Approval/rejection controls
// - Dispatcher authentication
// - Urgency indicators
// - Detailed optimization review modal
```

**Animations:**
Uses Framer Motion for smooth transitions:
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {/* Modal content */}
</motion.div>
```

## Visualization Components

### MapView.jsx

**Location:** `src/components/MapView.jsx`

2D map visualization using Mapbox GL JS.

**Props:**
- `routes` (Array): COPA routes to display
- `airports` (Array): Airport locations
- `optimizedRoute` (Object): Optimized route data

**State:**
- `selectedRoute` (Object): Selected route for detail view
- `mapReady` (boolean): Map initialization status
- `view3D` (boolean): 3D view toggle

**Configuration:**
```javascript
const map = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [-79.3834, 9.0714], // PTY hub
  zoom: 4,
  pitch: 45
});
```

**Features:**
- Airport markers (hub vs destination styling)
- Route lines with click handlers
- Interactive popups
- Legend
- 3D view toggle

**Airport Marker Creation:**
```javascript
airports.forEach(airport => {
  const isHub = airport.iata_code === 'PTY';

  const el = document.createElement('div');
  el.style.width = isHub ? '20px' : '12px';
  el.style.height = isHub ? '20px' : '12px';
  el.style.backgroundColor = isHub ? '#FFB81C' : '#003B7A';

  new mapboxgl.Marker(el)
    .setLngLat([airport.longitude, airport.latitude])
    .setPopup(popup)
    .addTo(map.current);
});
```

**Usage:**
```jsx
<MapView
  routes={routes}
  airports={airports}
  optimizedRoute={optimizedRoute}
/>
```

### RouteVisualization3D.jsx

**Location:** `src/components/RouteVisualization3D.jsx`

Enhanced 3D flight path visualization with Deck.gl and Mapbox.

**Props:**
- `routes` (Array): Route network
- `airports` (Array): Airport data
- `optimizedRoute` (Object): Route with waypoints and altitude data
- `onViewChange` (Function): Callback to return to 2D view

**State:**
- `selectedRoute` (Object): Selected route
- `mapReady` (boolean): Map initialization
- `show3D` (boolean): 3D mode toggle

**Deck.gl Layers:**

1. **ArcLayer** - Route arcs for network overview
```javascript
new ArcLayer({
  id: 'route-arcs',
  data: routeArcs,
  getSourcePosition: d => d.source,
  getTargetPosition: d => d.target,
  getSourceColor: [0, 102, 204, 150],
  getTargetColor: [0, 150, 255, 150],
  getWidth: 2,
  getHeight: 0.3,
  pickable: true
})
```

2. **PathLayer** - 3D flight path with altitude
```javascript
new PathLayer({
  id: 'flight-path-3d',
  data: [{ path: waypoints.map(wp => wp.position) }],
  getPath: d => d.path,
  getColor: [0, 150, 255, 255],
  getWidth: 5,
  extruded: true,
  billboard: false,
  capRounded: true
})
```

3. **ScatterplotLayer** - Waypoint markers
```javascript
new ScatterplotLayer({
  id: 'waypoints',
  data: waypoints,
  getPosition: d => d.position,
  getFillColor: d =>
    d.type === 'departure' ? [0, 255, 0, 255] :
    d.type === 'arrival' ? [255, 0, 0, 255] :
    [255, 255, 0, 255],
  getRadius: 3000,
  pickable: true
})
```

**Features:**
- 3D/2D view toggle
- Altitude profile display
- Interactive waypoint markers
- Color-coded route segments
- Smooth camera transitions

**Usage:**
```jsx
<RouteVisualization3D
  routes={routes}
  airports={airports}
  optimizedRoute={{
    origin: { lat: 9.0714, lon: -79.3834, altitude: 0, name: 'PTY' },
    destination: { lat: 4.7016, lon: -74.1469, altitude: 0, name: 'BOG' },
    waypoints: [
      { lat: 7.0, lon: -77.0, altitude: 35000, name: 'WP1' },
      { lat: 5.5, lon: -75.5, altitude: 37000, name: 'WP2' }
    ],
    flightLevel: 37000
  }}
  onViewChange={() => setView3D(false)}
/>
```

### AltitudeProfile.jsx

**Location:** `src/components/AltitudeProfile.jsx`

Displays altitude profile chart for flight path.

**Props:**
- `waypoints` (Array): Waypoints with altitude data
- `cruiseAltitude` (number): Target cruise altitude

**Visualization:**
Uses Recharts AreaChart to show altitude progression.

**Usage:**
```jsx
<AltitudeProfile
  waypoints={[
    { name: 'PTY', altitude: 0, type: 'departure' },
    { name: 'WP1', altitude: 35000, type: 'waypoint' },
    { name: 'BOG', altitude: 0, type: 'arrival' }
  ]}
  cruiseAltitude={37000}
/>
```

## Optimization Components

### OptimizationTrigger.jsx

**Location:** `src/components/OptimizationTrigger.jsx`

Manual optimization trigger interface.

**Features:**
- Route selection
- Aircraft type selection
- Departure time picker
- Optimization parameters
- Execution trigger

**State:**
- `selectedRoute` (Object): Selected route
- `selectedAircraft` (string): Aircraft type
- `departureTime` (string): Departure datetime
- `optimizing` (boolean): Optimization in progress

### WindOptimization.jsx

**Location:** `src/components/WindOptimization.jsx`

Wind analysis and altitude optimization interface.

**Features:**
- Route wind analysis
- Altitude comparison
- Time savings calculation
- Wind advantage visualization

**State:**
- `originAirport` (string): Origin IATA code
- `destAirport` (string): Destination IATA code
- `analysis` (Object): Wind analysis results
- `loading` (boolean): Analysis in progress

**Usage:**
```jsx
<WindOptimization />

// Allows user to:
// 1. Select origin/destination
// 2. Analyze wind patterns
// 3. View optimal altitude recommendation
// 4. See time savings estimate
```

### FuelTankering.jsx

**Location:** `src/components/FuelTankering.jsx`

Fuel tankering calculator and recommendation engine.

**Props:**
- `origin` (string): Origin IATA code
- `destination` (string): Destination IATA code
- `aircraftType` (string): Aircraft IATA code
- `distanceNm` (number): Route distance

**State:**
- `analysis` (Object): Tankering analysis result
- `loading` (boolean): Calculation in progress
- `fuelPrices` (Object): Price comparison data

**Calculation Flow:**
1. Fetch fuel prices for both airports
2. Get aircraft specifications
3. Calculate trip fuel requirements
4. Determine tankering capacity
5. Optimize tankering amount
6. Calculate net savings

**Usage:**
```jsx
<FuelTankering
  origin="PTY"
  destination="BOG"
  aircraftType="738"
  distanceNm={562}
/>

// Displays:
// - Fuel price comparison
// - Tankering recommendation
// - Savings estimate
// - Weight penalty analysis
// - Confidence level
```

### FuelPriceManagement.jsx

**Location:** `src/components/FuelPriceManagement.jsx`

Fuel price administration interface.

**Features:**
- View current fuel prices by airport
- Add new fuel prices
- Update existing prices
- Price history charts
- Supplier management

**State:**
- `prices` (Array): Current fuel prices
- `selectedAirport` (string): Airport for detail view
- `editing` (boolean): Edit mode

### TurbulenceAlert.jsx

**Location:** `src/components/TurbulenceAlert.jsx`

Turbulence detection and alert component.

**Props:**
- `route` (Object): Route information
- `cruiseAltitude` (number): Planned cruise altitude

**State:**
- `turbulenceData` (Object): Detection results
- `showDetails` (boolean): Details panel toggle

**Features:**
- Real-time turbulence detection
- Severity classification
- Avoidance recommendations
- Detour cost estimation

**Usage:**
```jsx
<TurbulenceAlert
  route={{ origin: 'PTY', destination: 'BOG' }}
  cruiseAltitude={37000}
/>
```

## Shared Components

### StatCard.jsx

**Location:** `src/components/StatCard.jsx`

Reusable statistics display card.

**Props:**
- `icon` (ReactElement): Icon component
- `label` (string): Stat label
- `value` (string | number): Stat value
- `color` (string): Color theme ('blue', 'green', 'indigo', 'emerald')

**Usage:**
```jsx
<StatCard
  icon={<DollarSign className="w-6 h-6" />}
  label="Total Savings"
  value="$45,230"
  color="green"
/>
```

**Styling:**
Color variants:
- `blue`: `bg-blue-50`, `text-blue-600`
- `green`: `bg-green-50`, `text-green-600`
- `indigo`: `bg-indigo-50`, `text-indigo-600`
- `emerald`: `bg-emerald-50`, `text-emerald-600`

### ExecutionCard.jsx

**Location:** `src/components/ExecutionCard.jsx`

Displays execution summary in a card format.

**Props:**
- `execution` (Object): Execution data from `agent_executions` table

**Displays:**
- Execution ID
- Status badge
- Route information
- Savings estimate
- Confidence score
- Duration
- Timestamp

**Status Colors:**
```javascript
const statusColors = {
  success: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  failure: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-gray-100 text-gray-800'
};
```

**Usage:**
```jsx
<ExecutionCard
  execution={{
    execution_id: 'abc-123',
    status: 'success',
    input_params: { origin: 'PTY', destination: 'BOG' },
    output_data: {
      estimated_savings_usd: 450,
      confidence_score: 0.85
    },
    duration_ms: 1250,
    timestamp: '2024-10-25T14:30:00Z'
  }}
/>
```

## Component Best Practices

### State Management

1. **Local State**: Use `useState` for component-specific state
2. **Effects**: Use `useEffect` for side effects and data fetching
3. **Cleanup**: Always cleanup subscriptions and timers

```javascript
useEffect(() => {
  const channel = supabase.channel('updates').subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Error Handling

```javascript
async function fetchData() {
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    setData(data);
  } catch (error) {
    console.error('Error:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

### Loading States

```javascript
if (loading) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p>Loading...</p>
    </div>
  );
}
```

### Responsive Design

Use Tailwind CSS responsive utilities:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

### Accessibility

1. Use semantic HTML elements
2. Add ARIA labels where needed
3. Ensure keyboard navigation works
4. Maintain sufficient color contrast
5. Provide text alternatives for icons

```jsx
<button
  aria-label="Close modal"
  onClick={handleClose}
>
  ✕
</button>
```

## Testing Components

### Example Test Structure

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(
      <StatCard
        label="Total Flights"
        value="120"
        color="blue"
        icon={<PlaneIcon />}
      />
    );

    expect(screen.getByText('Total Flights')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Memoization

```javascript
import { useMemo, useCallback } from 'react';

const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Virtual Lists

For large datasets, consider using react-window or react-virtualized.

## Styling Guidelines

### Tailwind CSS Classes

- Use utility classes for most styling
- Create custom classes in `index.css` for repeated patterns
- Follow mobile-first responsive design
- Use COPA brand colors consistently

### Custom CSS

```css
/* index.css */
@layer components {
  .btn-primary {
    @apply bg-[#003B7A] text-white px-4 py-2 rounded-lg hover:bg-[#0066CC] transition-colors;
  }
}
```

## Icon Usage

Using lucide-react icons:

```javascript
import { Plane, Map, Settings } from 'lucide-react';

<Plane className="w-6 h-6 text-blue-600" />
```

Common icons:
- `Plane`: Flights, routes
- `Map`: Mapping, location
- `BarChart3`: Analytics, dashboards
- `TrendingUp`: Savings, improvements
- `Wind`: Weather, wind data
- `Fuel`: Fuel operations
- `CheckCircle`: Approvals, success
- `XCircle`: Rejections, errors
- `Clock`: Pending, time
- `AlertCircle`: Warnings, alerts
