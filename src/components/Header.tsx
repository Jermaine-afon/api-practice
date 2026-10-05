import React from 'react';
import { Database, SlidersHorizontal, Download, FileSpreadsheet } from 'lucide-react';
import { BackendConfig } from '../types/sora';

interface HeaderProps {
  activeTab: 'calculator' | 'compounding' | 'rates' | 'tdsr' | 'comparison';
  setActiveTab: (tab: 'calculator' | 'compounding' | 'rates' | 'tdsr' | 'comparison') => void;
  onOpenBackendModal: () => void;
  onExportCsv: () => void;
  backendConfig: BackendConfig;
  latestDate: string;
  currentBenchmark: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenBackendModal,
  onExportCsv,
  backendConfig,
  latestDate,
  currentBenchmark,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Single Text Element Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('calculator');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:text-slate-700 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              SORA SG
            </a>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200">
              <span>MAS Benchmark</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-numbers font-medium text-slate-700">{currentBenchmark.toFixed(2)}%</span>
              <span aria-hidden="true">·</span>
              <span>{latestDate}</span>
            </div>
          </div>

          {/* Zone 2: Clean Text Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Loan Calculator
            </button>
            <button
              onClick={() => setActiveTab('compounding')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'compounding'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Compounding Math
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Package Compare
            </button>
            <button
              onClick={() => setActiveTab('tdsr')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tdsr'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              MAS TDSR Stress
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'rates'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Rate Feed
            </button>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              title="Download CSV Amortization Schedule"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onOpenBackendModal}
              title="Configure Backend API / MAS Data Source"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-slate-300" />
              <span>Backend API</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendConfig.mode === 'custom_backend'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap font-medium rounded-md ${
              activeTab === 'calculator'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('compounding')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap font-medium rounded-md ${
              activeTab === 'compounding'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            Compounding
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap font-medium rounded-md ${
              activeTab === 'comparison'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => setActiveTab('tdsr')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap font-medium rounded-md ${
              activeTab === 'tdsr'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            TDSR Stress
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap font-medium rounded-md ${
              activeTab === 'rates'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            Rate Feed
          </button>
        </div>
      </div>
    </header>
  );
};
