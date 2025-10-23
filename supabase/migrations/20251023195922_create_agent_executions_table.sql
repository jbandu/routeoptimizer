/*
  # Create agent_executions table

  1. New Tables
    - `agent_executions`
      - `id` (uuid, primary key)
      - `execution_id` (text, unique) - Unique execution identifier
      - `input_params` (jsonb) - Input parameters for the optimization
      - `output_data` (jsonb) - Results of the optimization
      - `status` (text) - Execution status (success, failed, etc.)
      - `duration_ms` (integer) - Execution duration in milliseconds
      - `timestamp` (timestamptz) - When the execution occurred

  2. Security
    - Enable RLS on `agent_executions` table
    - Add policy for public read and insert access
*/

CREATE TABLE IF NOT EXISTS agent_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id text UNIQUE NOT NULL,
  input_params jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  duration_ms integer DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view executions"
  ON agent_executions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert executions"
  ON agent_executions
  FOR INSERT
  TO public
  WITH CHECK (true);
