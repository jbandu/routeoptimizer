/*
  # Add Approval Workflow Fields to Agent Executions

  1. Schema Changes
    - Add approval workflow fields to agent_executions table
    - Add approved_by, approved_at, rejection_reason, execution_notes
    - Update status enum to include 'pending', 'approved', 'rejected'
  
  2. Indexes
    - Add index on status for filtering
    - Add index on timestamp for sorting
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_executions' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE agent_executions ADD COLUMN approved_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_executions' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE agent_executions ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_executions' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE agent_executions ADD COLUMN rejection_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_executions' AND column_name = 'execution_notes'
  ) THEN
    ALTER TABLE agent_executions ADD COLUMN execution_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_executions' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE agent_executions ADD COLUMN urgency text DEFAULT 'NORMAL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_timestamp ON agent_executions(timestamp DESC);

UPDATE agent_executions SET status = 'success' WHERE status IS NULL OR status = '';
