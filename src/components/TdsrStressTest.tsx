import React, { useState } from 'react';
import { CalculationResult, TdsrParams } from '../types/sora';
import { calculateTdsrCompliance } from '../utils/soraMath';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface TdsrStressTestProps {
  result: CalculationResult;
}

export const TdsrStressTest: React.FC<TdsrStressTestProps> = ({ result }) => {
  const [params, setParams] = useState<TdsrParams>({
    monthlyIncome: 12000,
    otherDebts: 800,
    propertyType: 'residential_hdb',
    stressRate: 4.00,
  });

  const tdsrResult = calculateTdsrCompliance(params, result.stressedMonthlyPayment);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            MAS TDSR & MSR Regulatory Stress Test
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monetary Authority of Singapore (MAS Notice 645) medium-term interest rate floor assessment
          </p>
        </div>
        <div className="text-xs text-slate-500">
          MAS Floor: <span className="font-mono-numbers font-semibold text-slate-900">4.00% p.a.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
        {/* Left: Input parameters */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Gross Monthly Household Income (SGD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                S$
              </span>
              <input
                type="number"
                step="500"
                min="1000"
                value={params.monthlyIncome}
                onChange={(e) =>
                  setParams({ ...params, monthlyIncome: Number(e.target.value) || 0 })
                }
                className="w-full pl-9 pr-3 py-2 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              {[8000, 12000, 16000, 25000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setParams({ ...params, monthlyIncome: inc })}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  S${(inc / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Other Monthly Debt Commitments (Car, Personal, Credit Cards)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                S$
              </span>
              <input
                type="number"
                step="100"
                min="0"
                value={params.otherDebts}
                onChange={(e) =>
                  setParams({ ...params, otherDebts: Number(e.target.value) || 0 })
                }
                className="w-full pl-9 pr-3 py-2 text-xs font-mono-numbers text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Property Type (Subject to MSR)
            </label>
            <select
              value={params.propertyType}
              onChange={(e) =>
                setParams({
                  ...params,
                  propertyType: e.target.value as TdsrParams['propertyType'],
                })
              }
              className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="residential_hdb">HDB Flat / Executive Condominium (MSR 30% + TDSR 55%)</option>
              <option value="residential_private">Private Residential Property (TDSR 55%)</option>
              <option value="commercial">Commercial / Industrial Property (TDSR 55%)</option>
            </select>
          </div>
        </div>

        {/* Right: Regulatory Compliance Status */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-700">
                Regulatory Assessment
              </span>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {tdsrResult.isTdsrCompliant ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> TDSR Compliant
                  </span>
                ) : (
                  <span className="text-rose-700 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> TDSR Exceeded
                  </span>
                )}
              </div>
            </div>

            {/* TDSR Metric Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">TDSR Ratio</span>
                <span className="font-mono-numbers font-bold text-slate-900">
                  {tdsrResult.tdsrRatio}% / 55% Max Limit
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    tdsrResult.isTdsrCompliant ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                  style={{ width: `${Math.min(100, (tdsrResult.tdsrRatio / 55) * 100)}%` }}
                />
              </div>
            </div>

            {/* MSR Metric Bar (for HDB) */}
            {tdsrResult.msrRatio !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">HDB MSR Ratio</span>
                  <span className="font-mono-numbers font-bold text-slate-900">
                    {tdsrResult.msrRatio}% / 30% Max Limit
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      tdsrResult.isMsrCompliant ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.min(100, (tdsrResult.msrRatio / 30) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Summary details */}
            <div className="mt-5 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Stressed Monthly Installment:</span>
                <span className="font-mono-numbers font-medium text-slate-900">
                  S${result.stressedMonthlyPayment.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Monthly Commitments:</span>
                <span className="font-mono-numbers font-medium text-slate-900">
                  S${(result.stressedMonthlyPayment + params.otherDebts).toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-slate-900 font-semibold">
                <span>Max Allowable Loan Principal:</span>
                <span className="font-mono-numbers text-emerald-700">
                  S${tdsrResult.maxAffordableLoan.toLocaleString('en-SG')}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            * Under MAS Notice 645, financial institutions must apply a stress interest rate of at least 4.00% p.a. to calculate borrowers&apos; debt servicing ratios.
          </div>
        </div>
      </div>
    </div>
  );
};
