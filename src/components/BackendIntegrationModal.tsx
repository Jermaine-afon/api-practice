import React, { useState } from 'react';
import { BackendConfig } from '../types/sora';
import { testBackendConnection, saveBackendConfig } from '../services/soraService';
import { X, CheckCircle2, AlertCircle, Database, Code2, Copy, Check, Server, RefreshCw } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onSaveConfig: (config: BackendConfig) => void;
  onRefreshData: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshData,
}) => {
  const [localConfig, setLocalConfig] = useState<BackendConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    error?: string;
    sampleData?: unknown;
  } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testBackendConnection(localConfig.customEndpointUrl, localConfig.apiKey);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      const updated = {
        ...localConfig,
        isCustomConnected: true,
        lastConnectedAt: new Date().toISOString(),
      };
      setLocalConfig(updated);
      saveBackendConfig(updated);
      onSaveConfig(updated);
    }
  };

  const handleApply = () => {
    saveBackendConfig(localConfig);
    onSaveConfig(localConfig);
    onRefreshData();
    onClose();
  };

  const sampleBackendPayload = `{
  "rates": [
    {
      "date": "2026-10-02",
      "rate": 2.82,
      "volume": 4.82,
      "soraIndex": 1.14921045,
      "comp1M": 2.85,
      "comp3M": 2.94,
      "comp6M": 3.12
    }
  ],
  "latestBenchmark": {
    "overnight": 2.82,
    "comp1M": 2.85,
    "comp3M": 2.94,
    "comp6M": 3.12,
    "lastUpdated": "2026-10-02"
  }
}`;

  const copySampleToClipboard = () => {
    navigator.clipboard.writeText(sampleBackendPayload);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Backend & MAS Integration Hub
              </h3>
              <p className="text-xs text-slate-500">
                Ready to plug into your custom backend or MAS proxy endpoint
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Mode Selector */}
          <div>
            <label className="font-semibold text-slate-900 block mb-2">
              Select Data Source Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'offline_archive' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  localConfig.mode === 'offline_archive'
                    ? 'border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900 text-slate-900 font-medium'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold">MAS Official Archive</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Verified offline dataset (Zero latency, reliable baseline)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'public_api' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  localConfig.mode === 'public_api'
                    ? 'border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900 text-slate-900 font-medium'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold">Live Public Macro</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Singapore open data aggregator (PropKaki / data.gov.sg)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'custom_backend' })}
                className={`p-3 rounded-lg border text-left transition-all ${
                  localConfig.mode === 'custom_backend'
                    ? 'border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900 text-slate-900 font-medium'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold">Your Custom Backend</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Connect to your Node/Python/Go API endpoint
                </div>
              </button>
            </div>
          </div>

          {/* Custom Backend Form (Active if selected or expandable) */}
          <div className={`p-4 rounded-xl border ${localConfig.mode === 'custom_backend' ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200 bg-slate-50/30'}`}>
            <div className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
              <span>Custom Backend Configuration</span>
              {localConfig.isCustomConnected && (
                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-600 block mb-1">
                  Endpoint URL (GET)
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:8000/api/mas-sora or https://your-server.com/rates"
                  value={localConfig.customEndpointUrl}
                  onChange={(e) => setLocalConfig({ ...localConfig, customEndpointUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">
                  Authorization Header / API Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token or secret key"
                  value={localConfig.apiKey || ''}
                  onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !localConfig.customEndpointUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  <span>{isTesting ? 'Testing Endpoint...' : 'Test Connection'}</span>
                </button>

                {testResult && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    testResult.success ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Success ({testResult.latencyMs}ms)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>{testResult.error || 'Failed to connect'}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* JSON Contract Documentation for Developer Backend */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-900">
                Expected Backend JSON Response Contract
              </span>
              <button
                type="button"
                onClick={copySampleToClipboard}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-40">
              {sampleBackendPayload}
            </pre>
            <p className="text-[11px] text-slate-500 mt-1">
              When you write your backend server (Express, FastAPI, Django, Go), simply expose this endpoint and return the rates array.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-[11px] text-slate-500">
            Selected Mode: <strong className="text-slate-700">{localConfig.mode}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
