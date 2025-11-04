# Multi-LLM Route Optimization Feature

## Overview

This feature enables Copa Airlines dispatchers to compare route optimization recommendations from multiple AI providers simultaneously, including Claude (Anthropic), OpenAI, Google Gemini, xAI Grok, and local Ollama models.

## Features

### 1. LLM Configuration Dashboard (`/llm-config`)
- Enable/disable AI providers
- Configure API keys and endpoints
- View available models for each provider
- Test connections
- Cost tracking per provider

### 2. Multi-LLM Comparison (`/multi-compare`)
- Trigger optimization across all enabled LLMs simultaneously
- Parallel processing for fast results
- Flight parameter input (origin, destination, aircraft type)
- Real-time status updates

### 3. Beautiful Comparison Results (`/comparison/:id`)
- Side-by-side comparison of AI recommendations
- Interactive map with route visualization
- Key metrics display:
  - Recommended altitude
  - Fuel savings (lbs)
  - Time impact (minutes)
  - Confidence score
- Detailed AI reasoning
- Alternative altitude suggestions
- Dispatcher selection capability
- Performance metrics (response time, cost)

## Setup Instructions

### 1. Database Migration

Run the migration to create necessary tables:

```bash
# Apply migration via Supabase CLI
supabase db push

# Or manually run the SQL file
psql -h your-db-host -d postgres -f supabase/migrations/20251104000001_add_llm_configuration.sql
```

### 2. Environment Variables

Add the following environment variables to your Supabase project:

**In Supabase Dashboard → Project Settings → Edge Functions → Secrets:**

```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Gemini
GEMINI_API_KEY=AI...

# xAI Grok
GROK_API_KEY=xai-...

# Ollama (local) - optional
# Default endpoint: http://localhost:11434
```

### 3. Deploy Edge Functions

Deploy the new multi-LLM optimization function:

```bash
# Deploy the multi-optimization function
supabase functions deploy optimize-route-multi

# Verify deployment
supabase functions list
```

### 4. Enable LLM Providers

1. Navigate to `/llm-config` in the application
2. Toggle on the providers you want to use
3. Test each connection to verify API keys
4. Configure default models and endpoints

## Usage Guide

### For Dispatchers

#### Running a Multi-LLM Comparison:

1. **Navigate to AI Compare** (`/multi-compare`)
2. **Select Flight Parameters:**
   - Origin airport
   - Destination airport
   - Aircraft type
   - Departure time
3. **Click "Compare X AI Models"** - The system will:
   - Call all enabled LLM providers in parallel
   - Analyze weather, wind, and turbulence data
   - Generate independent recommendations
4. **Review Results** - You'll see:
   - Results ranked by fuel savings (best first)
   - Award badge for top performer
   - Interactive map with route visualization
   - Detailed metrics for each recommendation
5. **Select Best Option** - Click "Select This Recommendation" on your preferred result
6. **Selection Saved** - The system tracks which AI recommendation was chosen

### For Administrators

#### Configuring LLM Providers:

1. **Navigate to LLM Config** (`/llm-config`)
2. **For Each Provider:**
   - Toggle enable/disable
   - Click "Configure" to set custom models or endpoints
   - Click "Test" to verify connectivity
   - View cost per 1K tokens
3. **Monitor Usage:**
   - View active providers count
   - See available models across all providers
   - Check comparison mode readiness

## Supported LLM Providers

### 1. Anthropic Claude
- **Models:** Claude Sonnet 4, Claude Opus 4
- **Strengths:** Detailed reasoning, high accuracy
- **API:** `https://api.anthropic.com/v1/messages`
- **Cost:** ~$3-15 per 1M tokens

### 2. OpenAI
- **Models:** GPT-4 Turbo, GPT-4o, GPT-4o Mini
- **Strengths:** Fast, reliable, well-tested
- **API:** `https://api.openai.com/v1/chat/completions`
- **Cost:** ~$0.15-10 per 1M tokens

### 3. Google Gemini
- **Models:** Gemini 2.0 Flash, Gemini 1.5 Pro
- **Strengths:** Multimodal, cost-effective
- **API:** `https://generativelanguage.googleapis.com/v1beta/models`
- **Cost:** ~$0.075-1.25 per 1M tokens

### 4. xAI Grok
- **Models:** Grok 2, Grok 2 Vision
- **Strengths:** Real-time data, unique perspective
- **API:** `https://api.x.ai/v1/chat/completions`
- **Cost:** ~$5 per 1M tokens

### 5. Ollama (Local)
- **Models:** Llama 3.2, Mistral, Mixtral
- **Strengths:** Free, private, offline capable
- **API:** `http://localhost:11434/api/generate`
- **Cost:** $0 (self-hosted)

## Database Schema

### New Tables

#### `llm_providers`
- Stores configuration for each LLM provider
- Fields: provider_name, display_name, is_enabled, api_key_encrypted, api_endpoint, default_model, config

#### `llm_models`
- Available models for each provider
- Fields: provider_id, model_id, display_name, is_enabled, max_tokens, cost_per_1k_tokens

#### `optimization_comparisons`
- Groups multiple LLM results for comparison
- Fields: comparison_id, input_params, selected_result_id, selected_by

#### `llm_optimization_results`
- Individual optimization results from each LLM
- Fields: comparison_id, provider_name, model_name, output_data, duration_ms, tokens_used, cost_usd, status

## API Endpoints

### `POST /functions/v1/optimize-route-multi`

Triggers multi-LLM optimization.

**Request Body:**
```json
{
  "origin": "PTY",
  "destination": "BOG",
  "aircraft_type": "B738",
  "departure_time": "2025-11-04T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "comparison_id": "CMP-1730736000000-PTY-BOG",
  "comparison_uuid": "uuid-...",
  "results": [
    {
      "provider": "claude",
      "model": "claude-sonnet-4-20250514",
      "duration_ms": 1523,
      "status": "success",
      "result": {
        "recommended_altitude_ft": 39000,
        "estimated_fuel_savings_lbs": 450,
        "estimated_time_savings_minutes": 2.5,
        "confidence_score": 0.92,
        "reasoning": "Based on favorable tailwinds at FL390...",
        "alternative_altitudes": [...]
      }
    },
    // ... more results
  ],
  "context": { ... }
}
```

## Architecture

```
Frontend (React)
  ├── LLMConfiguration.jsx - Admin UI for provider management
  ├── MultiLLMComparison.jsx - Comparison trigger UI
  └── ComparisonResults.jsx - Beautiful results display with maps

Backend (Supabase Edge Functions)
  ├── optimize-route-multi/index.ts - Multi-LLM orchestration
  └── _shared/llmIntegration.ts - LLM abstraction layer

Database (PostgreSQL)
  ├── llm_providers - Provider configuration
  ├── llm_models - Available models
  ├── optimization_comparisons - Comparison sessions
  └── llm_optimization_results - Individual results
```

## Performance Considerations

- **Parallel Processing:** All LLMs are called simultaneously for fast results
- **Timeout Handling:** Individual LLM failures don't block other results
- **Cost Tracking:** Monitor per-request costs across providers
- **Caching:** Results stored for historical comparison and analysis

## Security Notes

- API keys should be stored in Supabase Vault (production)
- Currently using environment variables for simplicity
- Consider implementing rate limiting per provider
- Log all API calls for audit purposes

## Future Enhancements

1. **A/B Testing:** Track which LLM recommendations perform best over time
2. **Ensemble Mode:** Combine multiple LLM recommendations using weighted voting
3. **Custom Models:** Fine-tune models on Copa Airlines historical data
4. **Real-time Streaming:** Stream results as they arrive from each LLM
5. **Cost Optimization:** Auto-select cheapest LLM that meets confidence threshold
6. **Performance Dashboard:** Analytics on LLM accuracy, cost, and speed

## Troubleshooting

### LLM Not Responding
- Check API key is set in Supabase secrets
- Verify endpoint is accessible from edge function
- Check rate limits on API provider

### Comparison Shows No Results
- Ensure at least one provider is enabled in `/llm-config`
- Verify API keys are configured correctly
- Check Supabase function logs for errors

### Results Look Incorrect
- Review wind and weather data quality
- Check LLM prompt formatting in `llmIntegration.ts`
- Validate input parameters (airports, aircraft type)

## Support

For issues or questions:
1. Check Supabase function logs: `supabase functions logs optimize-route-multi`
2. Review browser console for frontend errors
3. Verify database migrations applied correctly
4. Test individual LLM providers in `/llm-config`

---

**Built with ❤️ for Copa Airlines - Powered by Multiple AI Models**
