import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Map, BarChart3, Play, Wind, Fuel, TrendingUp, CheckCircle, Settings, Brain, Sparkles } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import OptimizationTrigger from './components/OptimizationTrigger';
import WindOptimization from './components/WindOptimization';
import FuelTankering from './components/FuelTankering';
import SavingsDashboard from './components/SavingsDashboard';
import ApprovalWorkflow from './components/ApprovalWorkflow';
import FuelPriceManagement from './components/FuelPriceManagement';
import LLMConfiguration from './components/LLMConfiguration';
import MultiLLMComparison from './components/MultiLLMComparison';
import ComparisonResults from './components/ComparisonResults';
import { generateSampleRoute, SAMPLE_PTY_BOG_ROUTE } from './utils/sampleRouteData';

function Navigation() {
  const location = useLocation();
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

      setOptimizedRoute(SAMPLE_PTY_BOG_ROUTE);
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-[#003B7A] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFB81C] rounded-full flex items-center justify-center">
                <span className="text-[#003B7A] font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">COPA Airlines</h1>
                <p className="text-xs text-gray-300">AI Route Optimizer</p>
              </div>
            </Link>

            <div className="flex gap-2 overflow-x-auto">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/savings"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/savings')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Savings
              </Link>
              <Link
                to="/approval"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/approval')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Approval
              </Link>
              <Link
                to="/map"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/map')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Map className="w-4 h-4" />
                Map
              </Link>
              <Link
                to="/optimizer"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/optimizer')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Play className="w-4 h-4" />
                Optimizer
              </Link>
              <Link
                to="/multi-compare"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/multi-compare') || location.pathname.startsWith('/comparison/')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Compare
              </Link>
              <Link
                to="/wind"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/wind')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Wind className="w-4 h-4" />
                Wind
              </Link>
              <Link
                to="/fuel"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/fuel')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Fuel className="w-4 h-4" />
                Tankering
              </Link>
              <Link
                to="/fuelprices"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/fuelprices')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Settings className="w-4 h-4" />
                Prices
              </Link>
              <Link
                to="/llm-config"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                  isActive('/llm-config')
                    ? 'bg-white text-[#003B7A]'
                    : 'bg-[#0066CC] hover:bg-[#0080FF]'
                }`}
              >
                <Brain className="w-4 h-4" />
                LLM Config
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/savings" element={<SavingsDashboard />} />
          <Route path="/approval" element={<ApprovalWorkflow />} />
          <Route path="/map" element={
            <MapView
              routes={routes}
              airports={airports}
              optimizedRoute={optimizedRoute}
            />
          } />
          <Route path="/optimizer" element={<OptimizationTrigger />} />
          <Route path="/multi-compare" element={<MultiLLMComparison />} />
          <Route path="/comparison/:comparisonId" element={<ComparisonResults />} />
          <Route path="/wind" element={<WindOptimization />} />
          <Route path="/fuel" element={
            <div className="p-6">
              <FuelTankering
                origin="PTY"
                destination="BOG"
                aircraftType="738"
                distanceNm={562}
              />
            </div>
          } />
          <Route path="/fuelprices" element={<FuelPriceManagement />} />
          <Route path="/llm-config" element={<LLMConfiguration />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
