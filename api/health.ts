/**
 * Serverless Health Check Endpoint
 * Path: /api/health.ts
 *
 * Verifies serverless gateway status and indicates whether MAS_KEY_ID is configured.
 */

// Universal serverless request/response types
type ServerlessRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ServerlessResponse = {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

export default async function handler(
  req: any,
  res: any
) {
  const isMasConfigured = Boolean(process.env.MAS_KEY_ID);

  const payload = {
    status: 'ok',
    service: 'Singapore SORA MAS API Gateway',
    timestamp: new Date().toISOString(),
    masConfigured: isMasConfigured,
    endpoints: {
      health: '/api/health',
      sora: '/api/sora',
    },
    message: isMasConfigured
      ? 'MAS_KEY_ID is configured. Ready to query Monetary Authority of Singapore gateway.'
      : 'MAS_KEY_ID is not set in environment variables. Please provide MAS_KEY_ID to query live MAS data.',
  };

  if (res?.setHeader) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
  }

  if (typeof res?.status === 'function' && typeof res?.json === 'function') {
    return res.status(200).json(payload);
  }

  // Universal fallback for edge/fetch runtime
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
