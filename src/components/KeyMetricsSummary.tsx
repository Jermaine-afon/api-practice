import React from 'react';
import { CalculationResult, LoanParams } from '../types/sora';
import { ShieldAlert, TrendingUp, Calendar, CreditCard, DollarSign } from 'lucide-react';

interface KeyMetricsSummaryProps {
  result: CalculationResult;
  params: LoanParams;
}

export const KeyMetricsSummary: React.FC<KeyMetricsSummaryProps> = ({ result, params }) => {
  const stressDelta = result.stressedMonthlyPayment - result.monthlyPayment;
  const interestRatio = (result.totalInterest / (result.totalPayment || 1)) * 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Payment Projection
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            SGD {result.monthlyPayment.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-sm font-normal text-slate-500"> / month</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Effective {result.effectiveRate.toFixed(2)}% p.a.</span>
          <span aria-hidden="true">·</span>
          <span>SORA {params.benchmarkRate.toFixed(2)}% + Spread {params.bankSpread.toFixed(2)}%</span>
          <span aria-hidden="true">·</span>
          <span>{params.tenureYears}y {params.tenureMonths > 0 ? `${params.tenureMonths}m` : ''}</span>
        </div>
      </div>

      {/* Grid of Key Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">Effective Rate</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            {result.effectiveRate.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            SORA + {params.bankSpread.toFixed(2)}% spread
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">Total Interest</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            S${Math.round(result.totalInterest).toLocaleString('en-SG')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {interestRatio.toFixed(1)}% of total cost
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 font-medium mb-1">Total Payment</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            S${Math.round(result.totalPayment).toLocaleString('en-SG')}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Over {result.totalMonths} months
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
            <span>MAS Stress Test</span>
            <span className="text-slate-400 font-normal">(@ {result.stressRate.toFixed(1)}%)</span>
          </div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            S${result.stressedMonthlyPayment.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-amber-700 mt-0.5">
            +{Math.round(stressDelta).toLocaleString('en-SG')} buffer /mo
          </div>
        </div>
      </div>

      {/* Visual Amortization Proportion Bar */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span>Loan Principal: S${params.loanAmount.toLocaleString('en-SG')} ({(100 - interestRatio).toFixed(1)}%)</span>
          <span>Interest: S${Math.round(result.totalInterest).toLocaleString('en-SG')} ({interestRatio.toFixed(1)}%)</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${Math.max(5, 100 - interestRatio)}%` }}
            title={`Principal: ${(100 - interestRatio).toFixed(1)}%`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${Math.min(95, interestRatio)}%` }}
            title={`Interest: ${interestRatio.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
};
