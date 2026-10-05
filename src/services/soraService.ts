import { SoraDailyRecord, BackendConfig, CalculationResult } from '../types/sora';
import { MAS_OFFICIAL_ARCHIVE, LATEST_MAS_BENCHMARKS } from '../data/masSoraRates';

const STORAGE_KEY_BACKEND_CONFIG = 'sora_calculator_backend_config';

export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  mode: 'offline_archive',
  customEndpointUrl: '/api/sora',
  apiKey: '',
  isCustomConnected: false,
};

export function loadBackendConfig(): BackendConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BACKEND_CONFIG);
    if (raw) {
      return { ...DEFAULT_BACKEND_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('Could not read backend config from localStorage', err);
  }
  return DEFAULT_BACKEND_CONFIG;
}

export function saveBackendConfig(config: BackendConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_BACKEND_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('Could not write backend config to localStorage', err);
  }
}

export interface FetchRatesResponse {
  source: 'offline_archive' | 'public_api' | 'custom_backend';
  rates: SoraDailyRecord[];
  latestBenchmark: typeof LATEST_MAS_BENCHMARKS;
  isFallback: boolean;
  message?: string;
  latencyMs?: number;
}

/**
 * Fetch SORA rates based on active backend configuration.
 */
export async function fetchSoraRates(config: BackendConfig): Promise<FetchRatesResponse> {
  const startTime = performance.now();

  // Mode 1: Custom Backend / Serverless Endpoint Integration (/api/sora or custom server)
  if (config.mode === 'custom_backend' && config.customEndpointUrl) {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (config.apiKey) {
        headers['KeyId'] = config.apiKey;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.customEndpointUrl, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server responded with status ${response.status}`);
      }

      // Verify and adapt serverless MAS response payload
      if (Array.isArray(data.rates) && data.rates.length > 0) {
        return {
          source: 'custom_backend',
          rates: data.rates,
          latestBenchmark: data.latestBenchmark || LATEST_MAS_BENCHMARKS,
          isFallback: false,
          latencyMs,
          message: `Connected successfully to MAS Serverless Gateway (${latencyMs}ms)`,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network failure';
      console.warn('Serverless endpoint request failed, falling back to MAS official archive:', msg);
      return {
        source: 'offline_archive',
        rates: MAS_OFFICIAL_ARCHIVE,
        latestBenchmark: LATEST_MAS_BENCHMARKS,
        isFallback: true,
        message: `${msg}. Using MAS official baseline archive.`,
      };
    }
  }

  // Mode 2: Live Public Macro Series (PropKaki / MAS derivative)
  if (config.mode === 'public_api') {
    try {
      const res = await fetch('https://api.propkaki.sg/api/market/series?vertical=macro&keys=sora_3m_compounded_qtr');
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.series && json.series.length > 0) {
          const points = json.series[0].points || [];
          const latencyMs = Math.round(performance.now() - startTime);
          
          return {
            source: 'public_api',
            rates: MAS_OFFICIAL_ARCHIVE,
            latestBenchmark: {
              ...LATEST_MAS_BENCHMARKS,
              comp3M: points.length > 0 ? points[points.length - 1].v : LATEST_MAS_BENCHMARKS.comp3M,
            },
            isFallback: false,
            latencyMs,
            message: `Fetched latest public Singapore macro feed (${latencyMs}ms)`,
          };
        }
      }
    } catch (err) {
      console.warn('Public API error, falling back to MAS archive', err);
    }
  }

  // Default: Official MAS Archive (Fast, deterministic, zero-latency)
  const latencyMs = Math.round(performance.now() - startTime);
  return {
    source: 'offline_archive',
    rates: MAS_OFFICIAL_ARCHIVE,
    latestBenchmark: LATEST_MAS_BENCHMARKS,
    isFallback: false,
    latencyMs,
    message: 'Loaded verified Monetary Authority of Singapore official benchmark archive.',
  };
}

/**
 * Test an endpoint for user backend verification.
 */
export async function testBackendConnection(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; latencyMs: number; error?: string; sampleData?: unknown }> {
  const start = performance.now();
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) {
      headers['KeyId'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        success: false,
        latencyMs,
        error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      latencyMs,
      sampleData: data,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      latencyMs,
      error: err instanceof Error ? err.message : 'Connection failed or timed out',
    };
  }
}

/**
 * Export loan calculation schedule to CSV format.
 */
export function exportScheduleToCsv(result: CalculationResult, loanAmount: number): void {
  const headers = [
    'Month',
    'Date',
    'Starting Balance (SGD)',
    'Monthly Installment (SGD)',
    'Principal Paid (SGD)',
    'Interest Paid (SGD)',
    'Extra Prepayment (SGD)',
    'Ending Balance (SGD)',
    'Effective Rate (% p.a.)',
    'Days in Month',
  ];

  const rows = result.schedule.map((row) => [
    row.month,
    row.date,
    row.startingBalance.toFixed(2),
    row.payment.toFixed(2),
    row.principal.toFixed(2),
    row.interest.toFixed(2),
    row.extraPayment.toFixed(2),
    row.endingBalance.toFixed(2),
    row.applicableRate.toFixed(4),
    row.daysInMonth,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [
      `# Singapore SORA Loan Amortization Schedule`,
      `# Initial Loan Principal: SGD ${loanAmount.toLocaleString()}`,
      `# Effective Rate: ${result.effectiveRate}% p.a.`,
      `# Total Interest: SGD ${result.totalInterest.toLocaleString()}`,
      `# Payoff Date: ${result.payoffDate}`,
      headers.join(','),
      ...rows.map((e) => e.join(',')),
    ].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `SORA_Amortization_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
