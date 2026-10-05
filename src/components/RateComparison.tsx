import React, { useState } from 'react';
import { LoanParams } from '../types/sora';
import { calculateMonthlyPayment } from '../utils/soraMath';
import { Layers, Check, ShieldCheck, ArrowRightLeft } from 'lucide-react';

interface RateComparisonProps {
  params: LoanParams;
  rates: {
    comp1M: number;
    comp3M: number;
    comp6M: number;
  };
  onApplyPackage: (tenor: '1M' | '3M' | '6M', benchmark: number, spread: number) => void;
}

export const RateComparison: React.FC<RateComparisonProps> = ({
  params,
  rates,
  onApplyPackage,
}) => {
  const [fixedRateQuote, setFixedRateQuote] = useState(2.80);
  const totalMonths = params.tenureYears * 12 + params.tenureMonths;

  // Comparison Packages
  const packages = [
    {
      id: '1M',
      title: '1-Month Compounded SORA',
      benchmark: rates.comp1M,
      spread: params.bankSpread,
      effective: rates.comp1M + params.bankSpread,
      resetFrequency: 'Every month',
      description: 'Quickest response to falling interest rate cycles; higher monthly fluctuations.',
      tenor: '1M' as const,
      tag: 'Agile Floating',
    },
    {
      id: '3M',
      title: '3-Month Compounded SORA',
      benchmark: rates.comp3M,
      spread: params.bankSpread,
      effective: rates.comp3M + params.bankSpread,
      resetFrequency: 'Every 3 months',
      description: 'Singapore banking gold standard (DBS, OCBC, UOB). Balances rate stability with market tracking.',
      tenor: '3M' as const,
      isRecommended: true,
      tag: 'Industry Benchmark',
    },
    {
      id: '6M',
      title: '6-Month Compounded SORA',
      benchmark: rates.comp6M,
      spread: params.bankSpread,
      effective: rates.comp6M + params.bankSpread,
      resetFrequency: 'Every 6 months',
      description: 'Longer rate certainty between resets; lags when interest rates shift downward.',
      tenor: '6M' as const,
      tag: 'Extended Floating',
    },
    {
      id: 'fixed',
      title: 'Bank 2-Year Fixed Rate',
      benchmark: fixedRateQuote,
      spread: 0,
      effective: fixedRateQuote,
      resetFrequency: 'Locked for 24 months',
      description: 'Zero rate risk during lock-in period; usually commands a slight premium over 3M SORA.',
      tenor: 'custom' as const,
      tag: 'Fixed Certainty',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            SORA Loan Package Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare 1M, 3M, 6M SORA floating packages against fixed-rate alternatives for S${params.loanAmount.toLocaleString('en-SG')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Fixed Rate Comparison:</span>
          <input
            type="number"
            step="0.05"
            min="1.0"
            max="8.0"
            value={fixedRateQuote}
            onChange={(e) => setFixedRateQuote(Number(e.target.value))}
            className="w-16 px-2 py-0.5 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded"
          />
          <span>%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {packages.map((pkg) => {
          const monthly = calculateMonthlyPayment(params.loanAmount, pkg.effective, totalMonths);
          const total3YrPayment = monthly * 36;
          const isSelected = params.soraTenor === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                pkg.isRecommended
                  ? 'border-slate-900 bg-slate-900/[0.02] ring-1 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {pkg.tag}
                  </span>
                  {pkg.isRecommended && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Most Common
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {pkg.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 min-h-[3rem]">
                  {pkg.description}
                </p>

                {/* Rate breakdown */}
                <div className="bg-slate-50 rounded-lg p-3 space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Benchmark Rate</span>
                    <span className="font-mono-numbers font-medium text-slate-900">
                      {pkg.benchmark.toFixed(2)}%
                    </span>
                  </div>
                  {pkg.spread > 0 && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Bank Margin</span>
                      <span className="font-mono-numbers font-medium text-slate-900">
                        +{pkg.spread.toFixed(2)}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Effective Rate</span>
                    <span className="font-mono-numbers text-slate-900">
                      {pkg.effective.toFixed(2)}% p.a.
                    </span>
                  </div>
                </div>

                {/* Monthly Installment */}
                <div className="mb-4">
                  <div className="text-[11px] text-slate-500 font-medium">Monthly Installment</div>
                  <div className="text-xl font-bold font-mono-numbers text-slate-900 mt-0.5">
                    S${Math.round(monthly).toLocaleString('en-SG')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    3-Year Total: S${Math.round(total3YrPayment).toLocaleString('en-SG')}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {pkg.id !== 'fixed' && (
                <button
                  type="button"
                  onClick={() => onApplyPackage(pkg.tenor as '1M' | '3M' | '6M', pkg.benchmark, pkg.spread)}
                  className={`w-full py-2 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? 'Currently Selected' : 'Apply to Calculator'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
