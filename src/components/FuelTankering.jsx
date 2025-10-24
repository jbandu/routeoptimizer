import React, { useState, useEffect } from 'react';
import { Fuel, TrendingDown, TrendingUp, DollarSign, Scale, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getFuelPriceComparison, calculateTankering, getFuelPriceHistory } from '../services/fuelService';

export default function FuelTankering({ origin, destination, aircraftType, distanceNm }) {
  const [fuelComparison, setFuelComparison] = useState(null);
  const [tankeringResult, setTankeringResult] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (origin && destination && aircraftType && distanceNm) {
      analyzeTankering();
    }
  }, [origin, destination, aircraftType, distanceNm]);

  async function analyzeTankering() {
    setLoading(true);
    try {
      const comparison = await getFuelPriceComparison(origin, destination);
      setFuelComparison(comparison);

      const result = await calculateTankering(origin, destination, aircraftType, distanceNm);
      setTankeringResult(result);

      const originHistory = await getFuelPriceHistory(origin, 30);
      const destHistory = await getFuelPriceHistory(destination, 30);

      const mergedHistory = originHistory.map((oh, idx) => ({
        date: oh.date,
        [origin]: oh.pricePerGallon,
        [destination]: destHistory[idx]?.pricePerGallon || 0
      }));
      setPriceHistory(mergedHistory);
    } catch (error) {
      console.error('Error analyzing tankering:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading fuel analysis...</div>
        </div>
      </div>
    );
  }

  if (!fuelComparison || !tankeringResult) {
    return null;
  }

  const { origin: originPrice, destination: destPrice, difference } = fuelComparison;
  const isOriginCheaper = difference.perGallon < 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Fuel className="w-7 h-7 text-[#003B7A]" />
          <h2 className="text-2xl font-bold text-[#003B7A]">Fuel Price Comparison</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border-2 border-blue-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">{originPrice.airport} (Origin)</p>
            <p className="text-3xl font-bold text-[#003B7A] mb-1">
              ${originPrice.pricePerGallon.toFixed(2)}
              <span className="text-lg text-gray-600">/gal</span>
            </p>
            <p className="text-sm text-gray-600">${originPrice.pricePerLiter.toFixed(2)}/L</p>
            <p className="text-xs text-gray-500 mt-2">{originPrice.supplier}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-5 border-2 border-amber-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">{destPrice.airport} (Destination)</p>
            <p className="text-3xl font-bold text-[#003B7A] mb-1">
              ${destPrice.pricePerGallon.toFixed(2)}
              <span className="text-lg text-gray-600">/gal</span>
            </p>
            <p className="text-sm text-gray-600">${destPrice.pricePerLiter.toFixed(2)}/L</p>
            <p className="text-xs text-gray-500 mt-2">{destPrice.supplier}</p>
          </div>

          <div className={`rounded-lg p-5 border-2 ${
            isOriginCheaper
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
              : 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
          }`}>
            <p className="text-sm text-gray-600 mb-2 font-medium">Price Difference</p>
            <div className="flex items-center gap-2 mb-1">
              {isOriginCheaper ? (
                <TrendingDown className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingUp className="w-6 h-6 text-red-600" />
              )}
              <p className={`text-3xl font-bold ${isOriginCheaper ? 'text-green-700' : 'text-red-700'}`}>
                ${Math.abs(difference.perGallon).toFixed(2)}
              </p>
            </div>
            <p className={`text-sm font-medium ${isOriginCheaper ? 'text-green-700' : 'text-red-700'}`}>
              {Math.abs(difference.percentage)}% {isOriginCheaper ? 'cheaper' : 'more expensive'}
            </p>
          </div>
        </div>

        {priceHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">30-Day Fuel Price Trends</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'Price ($/gal)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={origin}
                  stroke="#003B7A"
                  strokeWidth={2}
                  name={`${origin} (Origin)`}
                />
                <Line
                  type="monotone"
                  dataKey={destination}
                  stroke="#EE2E24"
                  strokeWidth={2}
                  name={`${destination} (Dest)`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Scale className="w-7 h-7 text-[#003B7A]" />
          <h2 className="text-2xl font-bold text-[#003B7A]">Tankering Calculator</h2>
        </div>

        <div className={`p-6 rounded-lg mb-6 border-2 ${
          tankeringResult.recommended
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className={`text-2xl font-bold mb-2 ${
                tankeringResult.recommended ? 'text-green-700' : 'text-gray-700'
              }`}>
                {tankeringResult.recommended ? 'TANKERING RECOMMENDED' : 'NO TANKERING'}
              </h3>
              <p className="text-gray-700 font-medium">{tankeringResult.reason}</p>
            </div>
            {tankeringResult.recommended && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Confidence Level</p>
                <p className={`text-xl font-bold ${
                  tankeringResult.confidence === 'HIGH' ? 'text-green-700' :
                  tankeringResult.confidence === 'MEDIUM' ? 'text-amber-600' : 'text-orange-600'
                }`}>
                  {tankeringResult.confidence}
                </p>
              </div>
            )}
          </div>

          {tankeringResult.recommended ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Tanker Amount</p>
                  <p className="text-2xl font-bold text-[#003B7A]">
                    {tankeringResult.tankerAmountGallons.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">gallons</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Extra Weight</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {tankeringResult.tankerAmountLbs.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">pounds</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Gross Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${tankeringResult.breakdown.grossSavings.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Net Savings</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${tankeringResult.savings.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Cost Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trip Fuel Required:</span>
                    <span className="font-medium">{tankeringResult.breakdown.tripFuelGallons.toLocaleString()} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reserve Fuel:</span>
                    <span className="font-medium">{tankeringResult.breakdown.reserveFuelGallons.toLocaleString()} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Burn (Weight Penalty):</span>
                    <span className="font-medium text-red-600">
                      {tankeringResult.breakdown.extraBurnGallons.toLocaleString()} gal
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight Penalty Cost:</span>
                    <span className="font-medium text-red-600">
                      -${tankeringResult.breakdown.weightPenaltyCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span className="text-gray-800">Net Savings:</span>
                    <span className="text-green-700 text-lg">
                      ${tankeringResult.savings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Why No Tankering?</h4>
                  <p className="text-sm text-gray-700 mb-3">{tankeringResult.reason}</p>
                  {tankeringResult.savings > 0 && (
                    <p className="text-sm text-gray-600">
                      Potential savings of ${tankeringResult.savings.toFixed(2)} is below the minimum threshold.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
