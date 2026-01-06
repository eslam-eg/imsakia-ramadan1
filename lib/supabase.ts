
import { createClient } from '@supabase/supabase-js';

// تثبيت البيانات مباشرة بناءً على طلبك لضمان عمل المشروع 100%
const supabaseUrl = 'https://gwfpeubazkgymbnsyslc.supabase.co';
const supabaseAnonKey = 'sb_publishable_Bkd2xVCzL4b2Ac7DlORVTA_ZJqNf_Az';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
