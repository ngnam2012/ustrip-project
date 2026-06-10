import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env.');
}

export const db = createClient(url || 'http://localhost:54321', key || 'development-key', {
  auth: { persistSession: false, autoRefreshToken: false }
});
