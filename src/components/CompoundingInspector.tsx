import React, { useState, useMemo } from 'react';
import { SoraDailyRecord } from '../types/sora';
import { computeMasCompoundedRate, computeFromSoraIndex } from '../utils/soraMath';
import { Calculator, Calendar, ArrowRight, CheckCircle2, Info } from 'lucide-react';

interface CompoundingInspectorProps {
  rates: SoraDailyRecord[];
}

export const CompoundingInspector: React.FC<CompoundingInspectorProps> = ({ rates }) => {
  const [periodDays, setPeriodDays] = useState<30 | 90>(30);
  const [startIndexDate, setStartIndexDate] = useState<string>(
    rates.length > 5 ? rates[rates.length - 1].date : ''
  );
  const [endIndexDate, setEndIndexDate] = useState<string>(
    rates.length > 0 ? rates[0].date : ''
  );

  // Compute step-by-step daily compounding from official MAS records
  const compoundingData = useMemo(() => {
    // Sort chronological (oldest to newest) for compounding
    const sorted = [...rates].sort((a, b) => a.date.localeCompare(b.date));
    const slice = sorted.slice(-Math.min(periodDays, sorted.length));

    // Construct array with weekend weighting (n_i)
    const inputs = slice.map((item, idx) => {
      const d = new Date(item.date);
      const dayOfWeek = d.getUTCDay(); // 5 = Friday
      // If Friday, rate applies across Friday, Saturday, Sunday (3 days)
      const daysSpanned = dayOfWeek === 5 ? 3 : 1;
      return {
        date: item.date,
        rate: item.rate,
        daysSpanned,
      };
    });

    return computeMasCompoundedRate(inputs);
  }, [rates, periodDays]);

  // SORA Index calculation
  const soraIndexCalc = useMemo(() => {
    const startRecord = rates.find((r) => r.date === startIndexDate);
    const endRecord = rates.find((r) => r.date === endIndexDate);

    if (!startRecord || !endRecord) return null;

    const dStart = new Date(startRecord.date);
    const dEnd = new Date(endRecord.date);
    const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
    const calendarDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    const rate = computeFromSoraIndex(
      startRecord.soraIndex,
      endRecord.soraIndex,
      calendarDays
    );

    return {
      startIndex: startRecord.soraIndex,
      endIndex: endRecord.soraIndex,
      calendarDays,
      rate,
    };
  }, [rates, startIndexDate, endIndexDate]);

  return (
    <div className="space-y-6">
      {/* Methodological Transparency Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              MAS SORA Compounding Methodology
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Monetary Authority of Singapore (MAS) compounding formula with ACT/365 Fixed convention
            </p>
          </div>
          <div className="text-xs text-slate-500 shrink-0">
            MAS Notice 645 / Working Group on SORA (SC-STS)
          </div>
        </div>

        {/* Formula Display */}
        <div className="bg-slate-50 rounded-lg p-4 my-4 border border-slate-200/80 font-mono text-xs text-slate-800 overflow-x-auto">
          <div className="font-semibold text-slate-900 mb-1">
            Compounded SORA (Annualized %):
          </div>
          <div className="text-sm py-1 font-mono-numbers">
            Compounded SORA = [ &prod;<sub>i=1</sub><sup>d<sub>b</sub></sup> (1 + (SORA<sub>i</sub> / 100) &times; n<sub>i</sub> / 365) - 1 ] &times; (365 / d<sub>c</sub>) &times; 100%
          </div>
          <div className="text-[11px] text-slate-500 mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>&bull; <strong>SORA<sub>i</sub></strong>: Daily overnight rate on day i</div>
            <div>&bull; <strong>n<sub>i</sub></strong>: Days rate applies (3 for Friday/weekends)</div>
            <div>&bull; <strong>d<sub>c</sub></strong>: Total calendar days in observation period</div>
          </div>
        </div>

        {/* Interactive Period Selector */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs font-semibold text-slate-700">
            Observation Period Simulator:
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setPeriodDays(30)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                periodDays === 30
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1-Month (30 Days)
            </button>
            <button
              onClick={() => setPeriodDays(90)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                periodDays === 90
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3-Month (90 Days)
            </button>
          </div>
        </div>

        {/* Output Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/80">
          <div>
            <div className="text-xs text-emerald-800 font-medium">Computed Compounded Rate</div>
            <div className="text-2xl font-bold font-mono-numbers text-emerald-950 mt-0.5">
              {compoundingData.compoundedRate.toFixed(4)}%
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Annualized over {compoundingData.totalCalendarDays} calendar days
            </div>
          </div>

          <div>
            <div className="text-xs text-emerald-800 font-medium">Daily Data Points</div>
            <div className="text-2xl font-bold font-mono-numbers text-emerald-950 mt-0.5">
              {compoundingData.steps.length} days
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Weighted by business & weekend days
            </div>
          </div>

          <div>
            <div className="text-xs text-emerald-800 font-medium">Why Compounding Matters</div>
            <div className="text-xs text-emerald-900 mt-1 leading-relaxed">
              Short-term liquidity spikes in overnight interbank lending are naturally dampened and smoothed out over the period.
            </div>
          </div>
        </div>

        {/* Step-by-Step Table */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Daily Observation Walk-through (Recent Records)
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Daily Overnight SORA</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Days Spanned (n<sub>i</sub>)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Daily Factor (1 + r&times;n/365)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cumulative Product (&prod;)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {compoundingData.steps.map((step, idx) => (
                  <tr key={step.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono-numbers text-slate-700">{step.date}</td>
                    <td className="py-2 px-3 font-mono-numbers text-right font-medium text-slate-900">
                      {step.rate.toFixed(4)}%
                    </td>
                    <td className="py-2 px-3 font-mono-numbers text-right text-slate-600">
                      {step.daysSpanned} {step.daysSpanned > 1 ? '(Weekend)' : ''}
                    </td>
                    <td className="py-2 px-3 font-mono-numbers text-right text-slate-600">
                      {step.factor.toFixed(8)}
                    </td>
                    <td className="py-2 px-3 font-mono-numbers text-right font-medium text-slate-900">
                      {step.cumulativeProduct.toFixed(8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SORA Index Ratio Calculator Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            SORA Index Calculator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculate compounded interest between any two arbitrary dates using published MAS SORA Index values
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 my-4 border border-slate-200/80 font-mono text-xs text-slate-800">
          Rate = [ (SORA Index<sub>end</sub> / SORA Index<sub>start</sub>) - 1 ] &times; (365 / Calendar Days) &times; 100%
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Start Date
            </label>
            <select
              value={startIndexDate}
              onChange={(e) => setStartIndexDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-md"
            >
              {rates.map((r) => (
                <option key={r.date} value={r.date}>
                  {r.date} (Index: {r.soraIndex.toFixed(8)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              End Date
            </label>
            <select
              value={endIndexDate}
              onChange={(e) => setEndIndexDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-md"
            >
              {rates.map((r) => (
                <option key={r.date} value={r.date}>
                  {r.date} (Index: {r.soraIndex.toFixed(8)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {soraIndexCalc && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">
                Calculated SORA Rate ({soraIndexCalc.calendarDays} Days)
              </div>
              <div className="text-2xl font-bold font-mono-numbers text-slate-900 mt-0.5">
                {soraIndexCalc.rate.toFixed(4)}% p.a.
              </div>
            </div>
            <div className="text-xs text-slate-500 sm:text-right font-mono-numbers">
              <div>Index Start: {soraIndexCalc.startIndex.toFixed(8)}</div>
              <div>Index End: {soraIndexCalc.endIndex.toFixed(8)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
