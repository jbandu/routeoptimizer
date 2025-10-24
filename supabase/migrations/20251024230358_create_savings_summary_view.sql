/*
  # Create Savings Summary Views and Aggregations

  1. New Table
    - `phase1_savings_summary` - Aggregated daily savings data
  
  2. Views
    - `v_recent_optimizations` - Recent optimizations with computed fields
    - `v_optimization_stats` - Aggregate statistics
  
  3. Functions
    - `calculate_daily_savings()` - Calculate and store daily aggregates
*/

CREATE TABLE IF NOT EXISTS phase1_savings_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_optimizations integer DEFAULT 0,
  total_savings_usd numeric DEFAULT 0,
  wind_savings_usd numeric DEFAULT 0,
  fuel_savings_usd numeric DEFAULT 0,
  turbulence_savings_usd numeric DEFAULT 0,
  avg_confidence numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE phase1_savings_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read savings summary"
  ON phase1_savings_summary
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert savings summary"
  ON phase1_savings_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update savings summary"
  ON phase1_savings_summary
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE VIEW v_recent_optimizations AS
SELECT 
  ae.id,
  ae.execution_id,
  ae.input_params->>'origin' as origin,
  ae.input_params->>'destination' as destination,
  ae.input_params->>'aircraft_type' as aircraft_type,
  COALESCE((ae.output_data->>'estimated_savings_usd')::numeric, 0) as savings_usd,
  COALESCE((ae.output_data->>'confidence_score')::numeric, 0) as confidence_score,
  ae.status,
  ae.timestamp,
  ae.duration_ms,
  ae.approved_by,
  ae.approved_at,
  ae.urgency
FROM agent_executions ae
WHERE ae.status IN ('success', 'pending', 'approved', 'rejected')
ORDER BY ae.timestamp DESC
LIMIT 50;

CREATE OR REPLACE VIEW v_optimization_stats AS
SELECT 
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'success') as success_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric), 0) as total_savings,
  COALESCE(AVG((output_data->>'estimated_savings_usd')::numeric), 0) as avg_savings,
  COALESCE(AVG((output_data->>'confidence_score')::numeric), 0) as avg_confidence
FROM agent_executions
WHERE status IN ('success', 'approved')
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days';

CREATE OR REPLACE FUNCTION calculate_daily_savings()
RETURNS void AS $$
BEGIN
  INSERT INTO phase1_savings_summary (
    date,
    total_optimizations,
    total_savings_usd,
    wind_savings_usd,
    fuel_savings_usd,
    turbulence_savings_usd,
    avg_confidence,
    updated_at
  )
  SELECT
    DATE(timestamp) as date,
    COUNT(*) as total_optimizations,
    COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric), 0) as total_savings_usd,
    COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric * 0.4), 0) as wind_savings_usd,
    COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric * 0.5), 0) as fuel_savings_usd,
    COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric * 0.1), 0) as turbulence_savings_usd,
    COALESCE(AVG((output_data->>'confidence_score')::numeric), 0) as avg_confidence,
    NOW() as updated_at
  FROM agent_executions
  WHERE status IN ('success', 'approved')
    AND DATE(timestamp) = CURRENT_DATE
  GROUP BY DATE(timestamp)
  ON CONFLICT (date)
  DO UPDATE SET
    total_optimizations = EXCLUDED.total_optimizations,
    total_savings_usd = EXCLUDED.total_savings_usd,
    wind_savings_usd = EXCLUDED.wind_savings_usd,
    fuel_savings_usd = EXCLUDED.fuel_savings_usd,
    turbulence_savings_usd = EXCLUDED.turbulence_savings_usd,
    avg_confidence = EXCLUDED.avg_confidence,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

INSERT INTO phase1_savings_summary (date, total_optimizations, total_savings_usd, wind_savings_usd, fuel_savings_usd, turbulence_savings_usd, avg_confidence)
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_optimizations,
  COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric), 0) as total_savings_usd,
  COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric * 0.4), 0) as wind_savings_usd,
  COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric * 0.5), 0) as fuel_savings_usd,
  COALESCE(SUM((output_data->>'estimated_savings_usd')::numeric * 0.1), 0) as turbulence_savings_usd,
  COALESCE(AVG((output_data->>'confidence_score')::numeric), 0) as avg_confidence
FROM agent_executions
WHERE status IN ('success', 'approved')
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ON CONFLICT (date) DO NOTHING;
