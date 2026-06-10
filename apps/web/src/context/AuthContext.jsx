import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem('ustrip_token')) return setLoading(false);
    api('/auth/me').then(setUser).catch(() => localStorage.removeItem('ustrip_token')).finally(() => setLoading(false));
  }, []);
  const authenticate = async (mode, values) => {
    const data = await api(`/auth/${mode}`, { method: 'POST', body: values });
    localStorage.setItem('ustrip_token', data.token);
    setUser(data.user);
  };
  const logout = () => { localStorage.removeItem('ustrip_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, setUser, loading, login: (v) => authenticate('login', v), register: (v) => authenticate('register', v), logout }}>{children}</AuthContext.Provider>;
}
