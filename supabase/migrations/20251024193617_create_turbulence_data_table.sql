/*
  # Create Turbulence Data Table

  1. New Tables
    - `turbulence_data`
      - `id` (uuid, primary key)
      - `latitude` (numeric) - Center latitude of turbulence zone
      - `longitude` (numeric) - Center longitude of turbulence zone
      - `altitude_ft` (integer) - Altitude in feet
      - `altitude_range_ft` (integer) - Vertical extent (±)
      - `severity` (text) - LIGHT, MODERATE, SEVERE
      - `probability` (numeric) - 0.0 to 1.0
      - `area_radius_nm` (integer) - Radius in nautical miles
      - `forecast_valid_time` (timestamptz) - When forecast is valid
      - `forecast_expires` (timestamptz) - When forecast expires
      - `data_source` (text) - Source of turbulence data
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `turbulence_data` table
    - Add policy for public read access
    - Add policy for authenticated insert/update
    
  3. Indexes
    - Index on latitude/longitude for spatial queries
    - Index on altitude_ft for altitude filtering
    - Index on forecast_valid_time for time-based queries
    
  4. Sample Data
    - Add sample turbulence zones along common Copa routes
*/

CREATE TABLE IF NOT EXISTS turbulence_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  altitude_ft integer NOT NULL CHECK (altitude_ft >= 0),
  altitude_range_ft integer DEFAULT 2000 CHECK (altitude_range_ft >= 0),
  severity text NOT NULL CHECK (severity IN ('LIGHT', 'MODERATE', 'SEVERE')),
  probability numeric NOT NULL DEFAULT 0.5 CHECK (probability >= 0 AND probability <= 1),
  area_radius_nm integer DEFAULT 50 CHECK (area_radius_nm >= 0),
  forecast_valid_time timestamptz NOT NULL,
  forecast_expires timestamptz NOT NULL,
  data_source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE turbulence_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read turbulence data"
  ON turbulence_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert turbulence data"
  ON turbulence_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update turbulence data"
  ON turbulence_data
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_turbulence_lat ON turbulence_data(latitude);
CREATE INDEX IF NOT EXISTS idx_turbulence_lon ON turbulence_data(longitude);
CREATE INDEX IF NOT EXISTS idx_turbulence_altitude ON turbulence_data(altitude_ft);
CREATE INDEX IF NOT EXISTS idx_turbulence_valid_time ON turbulence_data(forecast_valid_time);

INSERT INTO turbulence_data (
  latitude, 
  longitude, 
  altitude_ft, 
  altitude_range_ft, 
  severity, 
  probability, 
  area_radius_nm, 
  forecast_valid_time, 
  forecast_expires,
  data_source
)
VALUES
  (12.5, -85.0, 37000, 2000, 'MODERATE', 0.75, 80, now() - interval '1 hour', now() + interval '5 hours', 'NOAA GTG'),
  (15.2, -89.3, 35000, 3000, 'LIGHT', 0.60, 60, now() - interval '30 minutes', now() + interval '6 hours', 'PIREP'),
  (8.7, -82.5, 39000, 1500, 'LIGHT', 0.50, 50, now() - interval '2 hours', now() + interval '4 hours', 'NOAA GTG'),
  (4.5, -75.8, 38000, 2500, 'SEVERE', 0.85, 100, now() - interval '15 minutes', now() + interval '3 hours', 'PIREP'),
  (10.3, -84.9, 36000, 2000, 'MODERATE', 0.70, 70, now() - interval '45 minutes', now() + interval '5 hours', 'NOAA GTG'),
  (18.5, -98.2, 41000, 2000, 'LIGHT', 0.55, 65, now() - interval '1 hour', now() + interval '6 hours', 'PIREP'),
  (-12.0, -77.0, 37000, 2000, 'MODERATE', 0.80, 90, now() - interval '30 minutes', now() + interval '4 hours', 'NOAA GTG'),
  (6.2, -75.5, 35000, 3000, 'LIGHT', 0.65, 55, now() - interval '2 hours', now() + interval '5 hours', 'PIREP'),
  (19.4, -99.1, 39000, 2000, 'MODERATE', 0.72, 75, now() - interval '1 hour', now() + interval '6 hours', 'NOAA GTG'),
  (-33.4, -70.7, 38000, 2500, 'LIGHT', 0.58, 60, now() - interval '3 hours', now() + interval '3 hours', 'PIREP')
ON CONFLICT DO NOTHING;
