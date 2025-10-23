import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plane, TrendingUp, CheckCircle, DollarSign } from 'lucide-react';
import StatCard from './StatCard';
import ExecutionCard from './ExecutionCard';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalRoutes: 0,
    totalSavings: 0,
    successRate: 0
  });

  const [recentExecutions, setRecentExecutions] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('agent_executions')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_executions' },
        (payload) => {
          console.log('New execution:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchDashboardData() {
    try {
      const { data: executions, error: execError } = await supabase
        .from('agent_executions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (execError) throw execError;

      setRecentExecutions(executions || []);

      const { count: totalFlights } = await supabase
        .from('agent_executions')
        .select('*', { count: 'exact', head: true });

      const { count: totalRoutes } = await supabase
        .from('copa_routes')
        .select('*', { count: 'exact', head: true });

      const { data: allExecs } = await supabase
        .from('agent_executions')
        .select('output_data, status');

      const totalSavings = allExecs?.reduce((sum, exec) =>
        sum + (exec.output_data?.estimated_savings_usd || 0), 0
      ) || 0;

      const successCount = allExecs?.filter(e => e.status === 'success').length || 0;
      const successRate = totalFlights > 0 ? (successCount / totalFlights * 100) : 0;

      setStats({
        totalFlights: totalFlights || 0,
        totalRoutes: totalRoutes || 0,
        totalSavings: totalSavings,
        successRate: successRate
      });

      const chartData = executions?.map(exec => ({
        time: new Date(exec.timestamp).toLocaleTimeString(),
        savings: exec.output_data?.estimated_savings_usd || 0,
        confidence: (exec.output_data?.confidence_score || 0) * 100
      })) || [];

      setPerformanceData(chartData.reverse());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B7A] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#003B7A] mb-2">
          COPA Airlines AI Route Optimizer
        </h1>
        <p className="text-gray-600">
          Real-time performance monitoring and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Plane className="w-6 h-6" />}
          label="Total Optimizations"
          value={stats.totalFlights}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Active Routes"
          value={stats.totalRoutes}
          color="indigo"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Savings"
          value={`$${stats.totalSavings.toLocaleString()}`}
          color="green"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          color="emerald"
        />
      </div>

      {performanceData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-[#003B7A]">Optimization Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="savings" stroke="#10B981" name="Savings ($)" strokeWidth={2} />
              <Line type="monotone" dataKey="confidence" stroke="#0066CC" name="Confidence (%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-[#003B7A]">Recent Optimizations</h2>
        {recentExecutions.length > 0 ? (
          <div className="space-y-4">
            {recentExecutions.map(exec => (
              <ExecutionCard key={exec.execution_id} execution={exec} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No optimizations yet. Run your first optimization!</p>
        )}
      </div>
    </div>
  );
}
