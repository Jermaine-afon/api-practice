import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { LoanParams, SoraDailyRecord, BackendConfig, SoraTenor } from './types/sora';
import { MAS_OFFICIAL_ARCHIVE, LATEST_MAS_BENCHMARKS } from './data/masSoraRates';
import { generateLoanSchedule } from './utils/soraMath';
import {
  loadBackendConfig,
  saveBackendConfig,
  fetchSoraRates,
  exportScheduleToCsv,
} from './services/soraService';

import { Header } from './components/Header';
import { KeyMetricsSummary } from './components/KeyMetricsSummary';
import { LoanCalculator } from './components/LoanCalculator';
import { AmortizationSchedule } from './components/AmortizationSchedule';
import { CompoundingInspector } from './components/CompoundingInspector';
import { RateComparison } from './components/RateComparison';
import { TdsrStressTest } from './components/TdsrStressTest';
import { RateHistoryViewer } from './components/RateHistoryViewer';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';

import { Info, Sparkles, Building2, ShieldCheck, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'compounding' | 'rates' | 'tdsr' | 'comparison'>('calculator');
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(loadBackendConfig());
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // MAS Benchmark state
  const [rates, setRates] = useState<SoraDailyRecord[]>(MAS_OFFICIAL_ARCHIVE);
  const [benchmarks, setBenchmarks] = useState(LATEST_MAS_BENCHMARKS);
  const [feedStatus, setFeedStatus] = useState<string>('Loaded official MAS benchmark archive.');

  // Loan parameters state
  const [params, setParams] = useState<LoanParams>({
    loanAmount: 750000, // SGD
    tenureYears: 25,
    tenureMonths: 0,
    soraTenor: '3M',
    benchmarkRate: LATEST_MAS_BENCHMARKS.comp3M,
    bankSpread: 0.65, // % p.a.
    repaymentType: 'amortizing',
    interestOnlyMonths: 0,
    startDate: new Date().toISOString().slice(0, 10),
    prepaymentAmount: 0,
    prepaymentMonth: 12,
  });

  // Load rates on mount or when backend config changes
  const loadRates = async (config = backendConfig) => {
    try {
      const res = await fetchSoraRates(config);
      if (res.rates && res.rates.length > 0) {
        setRates(res.rates);
        setBenchmarks(res.latestBenchmark);
        if (res.message) setFeedStatus(res.message);

        // Update default benchmark rate if package is standard
        if (params.soraTenor === '3M') {
          setParams((prev) => ({ ...prev, benchmarkRate: res.latestBenchmark.comp3M }));
        } else if (params.soraTenor === '1M') {
          setParams((prev) => ({ ...prev, benchmarkRate: res.latestBenchmark.comp1M }));
        } else if (params.soraTenor === '6M') {
          setParams((prev) => ({ ...prev, benchmarkRate: res.latestBenchmark.comp6M }));
        }
      }
    } catch (err) {
      console.error('Error fetching rates', err);
    }
  };

  useEffect(() => {
    loadRates(backendConfig);
  }, []);

  // Compute loan results
  const calculationResult = useMemo(() => {
    return generateLoanSchedule(params);
  }, [params]);

  // Handler for applying comparison package
  const handleApplyPackage = (tenor: SoraTenor, benchmark: number, spread: number) => {
    setParams((prev) => ({
      ...prev,
      soraTenor: tenor,
      benchmarkRate: benchmark,
      bankSpread: spread,
    }));
    setActiveTab('calculator');
  };

  const handleExportCsv = () => {
    exportScheduleToCsv(calculationResult, params.loanAmount);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict Top Bar Contract Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onExportCsv={handleExportCsv}
        backendConfig={backendConfig}
        latestDate={benchmarks.lastUpdated}
        currentBenchmark={benchmarks.comp3M}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Editorial Sub-header Context Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200/80 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Singapore SORA Overnight Rate & Loan Calculator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Accurate Singapore property loan interest and amortization engine based on Monetary Authority of Singapore (MAS) published overnight benchmark rates and ACT/365 compounding conventions.
            </p>
          </div>

          {/* Quick Rate Ticker Pills Replacement: Clean Unboxed Text with Separators */}
          <div className="shrink-0 flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-2xs">
            <span className="font-semibold text-slate-900">MAS Rates:</span>
            <span>Overnight <strong className="font-mono-numbers text-slate-900">{benchmarks.overnight.toFixed(2)}%</strong></span>
            <span aria-hidden="true">·</span>
            <span>1M <strong className="font-mono-numbers text-slate-900">{benchmarks.comp1M.toFixed(2)}%</strong></span>
            <span aria-hidden="true">·</span>
            <span>3M <strong className="font-mono-numbers text-slate-900">{benchmarks.comp3M.toFixed(2)}%</strong></span>
            <span aria-hidden="true">·</span>
            <span>6M <strong className="font-mono-numbers text-slate-900">{benchmarks.comp6M.toFixed(2)}%</strong></span>
          </div>
        </div>

        {/* Tab 1: Primary Loan Calculator & Amortization View */}
        {activeTab === 'calculator' && (
          <div>
            <KeyMetricsSummary result={calculationResult} params={params} />

            <div className="grid grid-cols-1 gap-6">
              <LoanCalculator
                params={params}
                onChange={setParams}
                rates={{
                  overnight: benchmarks.overnight,
                  comp1M: benchmarks.comp1M,
                  comp3M: benchmarks.comp3M,
                  comp6M: benchmarks.comp6M,
                }}
              />

              <AmortizationSchedule result={calculationResult} params={params} />
            </div>
          </div>
        )}

        {/* Tab 2: Compounding Mathematics & SORA Index Walkthrough */}
        {activeTab === 'compounding' && (
          <CompoundingInspector rates={rates} />
        )}

        {/* Tab 3: Package Comparison Matrix */}
        {activeTab === 'comparison' && (
          <RateComparison
            params={params}
            rates={{
              comp1M: benchmarks.comp1M,
              comp3M: benchmarks.comp3M,
              comp6M: benchmarks.comp6M,
            }}
            onApplyPackage={handleApplyPackage}
          />
        )}

        {/* Tab 4: MAS TDSR & MSR Regulatory Stress Test */}
        {activeTab === 'tdsr' && (
          <TdsrStressTest result={calculationResult} />
        )}

        {/* Tab 5: MAS Published Rate Feed & Historical Archive */}
        {activeTab === 'rates' && (
          <RateHistoryViewer rates={rates} />
        )}
      </main>

      {/* Backend Integration Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={(cfg) => {
          setBackendConfig(cfg);
          saveBackendConfig(cfg);
        }}
        onRefreshData={() => loadRates(backendConfig)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">SORA SG Calculator</span>
            <span aria-hidden="true">·</span>
            <span>Day Count: Actual/365 Fixed</span>
            <span aria-hidden="true">·</span>
            <span>MAS Notice 645 TDSR Compliance</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Backend API Integration Guide
            </button>
            <a
              href="https://www.mas.gov.sg/bonds-and-bills/sora"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-slate-900 underline inline-flex items-center gap-0.5"
            >
              <span>Monetary Authority of Singapore (MAS)</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
