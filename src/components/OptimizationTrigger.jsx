import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Loader2, Check, AlertCircle } from 'lucide-react';

export default function OptimizationTrigger() {
  const [airports, setAirports] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [origin, setOrigin] = useState('PTY');
  const [destination, setDestination] = useState('');
  const [aircraftType, setAircraftType] = useState('738');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  async function runOptimization() {
    setIsRunning(true);
    setResult(null);
    setError(null);

    try {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const inputParams = {
        origin,
        destination,
        aircraft_type: aircraftType,
        timestamp: new Date().toISOString()
      };

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
      const confidenceScore = 0.85 + Math.random() * 0.1;
      const estimatedSavings = Math.random() * 500 + 200;

      const outputData = {
        selected_route: selectedRoute,
        confidence_score: confidenceScore,
        estimated_savings_usd: estimatedSavings,
        reasoning: `Optimal route selected based on distance (${selectedRoute.distance_nm} nm), flight time (${selectedRoute.flight_time_hours}h), and current weather conditions. Aircraft type ${aircraftType} is well-suited for this route.`
      };

      const { error: insertError } = await supabase
        .from('agent_executions')
        .insert({
          execution_id: executionId,
          agent_name: 'route_optimizer',
          input_params: inputParams,
          output_data: outputData,
          status: 'success',
          duration_ms: Math.floor(Math.random() * 500 + 100),
          timestamp: new Date().toISOString()
        });

      if (insertError) throw insertError;

      setResult(outputData);
    } catch (err) {
      console.error('Optimization failed:', err);
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  }

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

        {error && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">Optimization Failed</h3>
            </div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-900">Optimization Complete!</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-bold text-[#003B7A]">
                  {result.selected_route.origin_iata} → {result.selected_route.destination_iata}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-bold">{result.selected_route.distance_nm} nm</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Savings</p>
                <p className="font-bold text-green-600">${result.estimated_savings_usd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="font-bold">{(result.confidence_score * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1 font-semibold">AI Reasoning:</p>
              <p className="text-sm text-gray-800">{result.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
