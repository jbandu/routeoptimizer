import React from 'react';

export default function ExecutionCard({ execution }) {
  const params = execution.input_params || {};
  const output = execution.output_data || {};

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-[#003B7A]">
            {params.origin} → {params.destination}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {params.aircraft_type}
          </span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          execution.status === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {execution.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Confidence</p>
          <p className="font-bold text-[#003B7A]">
            {((output.confidence_score || 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Savings</p>
          <p className="font-bold text-green-600">
            ${(output.estimated_savings_usd || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Duration</p>
          <p className="font-bold text-gray-900">{execution.duration_ms}ms</p>
        </div>
      </div>
      {output.reasoning && (
        <p className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          {output.reasoning}
        </p>
      )}
    </div>
  );
}
