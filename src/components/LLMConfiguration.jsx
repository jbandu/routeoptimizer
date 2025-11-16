import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Check, X, AlertCircle, Cpu, Brain, Sparkles, Zap, Server } from 'lucide-react';

const providerIcons = {
  claude: Brain,
  openai: Sparkles,
  gemini: Zap,
  grok: Cpu,
  ollama: Server
};

const providerColors = {
  claude: 'from-orange-500 to-red-500',
  openai: 'from-green-500 to-emerald-500',
  gemini: 'from-blue-500 to-purple-500',
  grok: 'from-gray-600 to-gray-800',
  ollama: 'from-teal-500 to-cyan-500'
};

export default function LLMConfiguration() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('llm_providers')
        .select(`
          *,
          llm_models (
            id,
            model_id,
            display_name,
            is_enabled,
            max_tokens,
            cost_per_1k_tokens
          )
        `)
        .order('provider_name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setMessage({ type: 'error', text: 'Failed to load providers' });
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (providerId, currentState) => {
    try {
      const { error } = await supabase
        .from('llm_providers')
        .update({ is_enabled: !currentState })
        .eq('id', providerId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Provider updated successfully' });
      fetchProviders();
    } catch (error) {
      console.error('Error updating provider:', error);
      setMessage({ type: 'error', text: 'Failed to update provider' });
    }
  };

  const saveProviderConfig = async (providerId, config) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('llm_providers')
        .update({
          api_endpoint: config.api_endpoint,
          default_model: config.default_model,
          config: config.advanced_config
        })
        .eq('id', providerId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuration saved successfully' });
      setEditingProvider(null);
      fetchProviders();
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider) => {
    setMessage({ type: 'info', text: `Testing ${provider.display_name} connection...` });

    try {
      // Call a test endpoint (you'll need to create this)
      const response = await supabase.functions.invoke('test-llm-connection', {
        body: { provider: provider.provider_name }
      });

      if (response.error) throw response.error;

      setMessage({ type: 'success', text: `${provider.display_name} connection successful!` });
    } catch (error) {
      console.error('Connection test failed:', error);
      setMessage({ type: 'error', text: `Connection failed: ${error.message}` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">LLM Configuration</h1>
        </div>
        <p className="text-gray-600">
          Configure and manage AI providers for route optimization. Enable multiple providers to compare results.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.type === 'success' && <Check className="w-5 h-5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {message.type === 'info' && <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Environment Variables Info */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">API Keys Required</p>
            <p>Set these environment variables in your Supabase project:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><code>ANTHROPIC_API_KEY</code> - For Claude</li>
              <li><code>OPENAI_API_KEY</code> - For OpenAI/GPT</li>
              <li><code>GEMINI_API_KEY</code> - For Google Gemini</li>
              <li><code>GROK_API_KEY</code> - For xAI Grok</li>
              <li>Ollama runs locally and doesn't need an API key</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const Icon = providerIcons[provider.provider_name] || Brain;
          const colorClass = providerColors[provider.provider_name];
          const isEditing = editingProvider === provider.id;

          return (
            <div
              key={provider.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all ${
                provider.is_enabled ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              {/* Header with gradient */}
              <div className={`bg-gradient-to-r ${colorClass} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-6 h-6" />
                    <h3 className="text-xl font-bold">{provider.display_name}</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provider.is_enabled}
                      onChange={() => toggleProvider(provider.id, provider.is_enabled)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/50"></div>
                  </label>
                </div>
                <p className="text-sm text-white/90">
                  {provider.provider_name === 'ollama' ? 'Local inference' : 'Cloud API'}
                </p>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Models */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Models</h4>
                  <div className="space-y-1">
                    {provider.llm_models?.slice(0, 3).map((model) => (
                      <div
                        key={model.id}
                        className="text-xs bg-gray-50 px-2 py-1 rounded flex items-center justify-between"
                      >
                        <span className="text-gray-700">{model.display_name}</span>
                        {model.cost_per_1k_tokens > 0 && (
                          <span className="text-gray-500">
                            ${model.cost_per_1k_tokens.toFixed(3)}/1K
                          </span>
                        )}
                      </div>
                    ))}
                    {provider.llm_models?.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{provider.llm_models.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration */}
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Default Model
                      </label>
                      <input
                        type="text"
                        defaultValue={provider.default_model}
                        className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Model ID"
                      />
                    </div>
                    {provider.provider_name === 'ollama' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          API Endpoint
                        </label>
                        <input
                          type="text"
                          defaultValue={provider.api_endpoint}
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="http://localhost:11434"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingProvider(null)}
                        className="flex-1 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveProviderConfig(provider.id, {})}
                        disabled={saving}
                        className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Default:</span> {provider.default_model}
                    </div>
                    {provider.api_endpoint && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Endpoint:</span>{' '}
                        {provider.api_endpoint.replace('http://', '').replace('https://', '')}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setEditingProvider(provider.id)}
                        className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => testConnection(provider)}
                        disabled={!provider.is_enabled}
                        className="flex-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className={`px-4 py-2 text-xs font-medium ${
                provider.is_enabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
              }`}>
                {provider.is_enabled ? '✓ Enabled' : '○ Disabled'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">
            {providers.filter(p => p.is_enabled).length}
          </div>
          <div className="text-sm text-blue-700">Active Providers</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-900">
            {providers.reduce((sum, p) => sum + (p.llm_models?.filter(m => m.is_enabled).length || 0), 0)}
          </div>
          <div className="text-sm text-purple-700">Available Models</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-900">
            {providers.filter(p => p.is_enabled).length >= 2 ? 'Ready' : 'Limited'}
          </div>
          <div className="text-sm text-green-700">Comparison Mode</div>
        </div>
      </div>
    </div>
  );
}
