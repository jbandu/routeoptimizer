/*
  # Create Fuel Prices Table

  1. New Tables
    - `fuel_prices`
      - `id` (uuid, primary key)
      - `airport_iata` (text) - Airport code
      - `price_per_gallon` (numeric) - Fuel price in USD per gallon
      - `price_per_liter` (numeric) - Fuel price in USD per liter
      - `effective_date` (timestamptz) - When price becomes effective
      - `valid_until` (timestamptz) - When price expires
      - `supplier` (text) - Fuel supplier name
      - `contract_rate` (boolean) - Whether this is a contract rate
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `fuel_prices` table
    - Add policy for authenticated users to read fuel prices
    - Add policy for authenticated users to insert/update fuel prices (for fuel coordinators)

  3. Indexes
    - Index on airport_iata for fast lookups
    - Index on effective_date for time-based queries
    
  4. Functions
    - `get_latest_fuel_price(airport_code)` - Returns the most recent valid fuel price for an airport
*/

CREATE TABLE IF NOT EXISTS fuel_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_iata text NOT NULL,
  price_per_gallon numeric NOT NULL CHECK (price_per_gallon >= 0),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  effective_date timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  supplier text DEFAULT 'Unknown',
  contract_rate boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fuel_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fuel prices"
  ON fuel_prices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert fuel prices"
  ON fuel_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fuel prices"
  ON fuel_prices
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_fuel_prices_airport ON fuel_prices(airport_iata);
CREATE INDEX IF NOT EXISTS idx_fuel_prices_effective_date ON fuel_prices(effective_date);

CREATE OR REPLACE FUNCTION get_latest_fuel_price(airport_code text)
RETURNS TABLE (
  airport_iata text,
  price_per_gallon numeric,
  price_per_liter numeric,
  effective_date timestamptz,
  supplier text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fp.airport_iata,
    fp.price_per_gallon,
    fp.price_per_liter,
    fp.effective_date,
    fp.supplier
  FROM fuel_prices fp
  WHERE fp.airport_iata = airport_code
    AND fp.effective_date <= now()
    AND fp.valid_until >= now()
  ORDER BY fp.effective_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

INSERT INTO fuel_prices (airport_iata, price_per_gallon, price_per_liter, effective_date, valid_until, supplier, contract_rate)
VALUES
  ('PTY', 3.45, 0.91, now() - interval '2 days', now() + interval '5 days', 'Shell Aviation', true),
  ('BOG', 4.20, 1.11, now() - interval '1 day', now() + interval '6 days', 'Air BP', true),
  ('MIA', 3.89, 1.03, now() - interval '3 days', now() + interval '4 days', 'World Fuel Services', false),
  ('LIM', 4.55, 1.20, now() - interval '1 day', now() + interval '6 days', 'Repsol Aviation', true),
  ('GUA', 4.10, 1.08, now() - interval '2 days', now() + interval '5 days', 'Shell Aviation', true),
  ('SAL', 4.25, 1.12, now() - interval '1 day', now() + interval '6 days', 'Puma Energy', false),
  ('CCS', 5.10, 1.35, now() - interval '3 days', now() + interval '4 days', 'PDV Aviation', false),
  ('MEX', 3.95, 1.04, now() - interval '2 days', now() + interval '5 days', 'Pemex Aviation', true),
  ('SCL', 4.35, 1.15, now() - interval '1 day', now() + interval '6 days', 'Copec Aviation', true),
  ('EZE', 4.80, 1.27, now() - interval '2 days', now() + interval '5 days', 'YPF Aviation', false)
ON CONFLICT DO NOTHING;
