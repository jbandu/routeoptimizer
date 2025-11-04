import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Loader2, AlertCircle, CheckCircle, XCircle, ArrowRight, TrendingUp, Clock, DollarSign, Gauge } from 'lucide-react';

export default function MultiLLMComparison() {
  const navigate = useNavigate();
  const [airports, setAirports] = useState([]);
  const [aircraftTypes, setAircraftTypes] = useState([]);
  const [enabledProviders, setEnabledProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    origin: 'PTY',
    destination: 'BOG',
    aircraft_type: 'B738',
    departure_time: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch airports
      const { data: airportsData } = await supabase
        .from('airports')
        .select('*')
        .order('iata');

      // Fetch aircraft types
      const { data: aircraftData } = await supabase
        .from('aircraft_types')
        .select('*')
        .order('iata_code');

      // Fetch enabled providers
      const { data: providersData } = await supabase
        .from('llm_providers')
        .select('provider_name, display_name, default_model')
        .eq('is_enabled', true);

      setAirports(airportsData || []);
      setAircraftTypes(aircraftData || []);
      setEnabledProviders(providersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call multi-LLM optimization endpoint
      const { data, error: funcError } = await supabase.functions.invoke('optimize-route-multi', {
        body: formData
      });

      if (funcError) throw funcError;

      if (data.error) {
        throw new Error(data.error);
      }

      // Navigate to comparison results page
      navigate(`/comparison/${data.comparison_id}`, {
        state: {
          comparisonUuid: data.comparison_uuid,
          results: data.results,
          context: data.context
        }
      });

    } catch (error) {
      console.error('Error running comparison:', error);
      setError(error.message || 'Failed to run optimization');
    } finally {
      setLoading(false);
    }
  };

  if (enabledProviders.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No LLM Providers Enabled</h2>
          <p className="text-gray-600 mb-4">
            You need to enable at least one LLM provider to run comparisons.
          </p>
          <button
            onClick={() => navigate('/llm-config')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Configure LLM Providers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-900">Multi-LLM Route Comparison</h1>
        </div>
        <p className="text-gray-600">
          Compare route optimization recommendations from {enabledProviders.length} different AI providers simultaneously.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Flight Parameters</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origin Airport
                </label>
                <select
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {airports.map((airport) => (
                    <option key={airport.iata} value={airport.iata}>
                      {airport.iata} - {airport.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Airport
                </label>
                <select
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {airports.map((airport) => (
                    <option key={airport.iata} value={airport.iata}>
                      {airport.iata} - {airport.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aircraft Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aircraft Type
                </label>
                <select
                  value={formData.aircraft_type}
                  onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {aircraftTypes.map((aircraft) => (
                    <option key={aircraft.iata_code} value={aircraft.iata_code}>
                      {aircraft.iata_code} - {aircraft.icao_code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running Optimization...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Compare {enabledProviders.length} AI Models
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Providers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Active AI Providers</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {enabledProviders.map((provider, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-semibold text-gray-900">{provider.display_name}</div>
                    <div className="text-xs text-gray-500">{provider.default_model}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Parallel Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Your flight parameters are sent to all enabled AI providers simultaneously.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Independent Recommendations</h3>
                  <p className="text-sm text-gray-600">
                    Each AI analyzes weather, wind patterns, and turbulence data independently.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Visual Comparison</h3>
                  <p className="text-sm text-gray-600">
                    Results are displayed side-by-side with interactive maps and 3D visualization.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dispatcher Decision</h3>
                  <p className="text-sm text-gray-600">
                    Choose the best recommendation based on fuel savings, time, and confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">What You'll Compare</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Altitude Recommendations</div>
                  <div className="text-xs text-gray-600">Optimal cruising altitude for each route</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Fuel Savings</div>
                  <div className="text-xs text-gray-600">Estimated fuel cost reduction</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Clock className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Time Impact</div>
                  <div className="text-xs text-gray-600">Flight time savings or additions</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Gauge className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Confidence Score</div>
                  <div className="text-xs text-gray-600">AI confidence in recommendation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
