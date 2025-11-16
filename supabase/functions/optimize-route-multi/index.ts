// Supabase Edge Function: Multi-LLM Route Optimization
// Calls multiple LLM providers in parallel and stores results for comparison

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  callMultipleLLMs,
  OptimizationContext,
  LLMProvider,
} from '../_shared/llmIntegration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const { origin, destination, aircraft_type, departure_time } = await req.json();

    if (!origin || !destination || !aircraft_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Multi-LLM optimization request: ${origin} → ${destination}`);

    // Fetch enabled LLM providers from database
    const { data: providers, error: providersError } = await supabase
      .from('llm_providers')
      .select('provider_name, display_name, api_key_encrypted, api_endpoint, default_model, config')
      .eq('is_enabled', true);

    if (providersError || !providers || providers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No LLM providers enabled', details: providersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${providers.length} enabled providers:`, providers.map(p => p.provider_name));

    // Fetch airports
    const { data: originAirport } = await supabase
      .from('airports')
      .select('*')
      .eq('iata', origin)
      .single();

    const { data: destAirport } = await supabase
      .from('airports')
      .select('*')
      .eq('iata', destination)
      .single();

    if (!originAirport || !destAirport) {
      return new Response(
        JSON.stringify({ error: 'Airport not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch route information
    const { data: routeData } = await supabase
      .from('copa_routes')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .single();

    const distance_nm = routeData?.distance_nm || 500;
    const flight_time_hours = routeData?.flight_time_hours || (distance_nm / 450);

    // Fetch wind data along the route
    const minLat = Math.min(originAirport.latitude, destAirport.latitude) - 2;
    const maxLat = Math.max(originAirport.latitude, destAirport.latitude) + 2;
    const minLon = Math.min(originAirport.longitude, destAirport.longitude) - 2;
    const maxLon = Math.max(originAirport.longitude, destAirport.longitude) + 2;

    const { data: windData } = await supabase
      .from('wind_data')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLon)
      .lte('longitude', maxLon)
      .in('altitude_ft', [35000, 37000, 39000, 41000])
      .order('forecast_time', { ascending: false })
      .limit(50);

    // Analyze wind at different altitudes
    const altitudes = [35000, 37000, 39000, 41000];
    const wind_analysis = altitudes.map(alt => {
      const winds = windData?.filter(w => w.altitude_ft === alt) || [];
      const avgSpeed = winds.reduce((sum, w) => sum + (w.wind_speed_kts || 0), 0) / (winds.length || 1);
      const avgDirection = winds.reduce((sum, w) => sum + (w.wind_direction_deg || 0), 0) / (winds.length || 1);

      return {
        altitude_ft: alt,
        avg_wind_speed_kts: Math.round(avgSpeed),
        avg_wind_direction_deg: Math.round(avgDirection),
        sample_count: winds.length
      };
    });

    // Check for turbulence along route
    const { data: turbulenceData } = await supabase
      .from('turbulence_data')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLon)
      .lte('longitude', maxLon)
      .gte('probability', 0.3)
      .order('severity', { ascending: false })
      .limit(10);

    // Build optimization context
    const context: OptimizationContext = {
      origin,
      destination,
      aircraft_type,
      distance_nm,
      flight_time_hours,
      wind_analysis,
      turbulence_data: turbulenceData?.map(t => ({
        location: `${t.latitude.toFixed(2)}, ${t.longitude.toFixed(2)}`,
        altitude_range: `${t.altitude_min_ft}-${t.altitude_max_ft}`,
        severity: t.severity,
        probability: t.probability
      }))
    };

    // Prepare LLM provider configs
    const llmProviders: LLMProvider[] = providers.map(p => {
      let apiKey: string | undefined;

      // Get API keys from environment variables (in production, use Supabase Vault)
      switch (p.provider_name) {
        case 'claude':
          apiKey = Deno.env.get('ANTHROPIC_API_KEY');
          break;
        case 'openai':
          apiKey = Deno.env.get('OPENAI_API_KEY');
          break;
        case 'gemini':
          apiKey = Deno.env.get('GEMINI_API_KEY');
          break;
        case 'grok':
          apiKey = Deno.env.get('GROK_API_KEY');
          break;
        case 'ollama':
          // Ollama doesn't need API key
          apiKey = undefined;
          break;
      }

      return {
        name: p.provider_name,
        model: p.default_model,
        apiKey,
        endpoint: p.api_endpoint
      };
    });

    // Filter out providers without API keys (except Ollama)
    const activeProviders = llmProviders.filter(p =>
      p.apiKey || p.name === 'ollama'
    );

    if (activeProviders.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No API keys configured for enabled providers',
          hint: 'Set environment variables: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, GROK_API_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calling ${activeProviders.length} LLM providers:`, activeProviders.map(p => p.name));

    // Call all LLMs in parallel
    const results = await callMultipleLLMs(context, activeProviders);

    // Generate comparison ID
    const comparison_id = `CMP-${Date.now()}-${origin}-${destination}`;

    // Store comparison in database
    const { data: comparison, error: comparisonError } = await supabase
      .from('optimization_comparisons')
      .insert({
        comparison_id,
        input_params: {
          origin,
          destination,
          aircraft_type,
          departure_time,
          distance_nm,
          flight_time_hours
        }
      })
      .select()
      .single();

    if (comparisonError) {
      console.error('Error storing comparison:', comparisonError);
      return new Response(
        JSON.stringify({ error: 'Failed to store comparison', details: comparisonError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store individual results
    const resultInserts = results.map(r => ({
      comparison_id: comparison.id,
      provider_name: r.provider,
      model_name: r.model,
      output_data: r.result,
      raw_response: r.raw,
      duration_ms: r.duration_ms,
      error_message: r.error,
      status: r.error ? 'error' : 'success'
    }));

    const { error: resultsError } = await supabase
      .from('llm_optimization_results')
      .insert(resultInserts);

    if (resultsError) {
      console.error('Error storing results:', resultsError);
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        comparison_id,
        comparison_uuid: comparison.id,
        results: results.map(r => ({
          provider: r.provider,
          model: r.model,
          duration_ms: r.duration_ms,
          status: r.error ? 'error' : 'success',
          error: r.error,
          result: r.result
        })),
        context: {
          origin: originAirport,
          destination: destAirport,
          route: routeData,
          wind_analysis,
          turbulence_alerts: turbulenceData?.length || 0
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in optimize-route-multi:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
