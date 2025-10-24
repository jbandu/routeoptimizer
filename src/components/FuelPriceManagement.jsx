import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Fuel, Plus, Edit2, Trash2, Upload, RefreshCw, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FuelPriceManagement() {
  const [fuelPrices, setFuelPrices] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    airport_iata: '',
    price_per_gallon: '',
    supplier: '',
    contract_rate: false,
    effective_date: new Date().toISOString().split('T')[0],
    valid_days: 7
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: prices } = await supabase
        .from('fuel_prices')
        .select('*')
        .order('effective_date', { ascending: false });

      const { data: airportData } = await supabase
        .from('airports')
        .select('iata_code, city, country')
        .order('iata_code');

      setFuelPrices(prices || []);
      setAirports(airportData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPrice() {
    if (!formData.airport_iata || !formData.price_per_gallon) {
      alert('Please fill in required fields');
      return;
    }

    const pricePerGallon = parseFloat(formData.price_per_gallon);
    if (pricePerGallon < 2 || pricePerGallon > 6) {
      alert('Price must be between $2.00 and $6.00 per gallon');
      return;
    }

    const pricePerLiter = pricePerGallon / 3.78541;
    const effectiveDate = new Date(formData.effective_date);
    const validUntil = new Date(effectiveDate);
    validUntil.setDate(validUntil.getDate() + parseInt(formData.valid_days));

    try {
      const { error } = await supabase
        .from('fuel_prices')
        .insert({
          airport_iata: formData.airport_iata,
          price_per_gallon: pricePerGallon,
          price_per_liter: pricePerLiter,
          supplier: formData.supplier || 'Unknown',
          contract_rate: formData.contract_rate,
          effective_date: effectiveDate.toISOString(),
          valid_until: validUntil.toISOString()
        });

      if (error) throw error;

      setShowAddForm(false);
      setFormData({
        airport_iata: '',
        price_per_gallon: '',
        supplier: '',
        contract_rate: false,
        effective_date: new Date().toISOString().split('T')[0],
        valid_days: 7
      });
      fetchData();
    } catch (error) {
      console.error('Error adding price:', error);
      alert('Failed to add fuel price');
    }
  }

  async function handleUpdatePrice(id, newPrice) {
    const price = parseFloat(newPrice);
    if (price < 2 || price > 6) {
      alert('Price must be between $2.00 and $6.00 per gallon');
      return;
    }

    try {
      const { error } = await supabase
        .from('fuel_prices')
        .update({
          price_per_gallon: price,
          price_per_liter: price / 3.78541,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Failed to update fuel price');
    }
  }

  async function handleDeletePrice(id) {
    if (!confirm('Are you sure you want to delete this fuel price?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fuel_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting price:', error);
      alert('Failed to delete fuel price');
    }
  }

  function handleCSVUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        const lines = text.split('\n');
        const records = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [airport, priceStr, supplier, contractRate, effectiveDateStr] = line.split(',');
          const price = parseFloat(priceStr);

          if (!airport || isNaN(price) || price < 2 || price > 6) {
            continue;
          }

          const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : new Date();
          const validUntil = new Date(effectiveDate);
          validUntil.setDate(validUntil.getDate() + 7);

          records.push({
            airport_iata: airport.trim().toUpperCase(),
            price_per_gallon: price,
            price_per_liter: price / 3.78541,
            supplier: supplier?.trim() || 'Unknown',
            contract_rate: contractRate?.toLowerCase() === 'true',
            effective_date: effectiveDate.toISOString(),
            valid_until: validUntil.toISOString()
          });
        }

        if (records.length === 0) {
          alert('No valid records found in CSV');
          return;
        }

        const { error } = await supabase
          .from('fuel_prices')
          .insert(records);

        if (error) throw error;

        alert(`Successfully imported ${records.length} fuel price(s)`);
        fetchData();
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Failed to import CSV: ' + error.message);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  const currentPrices = fuelPrices.filter(p => {
    const now = new Date();
    return new Date(p.effective_date) <= now && new Date(p.valid_until) >= now;
  });

  const expiredPrices = fuelPrices.filter(p => new Date(p.valid_until) < new Date());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#003B7A]">Fuel Price Management</h1>
          <p className="text-gray-600 mt-1">Manage fuel prices across Copa network</p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003B7A] hover:bg-[#0066CC] text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Price
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-[#003B7A] mb-4">Add New Fuel Price</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Airport</label>
              <select
                value={formData.airport_iata}
                onChange={(e) => setFormData({ ...formData, airport_iata: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
              >
                <option value="">Select airport...</option>
                {airports.map(airport => (
                  <option key={airport.iata_code} value={airport.iata_code}>
                    {airport.iata_code} - {airport.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per Gallon ($)</label>
              <input
                type="number"
                step="0.01"
                min="2"
                max="6"
                value={formData.price_per_gallon}
                onChange={(e) => setFormData({ ...formData, price_per_gallon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
                placeholder="3.50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
                placeholder="Shell Aviation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid for (days)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.valid_days}
                onChange={(e) => setFormData({ ...formData, valid_days: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003B7A] focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.contract_rate}
                  onChange={(e) => setFormData({ ...formData, contract_rate: e.target.checked })}
                  className="w-4 h-4 text-[#003B7A] focus:ring-[#003B7A]"
                />
                <span className="text-sm text-gray-700">Contract Rate</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddPrice}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Price
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-[#003B7A] text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Current Fuel Prices ({currentPrices.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Airport</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price/Gal</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price/L</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Supplier</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Effective Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valid Until</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPrices.map((price) => (
                <tr key={price.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-[#003B7A]">{price.airport_iata}</td>
                  <td className="px-4 py-3">
                    {editingId === price.id ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={price.price_per_gallon}
                        onBlur={(e) => handleUpdatePrice(price.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdatePrice(price.id, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold">${parseFloat(price.price_per_gallon).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">${parseFloat(price.price_per_liter).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{price.supplier}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(price.effective_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(price.valid_until).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      price.contract_rate
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {price.contract_rate ? 'Contract' : 'Spot'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditingId(price.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrice(price.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expiredPrices.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-600 text-white">
            <h2 className="text-lg font-bold">Expired Prices ({expiredPrices.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Airport</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price/Gal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Expired On</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expiredPrices.slice(0, 10).map((price) => (
                  <tr key={price.id} className="border-b border-gray-100 hover:bg-gray-50 opacity-60">
                    <td className="px-4 py-3 font-bold text-gray-600">{price.airport_iata}</td>
                    <td className="px-4 py-3 font-semibold text-gray-600">
                      ${parseFloat(price.price_per_gallon).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(price.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeletePrice(price.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">CSV Upload Format</h3>
        <p className="text-sm text-blue-800 mb-2">
          Upload a CSV file with the following columns (no header row):
        </p>
        <code className="text-xs bg-white px-2 py-1 rounded text-blue-700 block">
          AIRPORT_CODE,PRICE_PER_GALLON,SUPPLIER,CONTRACT_RATE,EFFECTIVE_DATE
        </code>
        <p className="text-xs text-blue-700 mt-2">
          Example: PTY,3.45,Shell Aviation,true,2025-01-24
        </p>
      </div>
    </div>
  );
}
