
import { createClient } from '@supabase/supabase-js';

// Use process.env for environment variables to resolve TypeScript errors on ImportMeta and follow project configuration standards
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gwfpeubazkgymbnsyslc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Bkd2xVCzL4b2Ac7DlORVTA_ZJqNf_Az';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
