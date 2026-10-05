import React, { useState } from 'react';
import { CalculationResult, LoanParams } from '../types/sora';
import { exportScheduleToCsv } from '../services/soraService';
import { Download, Calendar, Filter, ChevronRight, ChevronDown } from 'lucide-react';

interface AmortizationScheduleProps {
  result: CalculationResult;
  params: LoanParams;
}

export const AmortizationSchedule: React.FC<AmortizationScheduleProps> = ({
  result,
  params,
}) => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([1]));

  const toggleYearExpand = (year: number) => {
    const next = new Set(expandedYears);
    if (next.has(year)) {
      next.delete(year);
    } else {
      next.add(year);
    }
    setExpandedYears(next);
  };

  const filteredMonthlySchedule = result.schedule.filter((row) => {
    if (selectedYear === 'all') return true;
    return Math.ceil(row.month / 12) === selectedYear;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Amortization & Payment Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full principal and interest payment progression under Singapore ACT/365 convention
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'annual'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual Summary
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Details
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={() => exportScheduleToCsv(result, params.loanAmount)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Monthly Filter Bar if in monthly mode */}
      {viewMode === 'monthly' && (
        <div className="flex items-center gap-2 py-3 border-b border-slate-100 overflow-x-auto scrollbar-none">
          <span className="text-xs text-slate-500 font-medium shrink-0">Filter Year:</span>
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedYear === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Years ({result.annualSummaries.length})
          </button>
          {result.annualSummaries.map((yr) => (
            <button
              key={yr.year}
              onClick={() => setSelectedYear(yr.year)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedYear === yr.year
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Year {yr.year}
            </button>
          ))}
        </div>
      )}

      {/* Annual Summary View */}
      {viewMode === 'annual' && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Year</th>
                <th className="py-2.5 px-3 font-semibold text-right">Annual Payment</th>
                <th className="py-2.5 px-3 font-semibold text-right">Principal Paid</th>
                <th className="py-2.5 px-3 font-semibold text-right">Interest Paid</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ending Balance</th>
                <th className="py-2.5 px-3 font-semibold text-right">Amortized %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.annualSummaries.map((row) => {
                const amortizedPct = ((params.loanAmount - row.endingBalance) / params.loanAmount) * 100;
                return (
                  <tr key={row.year} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      Year {row.year}
                    </td>
                    <td className="py-2.5 px-3 font-mono-numbers text-right text-slate-900 font-medium">
                      S${row.totalPayment.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono-numbers text-right text-emerald-700">
                      S${row.totalPrincipal.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono-numbers text-right text-rose-700">
                      S${row.totalInterest.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono-numbers text-right font-medium text-slate-900">
                      S${row.endingBalance.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono-numbers text-right text-slate-500">
                      {amortizedPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Detailed Schedule */}
      {viewMode === 'monthly' && (
        <div className="overflow-x-auto mt-4 max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Mo</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold text-right">Start Balance</th>
                <th className="py-2.5 px-3 font-semibold text-right">Monthly Payment</th>
                <th className="py-2.5 px-3 font-semibold text-right">Principal</th>
                <th className="py-2.5 px-3 font-semibold text-right">Interest</th>
                <th className="py-2.5 px-3 font-semibold text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMonthlySchedule.map((row) => (
                <tr
                  key={row.month}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    row.extraPayment > 0 ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-mono-numbers text-slate-500">#{row.month}</td>
                  <td className="py-2 px-3 font-mono-numbers text-slate-700">{row.date}</td>
                  <td className="py-2 px-3 font-mono-numbers text-right text-slate-600">
                    S${row.startingBalance.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 font-mono-numbers text-right font-medium text-slate-900">
                    S${row.payment.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                    {row.extraPayment > 0 && (
                      <span className="block text-[10px] text-amber-700 font-normal">
                        (Incl. S${row.extraPayment.toLocaleString()} prepay)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-mono-numbers text-right text-emerald-700">
                    S${row.principal.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 font-mono-numbers text-right text-rose-700">
                    S${row.interest.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 font-mono-numbers text-right font-medium text-slate-900">
                    S${row.endingBalance.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
