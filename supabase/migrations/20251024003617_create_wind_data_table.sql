/*
  # Create wind_data table for weather optimization

  1. New Tables
    - `wind_data`
      - `id` (uuid, primary key) - Unique identifier
      - `latitude` (decimal) - Latitude coordinate
      - `longitude` (decimal) - Longitude coordinate
      - `altitude_ft` (integer) - Flight level in feet
      - `wind_speed_knots` (integer) - Wind speed in knots
      - `wind_direction_degrees` (integer) - Wind direction (0-360)
      - `temperature_celsius` (decimal) - Temperature at altitude
      - `forecast_valid_time` (timestamptz) - When this forecast is valid
      - `data_source` (text) - Source of the data (API, manual, etc)
      - `created_at` (timestamptz) - Record creation time

  2. Indexes
    - Index on latitude, longitude for spatial queries
    - Index on altitude_ft for flight level filtering
    - Index on forecast_valid_time for time-based queries

  3. Security
    - Enable RLS on `wind_data` table
    - Add policy for public read access
    - Add policy for authenticated insert/update

  4. Sample Data
    - Insert mock wind data for common Copa routes
*/

CREATE TABLE IF NOT EXISTS wind_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude decimal(10, 6) NOT NULL,
  longitude decimal(10, 6) NOT NULL,
  altitude_ft integer NOT NULL,
  wind_speed_knots integer NOT NULL,
  wind_direction_degrees integer NOT NULL CHECK (wind_direction_degrees >= 0 AND wind_direction_degrees <= 360),
  temperature_celsius decimal(5, 2) DEFAULT 0,
  forecast_valid_time timestamptz NOT NULL,
  data_source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wind_data_location ON wind_data(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_wind_data_altitude ON wind_data(altitude_ft);
CREATE INDEX IF NOT EXISTS idx_wind_data_forecast_time ON wind_data(forecast_valid_time);

ALTER TABLE wind_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wind data"
  ON wind_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert wind data"
  ON wind_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

INSERT INTO wind_data (latitude, longitude, altitude_ft, wind_speed_knots, wind_direction_degrees, temperature_celsius, forecast_valid_time, data_source)
VALUES
  (9.0, -79.5, 35000, 45, 270, -48, now() + interval '2 hours', 'mock'),
  (9.5, -80.0, 35000, 50, 275, -49, now() + interval '2 hours', 'mock'),
  (10.0, -80.5, 35000, 55, 280, -50, now() + interval '2 hours', 'mock'),
  (10.5, -81.0, 35000, 52, 278, -49, now() + interval '2 hours', 'mock'),
  (11.0, -81.5, 35000, 48, 272, -48, now() + interval '2 hours', 'mock'),
  
  (9.0, -79.5, 37000, 55, 265, -52, now() + interval '2 hours', 'mock'),
  (9.5, -80.0, 37000, 58, 270, -53, now() + interval '2 hours', 'mock'),
  (10.0, -80.5, 37000, 62, 275, -54, now() + interval '2 hours', 'mock'),
  (10.5, -81.0, 37000, 60, 273, -53, now() + interval '2 hours', 'mock'),
  (11.0, -81.5, 37000, 56, 268, -52, now() + interval '2 hours', 'mock'),
  
  (9.0, -79.5, 39000, 65, 260, -56, now() + interval '2 hours', 'mock'),
  (9.5, -80.0, 39000, 68, 265, -57, now() + interval '2 hours', 'mock'),
  (10.0, -80.5, 39000, 72, 270, -58, now() + interval '2 hours', 'mock'),
  (10.5, -81.0, 39000, 70, 268, -57, now() + interval '2 hours', 'mock'),
  (11.0, -81.5, 39000, 66, 263, -56, now() + interval '2 hours', 'mock'),
  
  (9.0, -79.5, 41000, 75, 255, -60, now() + interval '2 hours', 'mock'),
  (9.5, -80.0, 41000, 78, 260, -61, now() + interval '2 hours', 'mock'),
  (10.0, -80.5, 41000, 82, 265, -62, now() + interval '2 hours', 'mock'),
  (10.5, -81.0, 41000, 80, 263, -61, now() + interval '2 hours', 'mock'),
  (11.0, -81.5, 41000, 76, 258, -60, now() + interval '2 hours', 'mock');
