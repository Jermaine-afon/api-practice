import React, { useState } from 'react';
import { SoraDailyRecord } from '../types/sora';
import { Search, Download, ExternalLink, Calendar, TrendingDown, Layers } from 'lucide-react';

interface RateHistoryViewerProps {
  rates: SoraDailyRecord[];
}

export const RateHistoryViewer: React.FC<RateHistoryViewerProps> = ({ rates }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRates = rates.filter((r) =>
    r.date.includes(searchTerm.trim())
  );

  const exportRatesJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rates, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `MAS_SORA_Rates_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            MAS Benchmark Overnight Rate Archive
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monetary Authority of Singapore (MAS) published daily overnight SORA, volumes, and compounded tenors
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Date Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search date (YYYY-MM)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 w-44"
            />
          </div>

          <button
            onClick={exportRatesJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Benchmark Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 my-2 border-b border-slate-100">
        <div>
          <div className="text-[11px] text-slate-500">Latest SORA Overnight</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            {rates[0]?.rate.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400">{rates[0]?.date}</div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500">1-Month Compounded</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            {rates[0]?.comp1M?.toFixed(2) ?? '-'}%
          </div>
          <div className="text-[10px] text-slate-400">Monthly reset benchmark</div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500">3-Month Compounded</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            {rates[0]?.comp3M?.toFixed(2) ?? '-'}%
          </div>
          <div className="text-[10px] text-slate-400">Mortgage industry standard</div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500">Interbank Volume (Today)</div>
          <div className="text-lg font-bold font-mono-numbers text-slate-900">
            S${rates[0]?.volume.toFixed(2)}B
          </div>
          <div className="text-[10px] text-slate-400">Unsecured overnight SGD</div>
        </div>
      </div>

      {/* Historical Rates Table */}
      <div className="overflow-x-auto mt-2 max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 font-semibold">Date</th>
              <th className="py-2.5 px-3 font-semibold text-right">Overnight SORA</th>
              <th className="py-2.5 px-3 font-semibold text-right">Volume (SGD B)</th>
              <th className="py-2.5 px-3 font-semibold text-right">1M Compounded</th>
              <th className="py-2.5 px-3 font-semibold text-right">3M Compounded</th>
              <th className="py-2.5 px-3 font-semibold text-right">6M Compounded</th>
              <th className="py-2.5 px-3 font-semibold text-right">SORA Index</th>
              <th className="py-2.5 px-3 font-semibold text-right">25th-75th %tile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRates.map((row) => (
              <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2 px-3 font-mono-numbers text-slate-900 font-medium">
                  {row.date}
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right font-semibold text-slate-900">
                  {row.rate.toFixed(4)}%
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right text-slate-600">
                  S${row.volume.toFixed(2)}B
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right text-slate-800">
                  {row.comp1M ? `${row.comp1M.toFixed(2)}%` : '-'}
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right font-medium text-slate-900">
                  {row.comp3M ? `${row.comp3M.toFixed(2)}%` : '-'}
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right text-slate-800">
                  {row.comp6M ? `${row.comp6M.toFixed(2)}%` : '-'}
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right text-slate-500">
                  {row.soraIndex.toFixed(8)}
                </td>
                <td className="py-2 px-3 font-mono-numbers text-right text-slate-400">
                  {row.p25 && row.p75 ? `${row.p25.toFixed(2)} - ${row.p75.toFixed(2)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>Displaying {filteredRates.length} historical MAS published rate records</span>
        <a
          href="https://www.mas.gov.sg/bonds-and-bills/sora"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
        >
          <span>MAS SORA Official Benchmark Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
