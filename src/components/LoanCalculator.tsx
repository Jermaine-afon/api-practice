import React, { useState } from 'react';
import { LoanParams, SoraTenor, RepaymentType } from '../types/sora';
import { COMMON_BANK_SPREADS } from '../data/masSoraRates';
import { Sliders, HelpCircle, ChevronDown, ChevronUp, RefreshCw, Zap } from 'lucide-react';

interface LoanCalculatorProps {
  params: LoanParams;
  onChange: (params: LoanParams) => void;
  rates: {
    overnight: number;
    comp1M: number;
    comp3M: number;
    comp6M: number;
  };
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  params,
  onChange,
  rates,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAmountChange = (val: number) => {
    onChange({ ...params, loanAmount: Math.max(10000, val) });
  };

  const handleTenureYearsChange = (years: number) => {
    onChange({ ...params, tenureYears: Math.min(35, Math.max(1, years)) });
  };

  const handleTenorSelect = (tenor: SoraTenor) => {
    let benchmarkRate = params.benchmarkRate;
    if (tenor === '1M') benchmarkRate = rates.comp1M;
    else if (tenor === '3M') benchmarkRate = rates.comp3M;
    else if (tenor === '6M') benchmarkRate = rates.comp6M;

    onChange({
      ...params,
      soraTenor: tenor,
      benchmarkRate,
    });
  };

  const presets = [
    { label: 'HDB BTO', amount: 450000 },
    { label: 'HDB Resale', amount: 750000 },
    { label: 'Condo 2-3BR', amount: 1350000 },
    { label: 'Prime / Landed', amount: 2500000 },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Loan Parameters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Singapore property loan principal, SORA tenor, and bank margins
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Day Count: <span className="font-medium text-slate-700">ACT/365 Fixed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Loan Amount & Tenure */}
        <div className="space-y-5">
          {/* Loan Principal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="loan-amount-input" className="text-xs font-semibold text-slate-700">
                Loan Amount (SGD)
              </label>
              <span className="font-mono-numbers text-xs text-slate-500">
                S$ {params.loanAmount.toLocaleString('en-SG')}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                S$
              </span>
              <input
                id="loan-amount-input"
                type="number"
                step="10000"
                min="50000"
                max="20000000"
                value={params.loanAmount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono-numbers font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleAmountChange(preset.amount)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    params.loanAmount === preset.amount
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label} (S${(preset.amount / 1000).toFixed(0)}k)
                </button>
              ))}
            </div>
          </div>

          {/* Loan Tenure */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="tenure-years-input" className="text-xs font-semibold text-slate-700">
                Loan Tenure
              </label>
              <span className="font-mono-numbers text-xs font-medium text-slate-900">
                {params.tenureYears} Years {params.tenureMonths > 0 ? `+ ${params.tenureMonths} Mos` : ''} ({params.tenureYears * 12 + params.tenureMonths} Months)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="tenure-range-input"
                type="range"
                min="5"
                max="35"
                step="1"
                aria-label="Loan tenure years slider"
                value={params.tenureYears}
                onChange={(e) => handleTenureYearsChange(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="w-20 shrink-0">
                <input
                  id="tenure-years-input"
                  type="number"
                  min="1"
                  max="35"
                  value={params.tenureYears}
                  onChange={(e) => handleTenureYearsChange(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-center text-xs font-mono-numbers font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>5y (Min)</span>
              <span>25y (HDB Avg)</span>
              <span>30y (HDB Max)</span>
              <span>35y (Private Max)</span>
            </div>
          </div>
        </div>

        {/* Right Column: SORA Benchmark & Bank Spread */}
        <div className="space-y-5">
          {/* SORA Tenor Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                SORA Benchmark Package
              </label>
              <span className="text-xs text-slate-500">
                MAS Compounded Overnight Rate
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTenorSelect('1M')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  params.soraTenor === '1M'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-medium opacity-80">1M SORA</div>
                <div className="text-sm font-bold font-mono-numbers mt-0.5">
                  {rates.comp1M.toFixed(2)}%
                </div>
                <div className="text-[10px] mt-0.5 opacity-70">Resets monthly</div>
              </button>

              <button
                type="button"
                onClick={() => handleTenorSelect('3M')}
                className={`p-2.5 rounded-lg border text-left transition-all relative ${
                  params.soraTenor === '3M'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-medium opacity-80 flex items-center justify-between">
                  <span>3M SORA</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                    params.soraTenor === '3M' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    Standard
                  </span>
                </div>
                <div className="text-sm font-bold font-mono-numbers mt-0.5">
                  {rates.comp3M.toFixed(2)}%
                </div>
                <div className="text-[10px] mt-0.5 opacity-70">Resets quarterly</div>
              </button>

              <button
                type="button"
                onClick={() => handleTenorSelect('6M')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  params.soraTenor === '6M'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-medium opacity-80">6M SORA</div>
                <div className="text-sm font-bold font-mono-numbers mt-0.5">
                  {rates.comp6M.toFixed(2)}%
                </div>
                <div className="text-[10px] mt-0.5 opacity-70">Semi-annual</div>
              </button>
            </div>

            {/* Benchmark Rate Manual Override / Fine Tuning */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">Benchmark Rate:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="15"
                value={params.benchmarkRate}
                onChange={(e) =>
                  onChange({
                    ...params,
                    soraTenor: 'custom',
                    benchmarkRate: Number(e.target.value),
                  })
                }
                className="w-24 px-2 py-1 text-xs font-mono-numbers font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-xs text-slate-500">% p.a.</span>
            </div>
          </div>

          {/* Bank Spread / Margin */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="bank-spread-input" className="text-xs font-semibold text-slate-700">
                Bank Spread / Margin
              </label>
              <span className="font-mono-numbers text-xs font-medium text-slate-900">
                +{params.bankSpread.toFixed(2)}% p.a.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="bank-spread-range-input"
                type="range"
                min="0.30"
                max="2.00"
                step="0.05"
                aria-label="Bank spread margin slider"
                value={params.bankSpread}
                onChange={(e) =>
                  onChange({ ...params, bankSpread: Number(e.target.value) })
                }
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="w-20 shrink-0">
                <input
                  id="bank-spread-input"
                  type="number"
                  step="0.05"
                  min="0.10"
                  max="5.00"
                  value={params.bankSpread}
                  onChange={(e) =>
                    onChange({ ...params, bankSpread: Number(e.target.value) })
                  }
                  className="w-full px-2.5 py-1.5 text-center text-xs font-mono-numbers font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Quick Bank Spread Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_BANK_SPREADS.map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => onChange({ ...params, bankSpread: tier.spread })}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    params.bankSpread === tier.spread
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={tier.bank}
                >
                  +{tier.spread.toFixed(2)}% ({tier.label})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Controls Toggle */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings (Repayment Type, Prepayment, Dates)'}</span>
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-2">
            {/* Repayment Structure */}
            <div>
              <label htmlFor="repayment-type-select" className="text-xs font-semibold text-slate-700 block mb-1.5">
                Repayment Structure
              </label>
              <select
                id="repayment-type-select"
                value={params.repaymentType}
                onChange={(e) =>
                  onChange({
                    ...params,
                    repaymentType: e.target.value as RepaymentType,
                  })
                }
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                <option value="amortizing">Principal + Interest (Amortizing)</option>
                <option value="interest_only">Interest-Only Period</option>
              </select>

              {params.repaymentType === 'interest_only' && (
                <div className="mt-2">
                  <label htmlFor="interest-only-months-input" className="text-[11px] text-slate-500 block mb-1">
                    Interest-Only Duration (Months)
                  </label>
                  <input
                    id="interest-only-months-input"
                    type="number"
                    min="1"
                    max="60"
                    value={params.interestOnlyMonths}
                    onChange={(e) =>
                      onChange({
                        ...params,
                        interestOnlyMonths: Number(e.target.value),
                      })
                    }
                    className="w-full px-2.5 py-1 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-md"
                  />
                </div>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="first-payment-date-input" className="text-xs font-semibold text-slate-700 block mb-1.5">
                First Payment Date
              </label>
              <input
                id="first-payment-date-input"
                type="date"
                value={params.startDate}
                onChange={(e) => onChange({ ...params, startDate: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard observation shift applies
              </span>
            </div>

            {/* Prepayment Lump Sum Simulator */}
            <div>
              <label htmlFor="prepayment-amount-input" className="text-xs font-semibold text-slate-700 block mb-1.5">
                Lump-Sum Prepayment (SGD)
              </label>
              <div className="flex gap-2">
                <input
                  id="prepayment-amount-input"
                  type="number"
                  step="5000"
                  min="0"
                  placeholder="e.g. 50000"
                  value={params.prepaymentAmount || ''}
                  onChange={(e) =>
                    onChange({
                      ...params,
                      prepaymentAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-2/3 px-2.5 py-1.5 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-md"
                />
                <input
                  id="prepayment-month-input"
                  type="number"
                  min="1"
                  max="360"
                  placeholder="At Mo"
                  title="Payment month to apply prepayment"
                  value={params.prepaymentMonth || ''}
                  onChange={(e) =>
                    onChange({
                      ...params,
                      prepaymentMonth: Number(e.target.value) || 12,
                    })
                  }
                  className="w-1/3 px-2 py-1.5 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-md"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Test partial capital reduction at specific month
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
