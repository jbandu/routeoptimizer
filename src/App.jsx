import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Map, BarChart3, Play } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import OptimizationTrigger from './components/OptimizationTrigger';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [routes, setRoutes] = useState([]);
  const [airports, setAirports] = useState([]);

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

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'optimizer'
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Play className="w-4 h-4" />
                Optimizer
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'map' && <MapView routes={routes} airports={airports} />}
        {currentView === 'optimizer' && <OptimizationTrigger />}
      </main>
    </div>
  );
}

export default App;
