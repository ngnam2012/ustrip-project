import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useRemote(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData(await api(path)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [path, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { data, setData, loading, error, reload: load };
}
