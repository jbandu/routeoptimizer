/*
  # Add Fuel Capacity to Aircraft Types

  1. Schema Changes
    - Add `max_fuel_capacity_gallons` column to aircraft_types table
    - Add `fuel_burn_per_nm` column for fuel consumption rate
    - Add `max_payload_lbs` column for weight calculations
    - Add `operating_empty_weight_lbs` column
  
  2. Updates
    - Populate fuel capacity data for Copa fleet aircraft
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aircraft_types' AND column_name = 'max_fuel_capacity_gallons'
  ) THEN
    ALTER TABLE aircraft_types ADD COLUMN max_fuel_capacity_gallons integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aircraft_types' AND column_name = 'fuel_burn_per_nm'
  ) THEN
    ALTER TABLE aircraft_types ADD COLUMN fuel_burn_per_nm numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aircraft_types' AND column_name = 'max_payload_lbs'
  ) THEN
    ALTER TABLE aircraft_types ADD COLUMN max_payload_lbs integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aircraft_types' AND column_name = 'operating_empty_weight_lbs'
  ) THEN
    ALTER TABLE aircraft_types ADD COLUMN operating_empty_weight_lbs integer DEFAULT 0;
  END IF;
END $$;

UPDATE aircraft_types SET 
  max_fuel_capacity_gallons = 6875,
  fuel_burn_per_nm = 4.5,
  max_payload_lbs = 46000,
  operating_empty_weight_lbs = 91300
WHERE iata_code = '738';

UPDATE aircraft_types SET 
  max_fuel_capacity_gallons = 6820,
  fuel_burn_per_nm = 4.3,
  max_payload_lbs = 46000,
  operating_empty_weight_lbs = 90700
WHERE iata_code = '73G';

UPDATE aircraft_types SET 
  max_fuel_capacity_gallons = 7837,
  fuel_burn_per_nm = 4.8,
  max_payload_lbs = 50000,
  operating_empty_weight_lbs = 98500
WHERE iata_code = '739';

UPDATE aircraft_types SET 
  max_fuel_capacity_gallons = 6875,
  fuel_burn_per_nm = 4.4,
  max_payload_lbs = 46000,
  operating_empty_weight_lbs = 91500
WHERE iata_code = '7M8';

UPDATE aircraft_types SET 
  max_fuel_capacity_gallons = 23860,
  fuel_burn_per_nm = 11.5,
  max_payload_lbs = 110000,
  operating_empty_weight_lbs = 250000
WHERE iata_code = '788';

UPDATE aircraft_types SET 
  max_fuel_capacity_gallons = 4720,
  fuel_burn_per_nm = 3.2,
  max_payload_lbs = 32000,
  operating_empty_weight_lbs = 63500
WHERE iata_code = 'E90';
