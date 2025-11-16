# API Documentation

## Overview

The COPA Route Optimizer uses Supabase as its backend, providing a PostgreSQL database with real-time capabilities. All data access is handled through the Supabase JavaScript client.

## Table of Contents

- [Configuration](#configuration)
- [Database Tables](#database-tables)
- [API Services](#api-services)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Error Handling](#error-handling)

## Configuration

### Supabase Client Setup

Location: `src/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Environment Variables

Required environment variables in `.env.local`:

```bash
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_MAPBOX_TOKEN=<your-mapbox-token>
```

## Database Tables

### Core Tables

#### `agent_executions`

Tracks each optimization workflow execution with complete audit trail.

**Columns:**
- `id` (bigint, PK): Primary key
- `execution_id` (UUID, unique): Unique execution identifier
- `workflow_version_id` (text): Version identifier for the optimization workflow
- `status` (text): Execution status (`running`, `success`, `failure`, `pending`, `approved`, `rejected`, `cancelled`)
- `timestamp` (timestamptz): Execution start time
- `started_at` (timestamptz): When execution started
- `completed_at` (timestamptz): When execution completed
- `duration_ms` (integer): Execution duration in milliseconds
- `input_params` (jsonb): Input parameters for the optimization
- `output_data` (jsonb): Optimization results
- `metrics` (jsonb): Performance metrics
- `error_log` (text): Error messages if any
- `fallback_triggered` (boolean): Whether fallback was triggered
- `fallback_reason` (text): Reason for fallback
- `human_intervention_required` (boolean): Requires human review
- `executed_by` (text): User or system that executed
- `environment` (text): Execution environment
- `approved_by` (text): Name of approver
- `approved_at` (timestamptz): Approval timestamp
- `rejection_reason` (text): Reason for rejection

**Common Queries:**

```javascript
// Fetch recent executions
const { data, error } = await supabase
  .from('agent_executions')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(10);

// Fetch pending approvals
const { data: pending } = await supabase
  .from('agent_executions')
  .select('*')
  .eq('status', 'pending')
  .order('timestamp', { ascending: false });

// Update execution status
const { error } = await supabase
  .from('agent_executions')
  .update({
    status: 'approved',
    approved_by: 'dispatcher_name',
    approved_at: new Date().toISOString()
  })
  .eq('id', executionId);
```

#### `optimized_routes`

Stores optimized flight route data with full flight plan details.

**Columns:**
- `id` (bigint, PK): Primary key
- `execution_id` (UUID, FK): References agent_executions
- `route_id` (bigint, FK): References copa_routes
- `origin_iata` (text, FK): Origin airport code
- `destination_iata` (text, FK): Destination airport code
- `aircraft_type_id` (bigint, FK): Aircraft type
- `scheduled_departure` (timestamptz): Scheduled departure time
- `scheduled_arrival` (timestamptz): Scheduled arrival time
- `estimated_flight_time_minutes` (integer): Flight duration
- `cost_index` (integer): Cost index used
- `fuel_required_lbs` (numeric): Total fuel required
- `fuel_reserve_lbs` (numeric): Reserve fuel
- `fuel_alternate_lbs` (numeric): Alternate airport fuel
- `fuel_contingency_lbs` (numeric): Contingency fuel
- `tankering_recommended` (boolean): Tankering recommendation
- `tankering_amount_lbs` (numeric): Recommended tankering amount
- `fuel_cost_usd` (numeric): Fuel cost
- `total_trip_cost_usd` (numeric): Total trip cost
- `baseline_cost_usd` (numeric): Baseline cost for comparison
- `estimated_savings_usd` (numeric): Estimated savings
- `turbulence_level` (text): Turbulence severity
- `weather_summary` (text): Weather conditions
- `status` (text): Route status (`pending`, `approved`, `rejected`, `executed`)

#### `copa_routes`

Catalog of COPA Airlines routes.

**Columns:**
- `id` (bigint, PK): Primary key
- `origin_iata` (text, FK): Origin airport code
- `destination_iata` (text, FK): Destination airport code
- `distance_nm` (numeric): Distance in nautical miles
- `flight_time_hours` (numeric): Typical flight time
- `typical_aircraft_iata` (text): Common aircraft type
- `frequency` (text): Flight frequency
- `active` (boolean): Route is active

**Common Queries:**

```javascript
// Fetch all active routes
const { data: routes } = await supabase
  .from('copa_routes')
  .select('*')
  .eq('active', true);

// Fetch routes by origin
const { data } = await supabase
  .from('copa_routes')
  .select('*')
  .eq('origin_iata', 'PTY');
```

#### `airports`

Master airport data with location and operational information.

**Columns:**
- `id` (bigint, PK): Primary key
- `iata_code` (text, unique): 3-letter IATA code
- `icao_code` (text, unique): 4-letter ICAO code
- `name` (text): Airport name
- `city` (text): City name
- `country` (text): Country name
- `latitude` (numeric): Latitude in decimal degrees
- `longitude` (numeric): Longitude in decimal degrees
- `elevation_ft` (integer): Elevation in feet
- `timezone` (text): Timezone identifier
- `fuel_available` (boolean): Fuel availability
- `landing_fee_usd` (numeric): Landing fees

**Common Queries:**

```javascript
// Fetch all airports
const { data: airports } = await supabase
  .from('airports')
  .select('*');

// Find airport by IATA code
const { data: airport } = await supabase
  .from('airports')
  .select('*')
  .eq('iata_code', 'PTY')
  .single();
```

#### `aircraft_types`

Aircraft specifications and performance data.

**Columns:**
- `id` (bigint, PK): Primary key
- `iata_code` (text): IATA aircraft type code
- `icao_code` (text): ICAO aircraft type code
- `manufacturer` (text): Manufacturer name
- `model` (text): Aircraft model
- `passenger_capacity` (integer): Passenger capacity
- `cargo_capacity_lbs` (integer): Cargo capacity
- `range_nm` (integer): Maximum range
- `cruise_speed_knots` (integer): Cruise speed
- `max_fuel_capacity_gallons` (numeric): Fuel capacity
- `fuel_burn_per_nm` (numeric): Fuel burn rate
- `operating_empty_weight_lbs` (integer): Empty weight
- `max_takeoff_weight_lbs` (integer): MTOW
- `in_service` (boolean): Currently in service

**Common Queries:**

```javascript
// Get aircraft type details
const { data: aircraft } = await supabase
  .from('aircraft_types')
  .select('*')
  .eq('iata_code', '738')
  .single();

// List all active aircraft
const { data: fleet } = await supabase
  .from('aircraft_types')
  .select('*')
  .eq('in_service', true);
```

### Environmental Data Tables

#### `wind_data`

Gridded wind forecast data for route optimization.

**Columns:**
- `id` (bigint, PK): Primary key
- `latitude` (numeric): Latitude
- `longitude` (numeric): Longitude
- `altitude_ft` (integer): Altitude in feet
- `wind_speed_knots` (numeric): Wind speed
- `wind_direction_degrees` (integer): Wind direction
- `temperature_celsius` (numeric): Temperature
- `pressure_mb` (numeric): Atmospheric pressure
- `forecast_valid_time` (timestamptz): Forecast validity time
- `data_source` (text): Data source identifier

**Common Queries:**

```javascript
// Get wind data for route corridor
const { data, error } = await supabase
  .from('wind_data')
  .select('*')
  .gte('latitude', minLat)
  .lte('latitude', maxLat)
  .gte('longitude', minLon)
  .lte('longitude', maxLon)
  .in('altitude_ft', [35000, 37000, 39000, 41000])
  .gte('forecast_valid_time', new Date().toISOString())
  .order('forecast_valid_time', { ascending: true })
  .limit(100);
```

#### `turbulence_data`

Turbulence forecast data for safety analysis.

**Columns:**
- `id` (bigint, PK): Primary key
- `latitude` (numeric): Latitude
- `longitude` (numeric): Longitude
- `altitude_ft` (integer): Altitude
- `altitude_range_ft` (integer): Altitude range
- `severity` (text): Turbulence severity (`LIGHT`, `MODERATE`, `SEVERE`)
- `probability` (numeric): Probability (0-1)
- `area_radius_nm` (numeric): Affected area radius
- `forecast_expires` (timestamptz): Forecast expiry time
- `data_source` (text): Data source

**Common Queries:**

```javascript
// Detect turbulence along route
const { data, error } = await supabase
  .from('turbulence_data')
  .select('*')
  .gte('latitude', minLat)
  .lte('latitude', maxLat)
  .gte('longitude', minLon)
  .lte('longitude', maxLon)
  .gte('altitude_ft', cruiseAltitude - 2000)
  .lte('altitude_ft', cruiseAltitude + 2000)
  .gte('forecast_expires', new Date().toISOString())
  .order('probability', { ascending: false });
```

#### `fuel_prices`

Airport fuel price history.

**Columns:**
- `id` (bigint, PK): Primary key
- `airport_iata` (text, FK): Airport code
- `price_per_gallon` (numeric): Price per gallon (USD)
- `price_per_liter` (numeric): Price per liter (USD)
- `effective_date` (date): Effective date
- `supplier` (text): Fuel supplier
- `contract_rate` (boolean): Contract vs spot rate

**Common Queries:**

```javascript
// Get latest fuel price
const { data: price } = await supabase
  .rpc('get_latest_fuel_price', { airport_code: 'PTY' })
  .single();

// Get price history
const { data } = await supabase
  .from('fuel_prices')
  .select('*')
  .eq('airport_iata', 'PTY')
  .gte('effective_date', thirtyDaysAgo)
  .order('effective_date', { ascending: true });
```

## API Services

### Fuel Service

Location: `src/services/fuelService.js`

#### `getFuelPriceComparison(originIata, destinationIata)`

Compares fuel prices between two airports.

**Parameters:**
- `originIata` (string): Origin airport IATA code
- `destinationIata` (string): Destination airport IATA code

**Returns:** Promise<Object | null>
```javascript
{
  origin: {
    airport: string,
    pricePerGallon: number,
    pricePerLiter: number,
    supplier: string,
    effectiveDate: string
  },
  destination: {
    airport: string,
    pricePerGallon: number,
    pricePerLiter: number,
    supplier: string,
    effectiveDate: string
  },
  difference: {
    perGallon: number,
    percentage: number
  }
}
```

**Example:**
```javascript
import { getFuelPriceComparison } from './services/fuelService';

const comparison = await getFuelPriceComparison('PTY', 'BOG');
console.log(`Price difference: $${comparison.difference.perGallon}/gal`);
```

#### `calculateTankering(originIata, destinationIata, aircraftType, distanceNm)`

Calculates optimal fuel tankering recommendation.

**Parameters:**
- `originIata` (string): Origin airport code
- `destinationIata` (string): Destination airport code
- `aircraftType` (string): Aircraft type IATA code
- `distanceNm` (number): Route distance in nautical miles

**Returns:** Promise<Object | null>
```javascript
{
  recommended: boolean,
  reason: string,
  tankerAmountGallons?: number,
  tankerAmountLbs?: number,
  savings?: number,
  breakdown?: {
    tripFuelGallons: number,
    reserveFuelGallons: number,
    requiredFuelGallons: number,
    maxCapacityGallons: number,
    grossSavings: number,
    weightPenaltyCost: number,
    extraBurnGallons: number
  },
  fuelComparison?: Object,
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW'
}
```

**Example:**
```javascript
import { calculateTankering } from './services/fuelService';

const analysis = await calculateTankering('PTY', 'BOG', '738', 562);
if (analysis.recommended) {
  console.log(`Tanker ${analysis.tankerAmountGallons} gallons for $${analysis.savings} savings`);
}
```

#### `getFuelPriceHistory(airportIata, days = 30)`

Retrieves historical fuel price data.

**Parameters:**
- `airportIata` (string): Airport code
- `days` (number): Number of days to look back (default: 30)

**Returns:** Promise<Array>
```javascript
[
  {
    date: string,
    pricePerGallon: number,
    supplier: string
  }
]
```

### Weather Service

Location: `src/services/weatherService.js`

#### `weatherService.getWindData(originLat, originLon, destLat, destLon, altitudes)`

Fetches wind data for a route corridor.

**Parameters:**
- `originLat` (number): Origin latitude
- `originLon` (number): Origin longitude
- `destLat` (number): Destination latitude
- `destLon` (number): Destination longitude
- `altitudes` (Array<number>): Altitude levels (default: [35000, 37000, 39000, 41000])

**Returns:** Promise<Array>

#### `weatherService.calculateGreatCircleWaypoints(originLat, originLon, destLat, destLon, numWaypoints)`

Calculates great circle waypoints between two points.

**Parameters:**
- `originLat` (number): Origin latitude
- `originLon` (number): Origin longitude
- `destLat` (number): Destination latitude
- `destLon` (number): Destination longitude
- `numWaypoints` (number): Number of waypoints (default: 5)

**Returns:** Array<Object>
```javascript
[
  {
    latitude: number,
    longitude: number,
    index: number
  }
]
```

#### `weatherService.analyzeRouteWinds(originAirport, destAirport)`

Analyzes wind patterns along route and recommends optimal altitude.

**Parameters:**
- `originAirport` (Object): Origin airport with latitude/longitude
- `destAirport` (Object): Destination airport with latitude/longitude

**Returns:** Promise<Object>
```javascript
{
  waypoints: Array,
  windData: Array,
  courseDirection: number,
  altitudeAnalysis: Array,
  optimalAltitude: number,
  avgTailwind: number,
  timeSavingsMinutes: number,
  windAdvantageKnots: number
}
```

**Example:**
```javascript
import { weatherService } from './services/weatherService';

const analysis = await weatherService.analyzeRouteWinds(
  { latitude: 9.0714, longitude: -79.3834 }, // PTY
  { latitude: 4.7016, longitude: -74.1469 }  // BOG
);
console.log(`Optimal altitude: ${analysis.optimalAltitude}ft`);
console.log(`Time savings: ${analysis.timeSavingsMinutes} minutes`);
```

### Turbulence Service

Location: `src/services/turbulenceService.js`

#### `detectTurbulenceAlongRoute(originLat, originLon, destLat, destLon, cruiseAltitudeFt)`

Detects turbulence zones along a flight route.

**Parameters:**
- `originLat` (number): Origin latitude
- `originLon` (number): Origin longitude
- `destLat` (number): Destination latitude
- `destLon` (number): Destination longitude
- `cruiseAltitudeFt` (number): Cruise altitude in feet

**Returns:** Promise<Object>
```javascript
{
  detected: boolean,
  zones: Array<{
    id: number,
    location: { latitude: number, longitude: number },
    altitude: number,
    altitudeRange: number,
    severity: 'LIGHT' | 'MODERATE' | 'SEVERE',
    probability: number,
    radiusNm: number,
    validUntil: string,
    dataSource: string
  }>,
  recommendation: 'NO_ACTION' | 'MONITOR' | 'CONSIDER_AVOIDANCE' | 'AVOID',
  message: string,
  summary: {
    severe: number,
    moderate: number,
    light: number
  }
}
```

**Example:**
```javascript
import { detectTurbulenceAlongRoute } from './services/turbulenceService';

const turbulence = await detectTurbulenceAlongRoute(
  9.0714, -79.3834,  // PTY
  4.7016, -74.1469,  // BOG
  37000
);

if (turbulence.detected) {
  console.log(turbulence.message);
  console.log(`Recommendation: ${turbulence.recommendation}`);
}
```

#### `estimateDetourCost(turbulenceZone, routeDistanceNm, fuelBurnPerNm)`

Estimates the cost of detouring around a turbulence zone.

**Parameters:**
- `turbulenceZone` (Object): Turbulence zone data
- `routeDistanceNm` (number): Route distance
- `fuelBurnPerNm` (number): Aircraft fuel burn rate

**Returns:** Object
```javascript
{
  detourDistanceNm: number,
  additionalFuelGallons: number,
  additionalTimeMinutes: number
}
```

## Real-time Subscriptions

Supabase provides real-time database change notifications.

### Subscribe to Agent Executions

```javascript
const channel = supabase
  .channel('agent_executions')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'agent_executions'
    },
    (payload) => {
      console.log('New execution:', payload);
      // Handle new execution
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### Subscribe to Route Updates

```javascript
const channel = supabase
  .channel('optimized_routes')
  .on('postgres_changes',
    {
      event: '*', // All events (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'optimized_routes'
    },
    (payload) => {
      console.log('Route change:', payload);
    }
  )
  .subscribe();
```

## Error Handling

### Standard Error Pattern

```javascript
async function fetchData() {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*');

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null; // or throw error
  }
}
```

### Error Types

- **Network Errors**: Connection failures, timeouts
- **Authentication Errors**: Invalid credentials, expired tokens
- **Permission Errors**: Insufficient RLS permissions
- **Validation Errors**: Invalid data format
- **Not Found Errors**: Record doesn't exist

### Best Practices

1. **Always check for errors** in Supabase responses
2. **Use try-catch blocks** for async operations
3. **Provide user-friendly error messages**
4. **Log errors** for debugging
5. **Handle null/undefined** data gracefully
6. **Validate input** before database operations
7. **Use transactions** for multi-step operations
8. **Implement retry logic** for transient failures

## Rate Limiting

Supabase enforces rate limits based on your plan:
- Free tier: 500 requests/second
- Pro tier: 1000 requests/second
- Enterprise: Custom limits

Implement client-side throttling for high-frequency operations.

## Security

### Row Level Security (RLS)

Ensure RLS policies are configured for all tables to prevent unauthorized access.

### API Keys

- **Anon Key**: Public key for client-side operations
- **Service Role Key**: Private key for server-side operations (never expose)

### Best Practices

1. Never commit API keys to version control
2. Use environment variables for configuration
3. Implement proper authentication
4. Validate and sanitize user input
5. Use parameterized queries
6. Enable RLS on all tables
7. Audit access logs regularly
