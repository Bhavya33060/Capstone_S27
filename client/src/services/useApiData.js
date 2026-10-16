import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

// refreshMs > 0 re-polls silently (no skeleton flash) — used for live pages
export function useApiData(fetcher, deps = [], refreshMs = 0) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback((silent) => {
    if (!token) return;
    if (!silent) { setLoading(true); setError(null); }
    fetcher(token).then((d) => { setData(d); setError(null); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ...deps]);

  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    if (!refreshMs) return undefined;
    const id = setInterval(() => load(true), refreshMs);
    return () => clearInterval(id);
  }, [load, refreshMs]);

  return { data, loading, error, reload: () => load(false) };
}
