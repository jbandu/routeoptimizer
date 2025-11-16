// LLM Integration Service - Supports multiple providers
// Handles: Claude, OpenAI, Gemini, Grok, and Ollama

export interface LLMProvider {
  name: string;
  model: string;
  apiKey?: string;
  endpoint?: string;
}

export interface OptimizationContext {
  origin: string;
  destination: string;
  aircraft_type: string;
  distance_nm: number;
  flight_time_hours: number;
  weather_data?: any;
  wind_analysis?: any;
  turbulence_data?: any;
}

export interface OptimizationResult {
  recommended_altitude_ft: number;
  estimated_fuel_savings_lbs: number;
  estimated_time_savings_minutes: number;
  confidence_score: number;
  reasoning: string;
  alternative_altitudes?: Array<{
    altitude_ft: number;
    fuel_savings_lbs: number;
    time_savings_minutes: number;
  }>;
}

/**
 * Build the optimization prompt that works across all LLMs
 */
export function buildOptimizationPrompt(context: OptimizationContext): string {
  const { origin, destination, aircraft_type, distance_nm, flight_time_hours, weather_data, wind_analysis, turbulence_data } = context;

  return `You are an expert flight operations optimizer for Copa Airlines. Analyze the following flight data and recommend the optimal cruising altitude.

FLIGHT DETAILS:
- Route: ${origin} → ${destination}
- Aircraft Type: ${aircraft_type}
- Distance: ${distance_nm} nautical miles
- Estimated Flight Time: ${flight_time_hours.toFixed(2)} hours

WEATHER DATA:
${weather_data ? JSON.stringify(weather_data, null, 2) : 'No weather data available'}

WIND ANALYSIS:
${wind_analysis ? JSON.stringify(wind_analysis, null, 2) : 'No wind analysis available'}

TURBULENCE DATA:
${turbulence_data ? JSON.stringify(turbulence_data, null, 2) : 'No turbulence alerts'}

TASK:
Analyze the weather, wind patterns, and turbulence data to recommend the optimal cruising altitude. Consider:
1. Headwind/tailwind impact on fuel consumption and flight time
2. Turbulence avoidance for passenger comfort
3. Fuel efficiency at different altitudes
4. Time savings or costs

REQUIRED OUTPUT FORMAT (JSON):
{
  "recommended_altitude_ft": <number>,
  "estimated_fuel_savings_lbs": <number>,
  "estimated_time_savings_minutes": <number>,
  "confidence_score": <number between 0 and 1>,
  "reasoning": "<detailed explanation>",
  "alternative_altitudes": [
    {
      "altitude_ft": <number>,
      "fuel_savings_lbs": <number>,
      "time_savings_minutes": <number>
    }
  ]
}

Respond ONLY with valid JSON. No markdown, no explanations outside the JSON structure.`;
}

/**
 * Call Claude API
 */
export async function callClaude(
  prompt: string,
  provider: LLMProvider
): Promise<OptimizationResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: provider.model || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Call OpenAI API
 */
export async function callOpenAI(
  prompt: string,
  provider: LLMProvider
): Promise<OptimizationResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'gpt-4-turbo',
      messages: [{
        role: 'system',
        content: 'You are an expert flight operations optimizer. Respond only with valid JSON.'
      }, {
        role: 'user',
        content: prompt
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return JSON.parse(content);
}

/**
 * Call Google Gemini API
 */
export async function callGemini(
  prompt: string,
  provider: LLMProvider
): Promise<OptimizationResult> {
  const model = provider.model || 'gemini-2.0-flash-exp';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown formatting.'
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Gemini response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Call xAI Grok API
 */
export async function callGrok(
  prompt: string,
  provider: LLMProvider
): Promise<OptimizationResult> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'grok-2-latest',
      messages: [{
        role: 'system',
        content: 'You are an expert flight operations optimizer. Respond only with valid JSON.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Grok response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Call Ollama (local) API
 */
export async function callOllama(
  prompt: string,
  provider: LLMProvider
): Promise<OptimizationResult> {
  const endpoint = provider.endpoint || 'http://localhost:11434';
  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model || 'llama3.2',
      prompt: prompt + '\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown formatting.',
      stream: false,
      format: 'json',
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.response;

  // Ollama should return JSON directly with format: 'json'
  try {
    return JSON.parse(content);
  } catch (e) {
    // Fallback: extract JSON if it's wrapped
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Ollama response');
    }
    return JSON.parse(jsonMatch[0]);
  }
}

/**
 * Universal LLM caller - routes to appropriate provider
 */
export async function callLLM(
  context: OptimizationContext,
  provider: LLMProvider
): Promise<{ result: OptimizationResult; raw: any; tokens?: number }> {
  const prompt = buildOptimizationPrompt(context);
  const startTime = Date.now();

  let result: OptimizationResult;
  let raw: any;

  try {
    switch (provider.name.toLowerCase()) {
      case 'claude':
        result = await callClaude(prompt, provider);
        raw = result;
        break;
      case 'openai':
        result = await callOpenAI(prompt, provider);
        raw = result;
        break;
      case 'gemini':
        result = await callGemini(prompt, provider);
        raw = result;
        break;
      case 'grok':
        result = await callGrok(prompt, provider);
        raw = result;
        break;
      case 'ollama':
        result = await callOllama(prompt, provider);
        raw = result;
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider.name}`);
    }

    const duration = Date.now() - startTime;

    return {
      result,
      raw,
      tokens: undefined // Can be extracted from response metadata if needed
    };
  } catch (error) {
    console.error(`Error calling ${provider.name}:`, error);
    throw error;
  }
}

/**
 * Call multiple LLMs in parallel for comparison
 */
export async function callMultipleLLMs(
  context: OptimizationContext,
  providers: LLMProvider[]
): Promise<Array<{
  provider: string;
  model: string;
  result: OptimizationResult | null;
  error: string | null;
  duration_ms: number;
  raw?: any;
}>> {
  const promises = providers.map(async (provider) => {
    const startTime = Date.now();

    try {
      const { result, raw } = await callLLM(context, provider);
      return {
        provider: provider.name,
        model: provider.model,
        result,
        error: null,
        duration_ms: Date.now() - startTime,
        raw
      };
    } catch (error) {
      return {
        provider: provider.name,
        model: provider.model,
        result: null,
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startTime,
      };
    }
  });

  return await Promise.all(promises);
}
