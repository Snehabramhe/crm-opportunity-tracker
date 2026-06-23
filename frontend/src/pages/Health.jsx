import { useEffect, useState } from 'react';
import api from '../services/api.js';

/**
 * Simple connectivity page: pings the backend /api/health through the same
 * axios instance the app uses, so it verifies the real frontend -> API path.
 * Visit at /health (no login required).
 */
export default function Health() {
  const [state, setState] = useState({ status: 'checking', data: null, error: null });

  const check = () => {
    setState({ status: 'checking', data: null, error: null });
    api
      .get('/health')
      .then((res) => setState({ status: 'ok', data: res.data, error: null }))
      .catch((err) =>
        setState({
          status: 'down',
          data: null,
          error: err.response?.data?.message || err.message,
        })
      );
  };

  useEffect(check, []);

  const ok = state.status === 'ok';
  const checking = state.status === 'checking';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-bold text-slate-800">API Health Check</h1>
        <p className="mt-1 text-sm text-slate-500">
          Base URL: <code className="rounded bg-slate-100 px-1">{import.meta.env.VITE_API_URL || '/api'}</code>
        </p>

        <div
          className={`mt-5 rounded-xl border p-4 ${
            checking
              ? 'border-slate-200 bg-slate-50 text-slate-600'
              : ok
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <div className="text-3xl">{checking ? '⏳' : ok ? '✅' : '❌'}</div>
          <p className="mt-2 font-semibold">
            {checking ? 'Checking…' : ok ? 'API is reachable' : 'API is unreachable'}
          </p>
          {ok && (
            <p className="mt-1 text-xs">
              uptime: {Math.round(state.data.uptime)}s
            </p>
          )}
          {state.error && <p className="mt-1 text-xs">{state.error}</p>}
        </div>

        <button onClick={check} className="btn-primary mt-5 w-full" disabled={checking}>
          {checking ? 'Checking…' : 'Re-check'}
        </button>
      </div>
    </div>
  );
}
