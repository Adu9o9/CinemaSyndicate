import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hxtnjddgmheiyvgstblu.supabase.co';
const supabaseAnonKey = 'sb_publishable_EwXnMPK9l8kfEz0blAz-5Q_wr--Qhnc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);