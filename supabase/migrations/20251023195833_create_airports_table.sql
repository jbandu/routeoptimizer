/*
  # Create airports table

  1. New Tables
    - `airports`
      - `id` (uuid, primary key)
      - `iata_code` (text, unique) - 3-letter airport code
      - `name` (text) - Full airport name
      - `city` (text) - City name
      - `country` (text) - Country name
      - `latitude` (float) - Airport latitude
      - `longitude` (float) - Airport longitude
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `airports` table
    - Add policy for public read access (airports are public data)
*/

CREATE TABLE IF NOT EXISTS airports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code text UNIQUE NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  latitude float NOT NULL,
  longitude float NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view airports"
  ON airports
  FOR SELECT
  TO public
  USING (true);
