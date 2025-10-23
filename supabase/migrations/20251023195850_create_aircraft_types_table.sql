/*
  # Create aircraft_types table

  1. New Tables
    - `aircraft_types`
      - `id` (uuid, primary key)
      - `iata_code` (text, unique) - IATA aircraft type code
      - `icao_code` (text) - ICAO aircraft type code
      - `model` (text) - Aircraft model name
      - `manufacturer` (text) - Aircraft manufacturer
      - `in_copa_fleet` (boolean) - Whether COPA operates this aircraft
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `aircraft_types` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS aircraft_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code text UNIQUE NOT NULL,
  icao_code text NOT NULL,
  model text NOT NULL,
  manufacturer text NOT NULL,
  in_copa_fleet boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aircraft_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view aircraft types"
  ON aircraft_types
  FOR SELECT
  TO public
  USING (true);
