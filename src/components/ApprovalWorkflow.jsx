import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, AlertCircle, MapPin, TrendingUp, Wind, Fuel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApprovalWorkflow() {
  const [pendingOptimizations, setPendingOptimizations] = useState([]);
  const [approvedOptimizations, setApprovedOptimizations] = useState([]);
  const [rejectedOptimizations, setRejectedOptimizations] = useState([]);
  const [selectedOptimization, setSelectedOptimization] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [dispatcherName, setDispatcherName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOptimizations();
  }, []);

  async function fetchOptimizations() {
    setLoading(true);
    try {
      const { data: pending } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('status', 'pending')
        .order('timestamp', { ascending: false });

      const { data: approved } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false })
        .limit(20);

      const { data: rejected } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('status', 'rejected')
        .order('timestamp', { ascending: false })
        .limit(20);

      setPendingOptimizations(pending || []);
      setApprovedOptimizations(approved || []);
      setRejectedOptimizations(rejected || []);
    } catch (error) {
      console.error('Error fetching optimizations:', error);
    } finally {
      setLoading(false);
    }
  }

  function getUrgency(timestamp) {
    const departureTime = new Date(timestamp);
    const now = new Date();
    const hoursUntil = (departureTime - now) / (1000 * 60 * 60);

    if (hoursUntil < 2) return { level: 'CRITICAL', color: 'bg-red-600', label: 'Critical' };
    if (hoursUntil < 6) return { level: 'HIGH', color: 'bg-orange-500', label: 'High' };
    return { level: 'NORMAL', color: 'bg-blue-500', label: 'Normal' };
  }

  async function handleApprove(optimization) {
    if (!dispatcherName.trim()) {
      alert('Please enter your name as dispatcher');
      return;
    }

    try {
      const { error } = await supabase
        .from('agent_executions')
        .update({
          status: 'approved',
          approved_by: dispatcherName,
          approved_at: new Date().toISOString()
        })
        .eq('id', optimization.id);

      if (error) throw error;

      setSelectedOptimization(null);
      fetchOptimizations();
    } catch (error) {
      console.error('Error approving optimization:', error);
      alert('Failed to approve optimization');
    }
  }

  async function handleReject(optimization, reason) {
    if (!dispatcherName.trim()) {
      alert('Please enter your name as dispatcher');
      return;
    }

    if (!reason) {
      alert('Please select a rejection reason');
      return;
    }

    try {
      const { error } = await supabase
        .from('agent_executions')
        .update({
          status: 'rejected',
          approved_by: dispatcherName,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', optimization.id);

      if (error) throw error;

      setSelectedOptimization(null);
      fetchOptimizations();
    } catch (error) {
      console.error('Error rejecting optimization:', error);
      alert('Failed to reject optimization');
    }
  }

  function OptimizationCard({ optimization, showActions = false }) {
    const urgency = getUrgency(optimization.timestamp);
    const savings = parseFloat(optimization.output_data?.estimated_savings_usd || 0);
    const confidence = parseFloat(optimization.output_data?.confidence_score || 0);

    return (
      <div
        className="bg-white rounded-lg shadow-md p-4 border-l-4 hover:shadow-lg transition-shadow cursor-pointer"
        style={{ borderLeftColor: urgency.color.replace('bg-', '#') }}
        onClick={() => !showActions && setSelectedOptimization(optimization)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#003B7A]" />
            <div>
              <p className="font-bold text-gray-800">
                {optimization.input_params?.origin} → {optimization.input_params?.destination}
              </p>
              <p className="text-xs text-gray-600">
                {optimization.input_params?.aircraft_type} • {new Date(optimization.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${urgency.color}`}>
            {urgency.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-green-50 rounded p-2">
            <p className="text-xs text-gray-600">Savings</p>
            <p className="font-bold text-green-700">${savings.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 rounded p-2">
            <p className="text-xs text-gray-600">Confidence</p>
            <p className="font-bold text-blue-700">{(confidence * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-amber-50 rounded p-2">
            <p className="text-xs text-gray-600">Duration</p>
            <p className="font-bold text-amber-700">{optimization.duration_ms}ms</p>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOptimization(optimization);
              }}
              className="flex-1 bg-[#003B7A] hover:bg-[#0066CC] text-white py-2 px-4 rounded font-medium text-sm transition-colors"
            >
              Review
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#003B7A]">Optimization Approval</h1>
          <p className="text-gray-600 mt-1">Review and approve route optimizations</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Your name (dispatcher)"
            value={dispatcherName}
            onChange={(e) => setDispatcherName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-[#003B7A] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending ({pendingOptimizations.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'approved'
              ? 'bg-[#003B7A] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved ({approvedOptimizations.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'rejected'
              ? 'bg-[#003B7A] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Rejected ({rejectedOptimizations.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'pending' && pendingOptimizations.map(opt => (
          <OptimizationCard key={opt.id} optimization={opt} showActions={true} />
        ))}
        {activeTab === 'approved' && approvedOptimizations.map(opt => (
          <OptimizationCard key={opt.id} optimization={opt} />
        ))}
        {activeTab === 'rejected' && rejectedOptimizations.map(opt => (
          <OptimizationCard key={opt.id} optimization={opt} />
        ))}
      </div>

      {activeTab === 'pending' && pendingOptimizations.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No pending optimizations</p>
          <p className="text-sm text-gray-500">All optimizations have been reviewed</p>
        </div>
      )}

      <AnimatePresence>
        {selectedOptimization && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOptimization(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#003B7A]">Optimization Review</h2>
                  <button
                    onClick={() => setSelectedOptimization(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Execution ID: {selectedOptimization.execution_id}
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Flight Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Origin:</span>
                        <span className="font-medium">{selectedOptimization.input_params?.origin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Destination:</span>
                        <span className="font-medium">{selectedOptimization.input_params?.destination}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aircraft:</span>
                        <span className="font-medium">{selectedOptimization.input_params?.aircraft_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Departure:</span>
                        <span className="font-medium">
                          {new Date(selectedOptimization.input_params?.departure_time || selectedOptimization.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Optimization Results</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost Savings:</span>
                        <span className="font-bold text-green-600">
                          ${selectedOptimization.output_data?.estimated_savings_usd?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fuel Savings:</span>
                        <span className="font-medium">
                          {selectedOptimization.output_data?.estimated_fuel_savings_lbs?.toFixed(0) || '0'} lbs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Savings:</span>
                        <span className="font-medium">
                          {selectedOptimization.output_data?.estimated_time_savings_minutes?.toFixed(0) || '0'} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-bold text-blue-600">
                          {((selectedOptimization.output_data?.confidence_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOptimization.output_data?.reasoning && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      AI Reasoning
                    </h3>
                    <p className="text-sm text-gray-700">
                      {selectedOptimization.output_data.reasoning}
                    </p>
                  </div>
                )}

                {selectedOptimization.status === 'pending' && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(selectedOptimization)}
                      disabled={!dispatcherName.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Optimization
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:\n1. Safety concerns\n2. Operational constraints\n3. Cost analysis incorrect\n4. Other\n\nEnter 1-4 or custom reason:');
                        if (reason) {
                          const reasons = {
                            '1': 'Safety concerns',
                            '2': 'Operational constraints',
                            '3': 'Cost analysis incorrect',
                            '4': 'Other'
                          };
                          handleReject(selectedOptimization, reasons[reason] || reason);
                        }
                      }}
                      disabled={!dispatcherName.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Optimization
                    </button>
                  </div>
                )}

                {selectedOptimization.status === 'approved' && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Approved by:</strong> {selectedOptimization.approved_by}
                      {' on '}
                      {new Date(selectedOptimization.approved_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedOptimization.status === 'rejected' && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-800">
                      <strong>Rejected by:</strong> {selectedOptimization.approved_by}
                      {' on '}
                      {new Date(selectedOptimization.approved_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-red-700 mt-2">
                      <strong>Reason:</strong> {selectedOptimization.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
