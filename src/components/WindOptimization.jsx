import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { weatherService } from '../services/weatherService';
import { Wind, TrendingUp, Clock, Plane, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function WindOptimization() {
  const [airports, setAirports] = useState([]);
  const [origin, setOrigin] = useState('PTY');
  const [destination, setDestination] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAirports();
  }, []);

  async function fetchAirports() {
    try {
      const { data, error } = await supabase
        .from('airports')
        .select('*')
        .order('iata_code');

      if (error) throw error;
      setAirports(data || []);
    } catch (err) {
      console.error('Error fetching airports:', err);
    }
  }

  async function analyzeWinds() {
    if (!origin || !destination) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const originAirport = airports.find(a => a.iata_code === origin);
      const destAirport = airports.find(a => a.iata_code === destination);

      if (!originAirport || !destAirport) {
        throw new Error('Airport not found');
      }

      const result = await weatherService.analyzeRouteWinds(originAirport, destAirport);
      setAnalysis(result);
    } catch (err) {
      console.error('Wind analysis failed:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const getAltitudeColor = (altitude) => {
    const colors = {
      35000: '#003B7A',
      37000: '#0066CC',
      39000: '#0099FF',
      41000: '#00CCFF'
    };
    return colors[altitude] || '#003B7A';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Wind className="w-8 h-8 text-[#003B7A]" />
          <h2 className="text-2xl font-bold text-[#003B7A]">Wind Optimization Analysis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origin Airport
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
              Destination Airport
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
        </div>

        <button
          onClick={analyzeWinds}
          disabled={isAnalyzing || !destination}
          className="w-full bg-[#003B7A] hover:bg-[#0066CC] disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Wind className="w-5 h-5 animate-spin" />
              Analyzing Winds...
            </>
          ) : (
            <>
              <Wind className="w-5 h-5" />
              Analyze Wind Conditions
            </>
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-700">Optimal Altitude</h3>
              </div>
              <p className="text-3xl font-bold text-[#003B7A]">
                FL{Math.floor(analysis.optimalAltitude / 100)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {analysis.optimalAltitude.toLocaleString()} feet
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-2 border-green-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-6 h-6 text-green-600" />
                <h3 className="text-sm font-medium text-gray-700">Avg Tailwind</h3>
              </div>
              <p className="text-3xl font-bold text-green-700">
                {analysis.avgTailwind > 0 ? '+' : ''}{Math.round(analysis.avgTailwind)} kt
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {analysis.avgTailwind > 0 ? 'Tailwind advantage' : 'Headwind penalty'}
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-lg p-6 border-2 border-amber-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-amber-600" />
                <h3 className="text-sm font-medium text-gray-700">Time Savings</h3>
              </div>
              <p className="text-3xl font-bold text-amber-700">
                {Math.round(analysis.timeSavingsMinutes)} min
              </p>
              <p className="text-sm text-gray-600 mt-1">
                vs baseline FL370
              </p>
            </motion.div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-xl font-bold text-[#003B7A] mb-6">Wind Analysis by Altitude</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.altitudeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="altitude_ft"
                  tickFormatter={(value) => `FL${Math.floor(value / 100)}`}
                />
                <YAxis
                  label={{ value: 'Wind Component (knots)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)} kt`}
                  labelFormatter={(value) => `FL${Math.floor(value / 100)}`}
                />
                <Legend />
                <Bar
                  dataKey="avg_tailwind_knots"
                  name="Tailwind Component"
                  radius={[8, 8, 0, 0]}
                >
                  {analysis.altitudeAnalysis.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.altitude_ft === analysis.optimalAltitude ? '#22c55e' : getAltitudeColor(entry.altitude_ft)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analysis.altitudeAnalysis.map((alt, index) => (
                <div
                  key={alt.altitude_ft}
                  className={`p-4 rounded-lg border-2 ${
                    alt.altitude_ft === analysis.optimalAltitude
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      FL{Math.floor(alt.altitude_ft / 100)}
                    </span>
                    {alt.altitude_ft === analysis.optimalAltitude && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                        OPTIMAL
                      </span>
                    )}
                  </div>
                  <p className={`text-lg font-bold ${
                    alt.avg_tailwind_knots > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {alt.avg_tailwind_knots > 0 ? '+' : ''}{alt.avg_tailwind_knots.toFixed(1)} kt
                  </p>
                  <p className="text-xs text-gray-600">
                    {alt.avg_tailwind_knots > 0 ? 'Tailwind' : 'Headwind'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-xl font-bold text-[#003B7A] mb-4">Route Waypoints & Wind Data</h3>

            <div className="space-y-3">
              {analysis.waypoints.map((waypoint, index) => {
                const wind = weatherService.interpolateWindAtWaypoint(
                  waypoint,
                  analysis.windData,
                  analysis.optimalAltitude
                );
                const component = weatherService.calculateWindComponent(
                  wind.wind_speed_knots,
                  wind.wind_direction_degrees,
                  analysis.courseDirection
                );

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-[#003B7A] text-white rounded-full font-bold">
                      {index}
                    </div>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Position</p>
                        <p className="text-sm font-medium">
                          {waypoint.latitude.toFixed(2)}°, {waypoint.longitude.toFixed(2)}°
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Wind Speed</p>
                        <p className="text-sm font-medium">{wind.wind_speed_knots} kt</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Wind Direction</p>
                        <p className="text-sm font-medium">{wind.wind_direction_degrees}°</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Component</p>
                        <p className={`text-sm font-bold ${
                          component.tailwind > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {component.tailwind > 0 ? '+' : ''}{component.tailwind.toFixed(1)} kt
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Temperature</p>
                        <p className="text-sm font-medium">{wind.temperature_celsius}°C</p>
                      </div>
                    </div>
                    {index < analysis.waypoints.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg shadow-xl p-8 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Plane className="w-6 h-6 text-[#003B7A]" />
              <h3 className="text-xl font-bold text-[#003B7A]">Optimization Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <p className="text-gray-800">
                  Fly at <span className="font-bold text-[#003B7A]">FL{Math.floor(analysis.optimalAltitude / 100)}</span> to maximize tailwind advantage
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <p className="text-gray-800">
                  Expected average tailwind of <span className="font-bold text-green-600">
                    {analysis.avgTailwind > 0 ? '+' : ''}{Math.round(analysis.avgTailwind)} knots
                  </span> along the route
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <p className="text-gray-800">
                  Save approximately <span className="font-bold text-amber-600">
                    {Math.round(analysis.timeSavingsMinutes)} minutes
                  </span> compared to standard FL370 cruise
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
