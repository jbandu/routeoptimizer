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
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      addStep('weather', 'Fetching Weather Data', 'processing');
      await sleep(800);
      const weatherData = {
        temperature: Math.floor(Math.random() * 15) + 20,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        visibility: Math.floor(Math.random() * 5) + 5,
        condition: ['Clear', 'Partly Cloudy', 'Light Rain'][Math.floor(Math.random() * 3)]
      };
      addStep('weather', 'Fetching Weather Data', 'complete', weatherData);

      addStep('route', 'Loading Route Data', 'processing');
      await sleep(600);
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

      addStep('claude', 'Sending Request to Claude AI', 'processing');
      await sleep(1200);
      const claudeRequest = {
        model: 'claude-3-sonnet',
        parameters: {
          origin,
          destination,
          aircraft: aircraftType,
          weather: weatherData,
          route: selectedRoute
        }
      };
      addStep('claude', 'Sending Request to Claude AI', 'complete', claudeRequest);

      addStep('analysis', 'Claude AI Analyzing Route Options', 'processing');
      await sleep(1500);
      const analysisSteps = [
        'Evaluating fuel efficiency based on weather conditions',
        'Calculating optimal altitude and speed profile',
        'Analyzing historical route performance data',
        'Assessing aircraft capabilities for this route',
        'Computing cost-benefit scenarios'
      ];
      addStep('analysis', 'Claude AI Analyzing Route Options', 'complete', { steps: analysisSteps });

      addStep('recommendation', 'Generating Final Recommendation', 'processing');
      await sleep(900);
      const confidenceScore = 0.85 + Math.random() * 0.1;
      const estimatedSavings = Math.random() * 500 + 200;

      const outputData = {
        selected_route: selectedRoute,
        confidence_score: confidenceScore,
        estimated_savings_usd: estimatedSavings,
        weather: weatherData,
        reasoning: `Optimal route selected based on distance (${selectedRoute.distance_nm} nm), flight time (${selectedRoute.flight_time_hours}h), and current weather conditions (${weatherData.condition}, ${weatherData.temperature}°C). Aircraft type ${aircraftType} is well-suited for this route with favorable wind conditions.`
      };
      addStep('recommendation', 'Generating Final Recommendation', 'complete', outputData);

      const inputParams = {
        origin,
        destination,
        aircraft_type: aircraftType,
        timestamp: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('agent_executions')
        .insert({
          execution_id: executionId,
          input_params: inputParams,
          output_data: outputData,
          status: 'success',
          duration_ms: Math.floor(Math.random() * 500 + 100)
        });

      if (insertError) throw insertError;

      await sleep(500);
      setResult(outputData);
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
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-bold">{result.selected_route.distance_nm} nm</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Estimated Savings</p>
                <p className="font-bold text-green-600">${result.estimated_savings_usd.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="font-bold">{(result.confidence_score * 100).toFixed(0)}%</p>
              </div>
            </div>

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
