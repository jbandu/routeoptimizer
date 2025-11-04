import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Sparkles, Check, TrendingUp, Clock, DollarSign, Gauge, Brain,
  MapPin, Plane, AlertCircle, ArrowLeft, ChevronDown, ChevronUp,
  Star, Award, Zap
} from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const providerColors = {
  claude: { bg: 'from-orange-500 to-red-500', border: 'border-orange-300', text: 'text-orange-700', light: 'bg-orange-50' },
  openai: { bg: 'from-green-500 to-emerald-500', border: 'border-green-300', text: 'text-green-700', light: 'bg-green-50' },
  gemini: { bg: 'from-blue-500 to-purple-500', border: 'border-blue-300', text: 'text-blue-700', light: 'bg-blue-50' },
  grok: { bg: 'from-gray-600 to-gray-800', border: 'border-gray-300', text: 'text-gray-700', light: 'bg-gray-50' },
  ollama: { bg: 'from-teal-500 to-cyan-500', border: 'border-teal-300', text: 'text-teal-700', light: 'bg-teal-50' }
};

export default function ComparisonResults() {
  const { comparisonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [expandedResults, setExpandedResults] = useState({});
  const [saving, setSaving] = useState(false);

  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    // Use passed state if available, otherwise fetch from database
    if (location.state?.results) {
      setResults(location.state.results);
      setContext(location.state.context);
      setLoading(false);
    } else {
      fetchComparisonData();
    }
  }, [comparisonId]);

  useEffect(() => {
    if (context && !loading) {
      initializeMap();
    }
  }, [context, loading]);

  const fetchComparisonData = async () => {
    try {
      const { data: comparison } = await supabase
        .from('optimization_comparisons')
        .select('*')
        .eq('comparison_id', comparisonId)
        .single();

      if (!comparison) {
        throw new Error('Comparison not found');
      }

      const { data: llmResults } = await supabase
        .from('llm_optimization_results')
        .select('*')
        .eq('comparison_id', comparison.id)
        .order('created_at');

      setResults(llmResults || []);
      setContext(comparison.input_params);
    } catch (error) {
      console.error('Error fetching comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (map.current || !context) return;

    const origin = context.origin;
    const destination = context.destination;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [origin.longitude, origin.latitude],
      zoom: 4,
      pitch: 45,
    });

    map.current.on('load', () => {
      // Add origin marker
      new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([origin.longitude, origin.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <div class="font-bold">${origin.iata}</div>
            <div class="text-sm">${origin.city}</div>
          </div>
        `))
        .addTo(map.current);

      // Add destination marker
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([destination.longitude, destination.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <div class="font-bold">${destination.iata}</div>
            <div class="text-sm">${destination.city}</div>
          </div>
        `))
        .addTo(map.current);

      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [origin.longitude, origin.latitude],
              [destination.longitude, destination.latitude]
            ]
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Fit bounds to show both airports
      const bounds = new mapboxgl.LngLatBounds()
        .extend([origin.longitude, origin.latitude])
        .extend([destination.longitude, destination.latitude]);

      map.current.fitBounds(bounds, { padding: 100 });
    });
  };

  const handleSelectResult = async (result) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('optimization_comparisons')
        .update({
          selected_result_id: result.id,
          selected_at: new Date().toISOString(),
          selected_by: 'dispatcher' // In production, use actual user ID
        })
        .eq('comparison_id', comparisonId);

      if (error) throw error;

      setSelectedResult(result.id);
      alert('Selection saved successfully!');
    } catch (error) {
      console.error('Error saving selection:', error);
      alert('Failed to save selection');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpanded = (resultId) => {
    setExpandedResults(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  const getRankBadge = (index, totalResults) => {
    if (index === 0) {
      return <Award className="w-5 h-5 text-yellow-500" />;
    }
    return <span className="text-sm font-bold text-gray-400">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading comparison results...</div>
        </div>
      </div>
    );
  }

  // Sort results by fuel savings (best first)
  const sortedResults = [...results]
    .filter(r => r.status === 'success' && r.output_data)
    .sort((a, b) => {
      const aFuel = a.output_data?.estimated_fuel_savings_lbs || 0;
      const bFuel = b.output_data?.estimated_fuel_savings_lbs || 0;
      return bFuel - aFuel;
    });

  const errorResults = results.filter(r => r.status === 'error');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/multi-compare')}
            className="flex items-center gap-2 mb-4 text-white/90 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Comparison
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Comparison Results</h1>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/90">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {context?.origin?.iata || 'N/A'} → {context?.destination?.iata || 'N/A'}
            </span>
            <span className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              {context?.aircraft_type || 'N/A'}
            </span>
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {sortedResults.length} AI Models Compared
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-6">
              <div className="bg-gray-800 text-white px-4 py-3 font-semibold">
                Route Visualization
              </div>
              <div ref={mapContainer} className="h-[400px]" />

              {/* Quick Stats */}
              <div className="p-4 space-y-2 bg-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{context?.route?.distance_nm || 'N/A'} NM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Flight Time:</span>
                  <span className="font-semibold">{context?.route?.flight_time_hours?.toFixed(2) || 'N/A'} hrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Turbulence Alerts:</span>
                  <span className="font-semibold text-orange-600">{context?.turbulence_alerts || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Success Results */}
            {sortedResults.map((result, index) => {
              const colors = providerColors[result.provider_name] || providerColors.claude;
              const isExpanded = expandedResults[result.id];
              const isSelected = selectedResult === result.id;
              const output = result.output_data;

              return (
                <div
                  key={result.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                    isSelected ? 'border-green-500 ring-4 ring-green-100' : 'border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${colors.bg} text-white p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getRankBadge(index, sortedResults.length)}
                        <div>
                          <h3 className="text-xl font-bold">{result.provider_name.toUpperCase()}</h3>
                          <p className="text-sm text-white/90">{result.model_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{output.recommended_altitude_ft?.toLocaleString()} ft</div>
                        <div className="text-xs text-white/90">Recommended Altitude</div>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1 rounded-full w-fit">
                        <Star className="w-3 h-3" />
                        Best Fuel Savings
                      </div>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div className={`${colors.light} p-3 rounded-lg`}>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-xs text-gray-600">Fuel Savings</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {output.estimated_fuel_savings_lbs?.toLocaleString() || 0} lbs
                      </div>
                    </div>

                    <div className={`${colors.light} p-3 rounded-lg`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-xs text-gray-600">Time Impact</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {output.estimated_time_savings_minutes > 0 ? '+' : ''}
                        {output.estimated_time_savings_minutes?.toFixed(1) || 0} min
                      </div>
                    </div>

                    <div className={`${colors.light} p-3 rounded-lg`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-xs text-gray-600">Confidence</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {((output.confidence_score || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => toggleExpanded(result.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="font-semibold text-gray-700">AI Reasoning</span>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                        {output.reasoning || 'No reasoning provided'}

                        {/* Alternative Altitudes */}
                        {output.alternative_altitudes && output.alternative_altitudes.length > 0 && (
                          <div className="mt-4">
                            <div className="font-semibold mb-2">Alternative Altitudes:</div>
                            <div className="space-y-2">
                              {output.alternative_altitudes.map((alt, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                                  <span className="font-medium">{alt.altitude_ft?.toLocaleString()} ft</span>
                                  <span className="text-gray-600">
                                    {alt.fuel_savings_lbs} lbs | {alt.time_savings_minutes?.toFixed(1)} min
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleSelectResult(result)}
                      disabled={saving || isSelected}
                      className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-green-500 text-white cursor-default'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-5 h-5" />
                          Selected for Dispatch
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Select This Recommendation
                        </>
                      )}
                    </button>
                  </div>

                  {/* Performance Badge */}
                  <div className="px-4 pb-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Response time: {result.duration_ms}ms</span>
                    {result.cost_usd && <span>Cost: ${result.cost_usd.toFixed(4)}</span>}
                  </div>
                </div>
              );
            })}

            {/* Error Results */}
            {errorResults.map((result) => (
              <div key={result.id} className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">{result.provider_name.toUpperCase()} Failed</span>
                </div>
                <p className="text-sm text-red-600">{result.error_message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
