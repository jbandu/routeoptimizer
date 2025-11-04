-- Create LLM providers configuration table
CREATE TABLE IF NOT EXISTS llm_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(50) NOT NULL UNIQUE, -- claude, openai, gemini, grok, ollama
    display_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    api_key_encrypted TEXT, -- Encrypted API key (use Supabase Vault in production)
    api_endpoint TEXT, -- Custom endpoint (especially for Ollama)
    default_model VARCHAR(100), -- Default model to use
    config JSONB, -- Additional provider-specific configuration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create available models table
CREATE TABLE IF NOT EXISTS llm_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES llm_providers(id) ON DELETE CASCADE,
    model_id VARCHAR(100) NOT NULL, -- e.g., "gpt-4", "claude-sonnet-4"
    display_name VARCHAR(200) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    max_tokens INTEGER,
    cost_per_1k_tokens NUMERIC(10, 6), -- Cost tracking
    capabilities JSONB, -- Features this model supports
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comparison results table for storing multiple LLM responses
CREATE TABLE IF NOT EXISTS optimization_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ID
    input_params JSONB NOT NULL, -- Same params sent to all LLMs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    selected_result_id UUID, -- Which result was chosen by dispatcher
    selected_at TIMESTAMPTZ,
    selected_by VARCHAR(100),
    selection_notes TEXT
);

-- Create individual LLM results within a comparison
CREATE TABLE IF NOT EXISTS llm_optimization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID REFERENCES optimization_comparisons(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    output_data JSONB NOT NULL, -- Standardized output format
    raw_response JSONB, -- Original response from LLM
    duration_ms INTEGER,
    tokens_used INTEGER,
    cost_usd NUMERIC(10, 6),
    error_message TEXT, -- If LLM call failed
    status VARCHAR(20) DEFAULT 'pending', -- pending, success, error
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_llm_providers_enabled ON llm_providers(is_enabled);
CREATE INDEX idx_llm_models_provider ON llm_models(provider_id);
CREATE INDEX idx_optimization_comparisons_created ON optimization_comparisons(created_at DESC);
CREATE INDEX idx_llm_results_comparison ON llm_optimization_results(comparison_id);
CREATE INDEX idx_llm_results_provider ON llm_optimization_results(provider_name);

-- Update trigger for llm_providers
CREATE OR REPLACE FUNCTION update_llm_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_llm_providers_updated_at
    BEFORE UPDATE ON llm_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_llm_providers_updated_at();

-- Insert default LLM providers
INSERT INTO llm_providers (provider_name, display_name, default_model, config) VALUES
    ('claude', 'Anthropic Claude', 'claude-sonnet-4-20250514', '{"streaming": false}'::jsonb),
    ('openai', 'OpenAI', 'gpt-4-turbo', '{"temperature": 0.7}'::jsonb),
    ('gemini', 'Google Gemini', 'gemini-2.0-flash-exp', '{"safety_settings": []}'::jsonb),
    ('grok', 'xAI Grok', 'grok-2-latest', '{"temperature": 0.7}'::jsonb),
    ('ollama', 'Ollama (Local)', 'llama3.2', '{"endpoint": "http://localhost:11434"}'::jsonb)
ON CONFLICT (provider_name) DO NOTHING;

-- Insert default models for each provider
DO $$
DECLARE
    claude_id UUID;
    openai_id UUID;
    gemini_id UUID;
    grok_id UUID;
    ollama_id UUID;
BEGIN
    SELECT id INTO claude_id FROM llm_providers WHERE provider_name = 'claude';
    SELECT id INTO openai_id FROM llm_providers WHERE provider_name = 'openai';
    SELECT id INTO gemini_id FROM llm_providers WHERE provider_name = 'gemini';
    SELECT id INTO grok_id FROM llm_providers WHERE provider_name = 'grok';
    SELECT id INTO ollama_id FROM llm_providers WHERE provider_name = 'ollama';

    -- Claude models
    INSERT INTO llm_models (provider_id, model_id, display_name, max_tokens, cost_per_1k_tokens) VALUES
        (claude_id, 'claude-sonnet-4-20250514', 'Claude Sonnet 4', 8192, 3.0),
        (claude_id, 'claude-opus-4-20250514', 'Claude Opus 4', 8192, 15.0);

    -- OpenAI models
    INSERT INTO llm_models (provider_id, model_id, display_name, max_tokens, cost_per_1k_tokens) VALUES
        (openai_id, 'gpt-4-turbo', 'GPT-4 Turbo', 4096, 10.0),
        (openai_id, 'gpt-4o', 'GPT-4o', 4096, 5.0),
        (openai_id, 'gpt-4o-mini', 'GPT-4o Mini', 4096, 0.15);

    -- Gemini models
    INSERT INTO llm_models (provider_id, model_id, display_name, max_tokens, cost_per_1k_tokens) VALUES
        (gemini_id, 'gemini-2.0-flash-exp', 'Gemini 2.0 Flash', 8192, 0.075),
        (gemini_id, 'gemini-1.5-pro', 'Gemini 1.5 Pro', 8192, 1.25);

    -- Grok models
    INSERT INTO llm_models (provider_id, model_id, display_name, max_tokens, cost_per_1k_tokens) VALUES
        (grok_id, 'grok-2-latest', 'Grok 2', 4096, 5.0),
        (grok_id, 'grok-2-vision-latest', 'Grok 2 Vision', 4096, 5.0);

    -- Ollama models (local, no cost)
    INSERT INTO llm_models (provider_id, model_id, display_name, max_tokens, cost_per_1k_tokens) VALUES
        (ollama_id, 'llama3.2', 'Llama 3.2', 4096, 0.0),
        (ollama_id, 'mistral', 'Mistral', 4096, 0.0),
        (ollama_id, 'mixtral', 'Mixtral', 4096, 0.0);
END $$;

-- Add column to track LLM provider in legacy agent_executions table
ALTER TABLE agent_executions
ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS comparison_id UUID REFERENCES optimization_comparisons(id);

-- Create view for active LLM providers
CREATE OR REPLACE VIEW active_llm_providers AS
SELECT
    p.id,
    p.provider_name,
    p.display_name,
    p.is_enabled,
    p.api_endpoint,
    p.default_model,
    p.config,
    json_agg(
        json_build_object(
            'id', m.id,
            'model_id', m.model_id,
            'display_name', m.display_name,
            'is_enabled', m.is_enabled,
            'max_tokens', m.max_tokens,
            'cost_per_1k_tokens', m.cost_per_1k_tokens
        ) ORDER BY m.cost_per_1k_tokens
    ) FILTER (WHERE m.is_enabled = true) as available_models
FROM llm_providers p
LEFT JOIN llm_models m ON p.id = m.provider_id
WHERE p.is_enabled = true
GROUP BY p.id, p.provider_name, p.display_name, p.is_enabled, p.api_endpoint, p.default_model, p.config;

COMMENT ON TABLE llm_providers IS 'Configuration for different LLM providers (Claude, OpenAI, Gemini, Grok, Ollama)';
COMMENT ON TABLE llm_models IS 'Available models for each LLM provider';
COMMENT ON TABLE optimization_comparisons IS 'Groups multiple LLM optimization results for side-by-side comparison';
COMMENT ON TABLE llm_optimization_results IS 'Individual optimization results from different LLM providers';
