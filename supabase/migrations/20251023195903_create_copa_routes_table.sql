/*
  # Create copa_routes table

  1. New Tables
    - `copa_routes`
      - `id` (uuid, primary key)
      - `origin_iata` (text) - Origin airport IATA code
      - `destination_iata` (text) - Destination airport IATA code
      - `distance_nm` (integer) - Distance in nautical miles
      - `flight_time_hours` (float) - Typical flight time in hours
      - `typical_aircraft_iata` (text) - Typical aircraft used
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `copa_routes` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS copa_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_iata text NOT NULL,
  destination_iata text NOT NULL,
  distance_nm integer NOT NULL,
  flight_time_hours float NOT NULL,
  typical_aircraft_iata text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE copa_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view routes"
  ON copa_routes
  FOR SELECT
  TO public
  USING (true);
