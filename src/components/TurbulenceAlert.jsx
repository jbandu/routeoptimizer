import React from 'react';
import { AlertTriangle, Cloud, Wind, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TurbulenceAlert({ turbulenceData }) {
  if (!turbulenceData || !turbulenceData.detected) {
    return null;
  }

  const { zones, recommendation, message, summary } = turbulenceData;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'SEVERE':
        return 'bg-red-100 border-red-400 text-red-900';
      case 'MODERATE':
        return 'bg-orange-100 border-orange-400 text-orange-900';
      case 'LIGHT':
        return 'bg-yellow-100 border-yellow-400 text-yellow-900';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-900';
    }
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'AVOID':
        return 'bg-red-600 text-white';
      case 'CONSIDER_AVOIDANCE':
        return 'bg-orange-500 text-white';
      case 'MONITOR':
        return 'bg-yellow-500 text-gray-900';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const mostSevereZone = zones.reduce((prev, current) => {
    const prevLevel = prev.severity === 'SEVERE' ? 3 : prev.severity === 'MODERATE' ? 2 : 1;
    const currentLevel = current.severity === 'SEVERE' ? 3 : current.severity === 'MODERATE' ? 2 : 1;
    return currentLevel > prevLevel ? current : prev;
  }, zones[0]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <div className={`rounded-lg border-2 p-5 ${getSeverityColor(mostSevereZone.severity)}`}>
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">Turbulence Alert</h3>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${getRecommendationColor(recommendation)}`}>
                  {recommendation.replace('_', ' ')}
                </span>
              </div>
              <p className="font-medium mb-4">{message}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{summary.severe}</p>
                  <p className="text-xs font-medium">Severe</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{summary.moderate}</p>
                  <p className="text-xs font-medium">Moderate</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{summary.light}</p>
                  <p className="text-xs font-medium">Light</p>
                </div>
              </div>

              <div className="space-y-3">
                {zones.slice(0, 3).map((zone, idx) => (
                  <div key={zone.id} className="bg-white bg-opacity-70 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <Cloud className="w-5 h-5 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">
                            Zone {idx + 1}: {zone.severity} Turbulence
                          </p>
                          <p className="text-xs text-gray-700 mt-1">
                            Location: {zone.location.latitude.toFixed(2)}°, {zone.location.longitude.toFixed(2)}°
                          </p>
                          <p className="text-xs text-gray-700">
                            Altitude: FL{Math.floor(zone.altitude / 100)} (±{Math.floor(zone.altitudeRange / 1000)}k ft)
                          </p>
                          <p className="text-xs text-gray-700">
                            Radius: {zone.radiusNm} nm • Probability: {(zone.probability * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          zone.severity === 'SEVERE' ? 'bg-red-200 text-red-900' :
                          zone.severity === 'MODERATE' ? 'bg-orange-200 text-orange-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          {zone.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {zones.length > 3 && (
                  <p className="text-sm text-center font-medium">
                    + {zones.length - 3} more turbulence zone{zones.length - 3 > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {recommendation === 'AVOID' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-white rounded-lg shadow-md p-4 border-l-4 border-red-600"
          >
            <div className="flex items-start gap-3">
              <Navigation className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Route Deviation Recommended</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Consider requesting ATC clearance for route deviation or altitude change to avoid severe turbulence zones.
                </p>
                <p className="text-xs text-gray-600">
                  Estimated additional distance: ~{mostSevereZone.radiusNm * 0.5} nm •
                  Time cost: ~{Math.round((mostSevereZone.radiusNm * 0.5 / 450) * 60)} min
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
