import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, DollarSign, CheckCircle, BarChart3, Wind, Fuel, Cloud, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function SavingsDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOptimizations, setRecentOptimizations] = useState([]);
  const [savingsHistory, setSavingsHistory] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: statsData } = await supabase
        .from('v_optimization_stats')
        .select('*')
        .single();
      setStats(statsData);

      const { data: recentData } = await supabase
        .from('v_recent_optimizations')
        .select('*')
        .limit(20);
      setRecentOptimizations(recentData || []);

      const { data: historyData } = await supabase
        .from('phase1_savings_summary')
        .select('*')
        .order('date', { ascending: true })
        .limit(30);

      setSavingsHistory(historyData?.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Wind: parseFloat(d.wind_savings_usd || 0),
        Fuel: parseFloat(d.fuel_savings_usd || 0),
        Turbulence: parseFloat(d.turbulence_savings_usd || 0),
        Total: parseFloat(d.total_savings_usd || 0)
      })) || []);

      const { data: executionsData } = await supabase
        .from('agent_executions')
        .select('input_params, output_data')
        .in('status', ['success', 'approved'])
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const routeMap = {};
      executionsData?.forEach(exec => {
        const origin = exec.input_params?.origin;
        const destination = exec.input_params?.destination;
        const savings = parseFloat(exec.output_data?.estimated_savings_usd || 0);

        if (origin && destination) {
          const routeKey = `${origin}-${destination}`;
          if (!routeMap[routeKey]) {
            routeMap[routeKey] = { route: routeKey, count: 0, totalSavings: 0 };
          }
          routeMap[routeKey].count++;
          routeMap[routeKey].totalSavings += savings;
        }
      });

      const routesArray = Object.values(routeMap)
        .map(r => ({
          ...r,
          avgSavings: r.totalSavings / r.count
        }))
        .sort((a, b) => b.totalSavings - a.totalSavings)
        .slice(0, 10);

      setTopRoutes(routesArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-[#003B7A]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#003B7A]">Savings Dashboard</h1>
          <p className="text-gray-600 mt-1">Performance metrics and optimization insights</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-[#003B7A] hover:bg-[#0066CC] text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-lg p-6 border-2 border-green-200"
        >
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-700" />
            <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
              30D
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">Total Savings</p>
          <p className="text-4xl font-bold text-green-700">
            ${stats?.total_savings?.toFixed(0).toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Avg: ${stats?.avg_savings?.toFixed(2) || '0'} per flight
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-200"
        >
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 text-blue-700" />
            <span className="text-xs font-semibold text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
              30D
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">Optimizations</p>
          <p className="text-4xl font-bold text-blue-700">
            {stats?.success_count || 0}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {stats?.pending_count || 0} pending approval
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-lg p-6 border-2 border-amber-200"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-amber-700" />
            <span className="text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">
              AVG
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">Confidence Score</p>
          <p className="text-4xl font-bold text-amber-700">
            {((stats?.avg_confidence || 0) * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600 mt-2">
            AI recommendation accuracy
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-2 border-purple-200"
        >
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-8 h-8 text-purple-700" />
            <span className="text-xs font-semibold text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
              RATE
            </span>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">Approval Rate</p>
          <p className="text-4xl font-bold text-purple-700">
            {stats?.total_count > 0
              ? ((stats?.approved_count / stats?.total_count) * 100).toFixed(0)
              : 0}%
          </p>
          <p className="text-xs text-gray-600 mt-2">
            {stats?.approved_count || 0} approved / {stats?.rejected_count || 0} rejected
          </p>
        </motion.div>
      </div>

      {savingsHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#003B7A] mb-4">Savings Breakdown (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={savingsHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Savings ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Wind" stackId="a" fill="#3B82F6" name="Wind Optimization" />
              <Bar dataKey="Fuel" stackId="a" fill="#10B981" name="Fuel Tankering" />
              <Bar dataKey="Turbulence" stackId="a" fill="#F59E0B" name="Turbulence Avoidance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#003B7A] mb-4">Recent Optimizations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-gray-200">
                <tr className="text-left">
                  <th className="pb-2 font-semibold text-gray-700">Route</th>
                  <th className="pb-2 font-semibold text-gray-700">Savings</th>
                  <th className="pb-2 font-semibold text-gray-700">Status</th>
                  <th className="pb-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOptimizations.slice(0, 10).map((opt, idx) => (
                  <tr key={opt.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">
                      {opt.origin} → {opt.destination}
                    </td>
                    <td className="py-2 text-green-600 font-semibold">
                      ${opt.savings_usd?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opt.status === 'approved' ? 'bg-green-100 text-green-700' :
                        opt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        opt.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {opt.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600 text-xs">
                      {new Date(opt.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#003B7A] mb-4">Top Performing Routes</h2>
          <div className="space-y-3">
            {topRoutes.slice(0, 8).map((route, idx) => (
              <div key={route.route} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#003B7A] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{route.route}</p>
                    <p className="text-xs text-gray-600">
                      {route.count} optimization{route.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    ${route.totalSavings.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-600">
                    ${route.avgSavings.toFixed(0)} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
