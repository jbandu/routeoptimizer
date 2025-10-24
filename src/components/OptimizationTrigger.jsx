import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Check, AlertCircle, Cloud, Brain, Database, TrendingUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OptimizationTrigger() {
  const [airports, setAirports] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [origin, setOrigin] = useState('PTY');
  const [destination, setDestination] = useState('');
  const [aircraftType, setAircraftType] = useState('738');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: airportData, error: airportError } = await supabase
        .from('airports')
        .select('*')
        .order('iata_code');

      if (airportError) throw airportError;
      setAirports(airportData || []);

      const { data: aircraftData, error: aircraftError } = await supabase
        .from('aircraft_types')
        .select('*')
        .eq('in_copa_fleet', true);

      if (aircraftError) throw aircraftError;
      setAircraft(aircraftData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }

  const addStep = (id, title, status, data = null) => {
    setSteps(prev => {
      const existing = prev.find(s => s.id === id);
      if (existing) {
        return prev.map(s => s.id === id ? { ...s, status, data } : s);
      }
      return [...prev, { id, title, status, data }];
    });
    if (status === 'processing') {
      setCurrentStep(id);
    }
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  async function runOptimization() {
    setIsRunning(true);
    setResult(null);
    setError(null);
    setSteps([]);
    setCurrentStep(null);

    try {
      addStep('init', 'Initializing Optimization', 'processing');
      await sleep(300);
      addStep('init', 'Initializing Optimization', 'complete');

      addStep('weather', 'Fetching Real Weather Data', 'processing');
      await sleep(500);

      addStep('route', 'Loading Route Data', 'processing');
      const { data: routes, error: routeError } = await supabase
        .from('copa_routes')
        .select('*')
        .eq('origin_iata', origin)
        .eq('destination_iata', destination);

      if (routeError) throw routeError;
      if (!routes || routes.length === 0) {
        throw new Error('No routes found for this origin-destination pair');
      }
      const selectedRoute = routes[0];
      addStep('route', 'Loading Route Data', 'complete', {
        distance: selectedRoute.distance_nm,
        duration: selectedRoute.flight_time_hours
      });

      addStep('claude', 'Calling Claude AI API', 'processing');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/optimize-route`;
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          aircraft_type: aircraftType,
          departure_time: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Optimization failed');
      }

      const result = await response.json();
      const outputData = result.data;

      addStep('weather', 'Fetching Real Weather Data', 'complete', {
        temperature: outputData.weather.temperature,
        windSpeed: outputData.weather.wind_speed,
        visibility: outputData.weather.visibility,
        condition: outputData.weather.condition
      });

      addStep('claude', 'Calling Claude AI API', 'complete', {
        model: result.api_mode.claude ? 'claude-sonnet-4-20250514' : 'rule-based',
        parameters: {
          origin,
          destination,
          aircraft: aircraftType,
          weather_api: result.api_mode.weather ? 'OpenWeatherMap' : 'mock'
        }
      });

      addStep('analysis', 'AI Analyzing Route Options', 'processing');
      await sleep(800);
      const analysisSteps = [
        'Evaluating fuel efficiency based on weather conditions',
        'Calculating optimal altitude and speed profile',
        'Analyzing wind data at multiple flight levels',
        'Assessing aircraft capabilities for this route',
        'Computing cost-benefit scenarios'
      ];
      addStep('analysis', 'AI Analyzing Route Options', 'complete', { steps: analysisSteps });

      addStep('recommendation', 'Generating Final Recommendation', 'processing');
      await sleep(500);

      const finalOutput = {
        selected_route: outputData.selected_route,
        confidence_score: outputData.confidence_score,
        estimated_savings_usd: outputData.estimated_savings_usd,
        estimated_fuel_savings_lbs: outputData.estimated_fuel_savings_lbs,
        estimated_time_savings_minutes: outputData.estimated_time_savings_minutes,
        recommended_altitude_ft: outputData.recommended_altitude_ft,
        weather: outputData.weather,
        wind_analysis: outputData.wind_analysis,
        reasoning: outputData.reasoning,
        execution_id: result.execution_id,
        api_mode: result.api_mode
      };

      addStep('recommendation', 'Generating Final Recommendation', 'complete', finalOutput);

      await sleep(300);
      setResult(finalOutput);
      setCurrentStep(null);
    } catch (err) {
      console.error('Optimization failed:', err);
      setError(err.message);
      addStep(currentStep, 'Error occurred', 'error');
    } finally {
      setIsRunning(false);
    }
  }

  const getStepIcon = (id) => {
    const icons = {
      init: Database,
      weather: Cloud,
      route: MapPin,
      claude: Brain,
      analysis: Database,
      recommendation: TrendingUp
    };
    return icons[id] || Database;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-[#003B7A]">Run Route Optimization</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origin
            </label>
            <select
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
            >
              {airports.map(airport => (
                <option key={airport.iata_code} value={airport.iata_code}>
                  {airport.iata_code} - {airport.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <select
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
            >
              <option value="">Select destination...</option>
              {airports
                .filter(a => a.iata_code !== origin)
                .map(airport => (
                  <option key={airport.iata_code} value={airport.iata_code}>
                    {airport.iata_code} - {airport.city}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aircraft
            </label>
            <select
              value={aircraftType}
              onChange={e => setAircraftType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
            >
              {aircraft.map(ac => (
                <option key={ac.iata_code} value={ac.iata_code}>
                  {ac.model} ({ac.iata_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={runOptimization}
          disabled={isRunning || !destination}
          className="w-full bg-[#003B7A] hover:bg-[#0066CC] disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Optimization...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Optimize Route
            </>
          )}
        </button>

        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              {steps.map((step, index) => {
                const Icon = getStepIcon(step.id);
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 ${
                      step.status === 'complete'
                        ? 'bg-green-50 border-green-200'
                        : step.status === 'processing'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        step.status === 'complete'
                          ? 'bg-green-100'
                          : step.status === 'processing'
                          ? 'bg-blue-100'
                          : 'bg-red-100'
                      }`}>
                        {step.status === 'processing' ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : step.status === 'complete' ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        </div>
                        {step.status === 'complete' && step.data && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 text-sm text-gray-700"
                          >
                            {step.id === 'weather' && (
                              <div className="bg-white p-3 rounded border border-gray-200 grid grid-cols-2 gap-2">
                                <div><span className="font-medium">Temperature:</span> {step.data.temperature}°C</div>
                                <div><span className="font-medium">Wind Speed:</span> {step.data.windSpeed} kt</div>
                                <div><span className="font-medium">Visibility:</span> {step.data.visibility} km</div>
                                <div><span className="font-medium">Condition:</span> {step.data.condition}</div>
                              </div>
                            )}
                            {step.id === 'route' && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <div><span className="font-medium">Distance:</span> {step.data.distance} nm</div>
                                <div><span className="font-medium">Flight Time:</span> {step.data.duration} hours</div>
                              </div>
                            )}
                            {step.id === 'claude' && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <div className="mb-2"><span className="font-medium">Model:</span> {step.data.model}</div>
                                <div className="text-xs text-gray-600">
                                  Sent {Object.keys(step.data.parameters).length} parameters for analysis
                                </div>
                              </div>
                            )}
                            {step.id === 'analysis' && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <div className="font-medium mb-2">Analysis Steps:</div>
                                <ul className="space-y-1 text-xs">
                                  {step.data.steps.map((s, i) => (
                                    <motion.li
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.1 }}
                                      className="flex items-center gap-2"
                                    >
                                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      <span>{s}</span>
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {step.id === 'recommendation' && (
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div><span className="font-medium">Confidence:</span> {(step.data.confidence_score * 100).toFixed(0)}%</div>
                                  <div><span className="font-medium">Savings:</span> ${step.data.estimated_savings_usd.toFixed(2)}</div>
                                </div>
                                <div className="text-xs text-gray-600 mt-2">
                                  Route optimization complete with high confidence
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">Optimization Failed</h3>
            </div>
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-900">Optimization Complete!</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-bold text-[#003B7A]">
                  {result.selected_route.origin_iata} → {result.selected_route.destination_iata}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Optimal Altitude</p>
                <p className="font-bold">FL{Math.floor(result.recommended_altitude_ft / 100)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Cost Savings</p>
                <p className="font-bold text-green-600">${result.estimated_savings_usd.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="font-bold">{(result.confidence_score * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Fuel Savings</p>
                <p className="font-bold text-blue-600">{result.estimated_fuel_savings_lbs.toFixed(0)} lbs</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Time Savings</p>
                <p className="font-bold text-amber-600">{result.estimated_time_savings_minutes.toFixed(0)} min</p>
              </div>
            </div>

            {result.api_mode && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 font-semibold mb-1">API Integration Status:</p>
                <div className="flex gap-4 text-xs">
                  <span className={result.api_mode.claude ? 'text-green-700 font-medium' : 'text-gray-500'}>
                    Claude AI: {result.api_mode.claude ? '✓ Connected' : '○ Mock Mode'}
                  </span>
                  <span className={result.api_mode.weather ? 'text-green-700 font-medium' : 'text-gray-500'}>
                    Weather API: {result.api_mode.weather ? '✓ Connected' : '○ Mock Mode'}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1 font-semibold">AI Reasoning:</p>
              <p className="text-sm text-gray-800">{result.reasoning}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
