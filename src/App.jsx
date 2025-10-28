import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Map, BarChart3, Play, Wind, Fuel, TrendingUp, CheckCircle, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import OptimizationTrigger from './components/OptimizationTrigger';
import WindOptimization from './components/WindOptimization';
import FuelTankering from './components/FuelTankering';
import SavingsDashboard from './components/SavingsDashboard';
import ApprovalWorkflow from './components/ApprovalWorkflow';
import FuelPriceManagement from './components/FuelPriceManagement';
import { generateSampleRoute, SAMPLE_PTY_BOG_ROUTE } from './utils/sampleRouteData';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [routes, setRoutes] = useState([]);
  const [airports, setAirports] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  async function fetchMapData() {
    try {
      const { data: routeData } = await supabase
        .from('copa_routes')
        .select('*');
      setRoutes(routeData || []);

      const { data: airportData } = await supabase
        .from('airports')
        .select('*');
      setAirports(airportData || []);

      // Load a sample optimized route for 3D visualization demo
      // You can replace this with actual optimized route data from your backend
      setOptimizedRoute(SAMPLE_PTY_BOG_ROUTE);
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#003B7A] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFB81C] rounded-full flex items-center justify-center">
                <span className="text-[#003B7A] font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">COPA Airlines</h1>
                <p className="text-xs text-gray-300">AI Route Optimizer</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'dashboard'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('savings')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'savings'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Savings
              </button>
              <button
                onClick={() => setCurrentView('approval')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'approval'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approval
              </button>
              <button
                onClick={() => setCurrentView('map')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'map'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Map className="w-4 h-4" />
                Map
              </button>
              <button
                onClick={() => setCurrentView('optimizer')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'optimizer'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Play className="w-4 h-4" />
                Optimizer
              </button>
              <button
                onClick={() => setCurrentView('wind')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'wind'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Wind className="w-4 h-4" />
                Wind
              </button>
              <button
                onClick={() => setCurrentView('fuel')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'fuel'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Fuel className="w-4 h-4" />
                Tankering
              </button>
              <button
                onClick={() => setCurrentView('fuelprices')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'fuelprices'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Settings className="w-4 h-4" />
                Prices
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'savings' && <SavingsDashboard />}
        {currentView === 'approval' && <ApprovalWorkflow />}
        {currentView === 'map' && (
          <MapView
            routes={routes}
            airports={airports}
            optimizedRoute={optimizedRoute}
          />
        )}
        {currentView === 'optimizer' && <OptimizationTrigger />}
        {currentView === 'wind' && <WindOptimization />}
        {currentView === 'fuel' && (
          <div className="p-6">
            <FuelTankering
              origin="PTY"
              destination="BOG"
              aircraftType="738"
              distanceNm={562}
            />
          </div>
        )}
        {currentView === 'fuelprices' && <FuelPriceManagement />}
      </main>
    </div>
  );
}

export default App;
