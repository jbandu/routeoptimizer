# Data Model Overview

This document summarizes the Supabase/PostgreSQL schema that powers the COPA Route Optimizer. It is intended to provide developers and analysts with a working understanding of the most important tables, the role each table plays in the product, and notable relationships or constraints. Refer to the SQL files in `supabase/migrations/` for the authoritative definitions.

## Core Execution Tables

### `agent_executions`
Tracks each optimization workflow execution, including metadata required for auditing.

- **Primary key:** `id` (bigint)
- **Identifiers:** `workflow_version_id`, `execution_id` (UUID, unique)
- **Timing:** `started_at`, `completed_at`, `duration_ms`
- **Status:** `status` (enum constraint covering `running`, `success`, `failure`, `fallback`, `timeout`, `cancelled`)
- **Diagnostics:** `metrics`, `input_params`, `output_data`, `error_log`, `fallback_triggered`, `fallback_reason`
- **Operations metadata:** `human_intervention_required`, `executed_by`, `environment`, timestamps

### `optimized_routes`
Stores the result of each optimization run, linking back to the execution metadata and capturing the full flight plan that can be handed off to dispatchers.

- **Primary key:** `id` (bigint)
- **Foreign keys:**
  - `execution_id` → `agent_executions.execution_id`
  - `route_id` → `copa_routes.id`
  - `origin_iata` / `destination_iata` → `airports.iata_code`
  - `aircraft_type_id` → `aircraft_types.id`
- **Operational data:** scheduled times, estimated flight time, cost index, weather/wind metrics, payload information
- **Fuel planning:** required fuel buckets (reserve, alternate, contingency), tankering recommendation fields
- **Cost tracking:** `fuel_cost_usd`, `airport_fees_usd`, `enroute_charges_usd`, `total_trip_cost_usd`, baseline comparison fields
- **Safety/environment:** turbulence indicators, weather summary, optimization versioning
- **Workflow:** status (`pending`, `approved`, `rejected`, `executed`, `cancelled`), approvals, audit timestamps

### `route_performance_actual`
Captures post-flight performance and feedback to compare actual operations with optimized plans.

- **Primary key:** `id` (bigint)
- **Foreign key:** `optimized_route_id` → `optimized_routes.id`
- **Metrics:** actual departure/arrival, block times, fuel burn, savings realized, variances vs. plan
- **Operational notes:** delay reasons, ATC/weather impacts, crew feedback, data quality tag

### `phase1_savings_summary`
Aggregates the realized savings over reporting periods.

- Tracks counts of optimized/executed flights, fuel and cost savings, and average accuracy metrics.

## Network & Reference Data

### `airports`
Master data for airports, including location, operational capabilities, and pricing-relevant information.

- Constraints enforce valid IATA/ICAO codes and latitude/longitude ranges.
- Stores both decimal and degrees/minutes/seconds coordinates, elevation, fees, fuel supplier availability, and operational flags.

### `aircraft_types`
Specifications for each aircraft model in the fleet or under consideration.

- Includes IATA/ICAO codes, capacity figures, performance data (range, cruise speed, MTOW), and fuel capacity metrics.
- Tracks COPA-specific fields such as fleet count and whether the type is in service.

### `copa_fleet`
Inventory of individual aircraft.

- **Foreign keys:** `aircraft_type_id` → `aircraft_types.id`; `current_location_iata` → `airports.iata_code`
- Stores seat configuration, status, maintenance schedule, and usage counters.

### `copa_routes`
Catalog of scheduled or potential routes.

- **Foreign keys:** `origin_iata`, `destination_iata` → `airports.iata_code`; `aircraft_type_id` → `aircraft_types.id`
- Contains distance metrics, typical aircraft, frequency, and routing metadata.

### `route_options`
Alternative routings for a given `copa_routes` entry.

- Captures waypoints, distance, cost estimates, and typical conditions to support scenario planning.

### `flight_schedules`
Regularly scheduled departures and arrivals.

- **Foreign keys:** `origin_iata`, `destination_iata` → `airports`; `aircraft_type_id` → `aircraft_types`
- Includes day-of-week flags, flight duration, and validity windows.

### `wind_data` & `turbulence_data`
Environmental datasets used by the optimizer.

- `wind_data` stores gridded forecast data (direction, speed, temperature, pressure) per altitude and timestamp.
- `turbulence_data` records probabilistic turbulence intensity forecasts with severity categories.

### `weather_cache`
Cached airport weather observations and forecasts, including alerts and expiry timestamps.

### `fuel_prices`
Airport-level fuel price history.

- **Foreign key:** `airport_iata` → `airports.iata_code`
- Supports multiple units (gallon/liter), suppliers, and contract rates.

### `fuel_burn_performance`
Performance lookup table for aircraft type + altitude + speed + weight combinations, capturing expected fuel flow.

### `cost_index_performance`
Defines how cost index settings affect speed and fuel usage by aircraft type.

## Commercial & Pricing Intelligence

### `dynamic_pricing_events`
Captures pricing decisions made for specific flight searches.

- Includes demand indicators (load factor, booking pace), competitor pricing, willingness-to-pay outputs, and the final published price.

### `flight_inventory`
Snapshot of seat availability and booking pace per flight instance.

- Derived fields such as `available_seats` and `load_factor` update automatically from totals.

### `historical_booking_pace`
Aggregated statistics describing booking curves for flights, supporting forecasting and benchmarking.

### `amadeus_api_calls`
Audit trail of external Amadeus API interactions linked to pricing events.

- **Foreign key:** `pricing_event_id` → `dynamic_pricing_events.event_id`
- Tracks latency, status codes, payloads, and retry metadata.

### `competitor_fare_snapshots`
Market fare observations for rival carriers, with refundability and cabin-class annotations.

### `business_rules`
Configuration table for rule-based adjustments applied to routes, fare classes, or channels.

- Stores JSON rule definitions and activation windows.

## Customer Intelligence

### `customer_profiles`
Stores loyalty and behavioral attributes for each customer.

- Includes contact info, tier, loyalty points, booking behavior, segmentation, and churn risk scores.

### `customer_wtp_predictions`
Outputs of willingness-to-pay models per customer and route.

- **Foreign key:** `customer_id` → `customer_profiles.customer_id`
- Captures prediction intervals, feature payloads, model metadata, and validity windows.

### `ml_model_performance`
Evaluation metrics for machine learning models deployed across the platform.

## Economic Analysis

### `route_economics`
Financial analysis per route and analysis date.

- Contains revenue, cost, and margin fields alongside qualitative recommendations and optimizer versioning.

### `phase1_savings_summary`
(See "Core Execution Tables" above.) Provides rolled-up savings metrics for reporting periods.

## Data Imports & Intermediate Tables

### `gad_airports_import`
Temporary staging table for ingesting airport metadata before normalization.

- Maintains both degree/minute/second and decimal coordinate fields for reconciliation.

## Supabase Functions & Views

While not detailed in this overview, the repository also includes SQL migrations for:

- Extending tables with approval workflow fields (`supabase/migrations/20251024230334_add_approval_workflow_fields.sql`)
- Creating summary views such as `phase1_savings_summary` (`supabase/migrations/20251024230358_create_savings_summary_view.sql`)

Refer to the migration files for implementation specifics such as indexes, triggers, or evolving constraints.

## How to Use This Document

- Use the table descriptions to understand how frontend components (e.g., dashboards, approval workflows, optimization triggers) map to backend data sources.
- When adding new features, identify whether data should be stored in existing tables or if a new migration is required.
- Keep this document updated whenever the schema evolves to maintain a reliable knowledge base for the engineering and data teams.
