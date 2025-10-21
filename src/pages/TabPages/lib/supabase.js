import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage' // if you're using React Native
import Constants from 'expo-constants';
const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig.extra;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
