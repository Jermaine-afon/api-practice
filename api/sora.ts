/**
 * Serverless MAS SORA Data Pull Endpoint
 * Path: /api/sora.ts
 *
 * Pulls daily SORA and compounded 1M/3M/6M benchmark averages directly from
 * the Monetary Authority of Singapore (MAS) APIMG gateway.
 *
 * Endpoint:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 *
 * Required Header for MAS:
 * KeyId: <MAS_KEY_ID>
 *
 * Note: No API keys are hardcoded. MAS_KEY_ID is read from environment variables or request headers.
 */

const MAS_ENDPOINT_URL =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

type ServerlessRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ServerlessResponse = {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: () => void;
};

export interface NormalizedSoraRecord {
  date: string;
  rate: number;
  volume: number;
  soraIndex: number;
  comp1M?: number;
  comp3M?: number;
  comp6M?: number;
  p10?: number;
  p25?: number;
  p75?: number;
  p90?: number;
}

export default async function handler(
  req: any,
  res: any
) {
  // Set CORS headers
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, key-id, x-mas-key-id, Authorization');
    res.setHeader('Content-Type', 'application/json');
  }

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') {
      const resp = res.status(204);
      if (typeof resp?.end === 'function') {
        return resp.end();
      }
      return resp.json({});
    }
    return new Response(null, { status: 204 });
  }

  // Retrieve MAS KeyId securely without hardcoding
  const getHeader = (key: string): string | undefined => {
    if (!req.headers) return undefined;
    const val = req.headers[key] || req.headers[key.toLowerCase()];
    return Array.isArray(val) ? val[0] : val;
  };

  const masKeyId =
    process.env.MAS_KEY_ID ||
    getHeader('KeyId') ||
    getHeader('key-id') ||
    getHeader('x-mas-key-id') ||
    (typeof req.query?.key_id === 'string' ? req.query.key_id : undefined);

  if (!masKeyId) {
    const errorPayload = {
      ok: false,
      error: 'MAS_KEY_ID is not configured.',
      message:
        'Please set the MAS_KEY_ID environment variable in your .env / deployment settings, or pass the "KeyId" header.',
      endpoint: MAS_ENDPOINT_URL,
      requiredHeader: 'KeyId: <YOUR_MAS_KEY_ID>',
    };

    if (typeof res.status === 'function') {
      return res.status(401).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Construct MAS request URL with optional query filters
    const url = new URL(MAS_ENDPOINT_URL);
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (value && key !== 'key_id') {
          url.searchParams.set(key, Array.isArray(value) ? value[0] : value);
        }
      }
    }

    const masStartTime = performance.now();

    // Call MAS API Gateway
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'KeyId': masKeyId,
        'Accept': 'application/json',
        'User-Agent': 'Singapore-SORA-Calculator-Serverless/1.0',
      },
    });

    const latencyMs = Math.round(performance.now() - masStartTime);

    if (!response.ok) {
      const errText = await response.text();
      const failPayload = {
        ok: false,
        error: `Monetary Authority of Singapore (MAS) gateway returned status ${response.status}`,
        statusText: response.statusText,
        details: errText.slice(0, 500),
        latencyMs,
      };

      if (typeof res.status === 'function') {
        return res.status(response.status).json(failPayload);
      }
      return new Response(JSON.stringify(failPayload), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawData = await response.json();

    // Normalize MAS records structure
    // MAS responses can return { result: { records: [...] } } or { records: [...] } or direct array
    const recordList: any[] =
      rawData?.result?.records ||
      rawData?.records ||
      (Array.isArray(rawData) ? rawData : []);

    const normalizedRates: NormalizedSoraRecord[] = recordList.map((item: any) => {
      const date =
        item.end_of_day ||
        item.date ||
        item.EndOfDay ||
        item.date_of_rate ||
        new Date().toISOString().slice(0, 10);

      const rate = Number(item.sora || item.rate || item.SORA || 0);
      const volume = Number(item.aggregate_volume || item.volume || item.AggregateVolume || 0);
      const soraIndex = Number(item.sora_index || item.soraIndex || item.SORAIndex || 1.0);
      const comp1M = item.comp_sora_1m !== undefined ? Number(item.comp_sora_1m) : undefined;
      const comp3M = item.comp_sora_3m !== undefined ? Number(item.comp_sora_3m) : undefined;
      const comp6M = item.comp_sora_6m !== undefined ? Number(item.comp_sora_6m) : undefined;

      const p10 = item.percentile_10 !== undefined ? Number(item.percentile_10) : undefined;
      const p25 = item.percentile_25 !== undefined ? Number(item.percentile_25) : undefined;
      const p75 = item.percentile_75 !== undefined ? Number(item.percentile_75) : undefined;
      const p90 = item.percentile_90 !== undefined ? Number(item.percentile_90) : undefined;

      return {
        date,
        rate,
        volume,
        soraIndex,
        comp1M,
        comp3M,
        comp6M,
        p10,
        p25,
        p75,
        p90,
      };
    });

    const latest = normalizedRates[0] || null;

    const payload = {
      ok: true,
      source: 'Monetary Authority of Singapore (MAS) APIMG Gateway',
      count: normalizedRates.length,
      latencyMs,
      latestBenchmark: latest
        ? {
            overnight: latest.rate,
            comp1M: latest.comp1M ?? latest.rate,
            comp3M: latest.comp3M ?? latest.rate,
            comp6M: latest.comp6M ?? latest.rate,
            soraIndex: latest.soraIndex,
            lastUpdated: latest.date,
            volumeToday: latest.volume,
          }
        : null,
      rates: normalizedRates,
      rawSummary: {
        totalRecords: recordList.length,
      },
    };

    if (typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown network failure';
    const errPayload = {
      ok: false,
      error: 'Failed to communicate with MAS gateway',
      details: errorMsg,
    };

    if (typeof res.status === 'function') {
      return res.status(502).json(errPayload);
    }
    return new Response(JSON.stringify(errPayload), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
