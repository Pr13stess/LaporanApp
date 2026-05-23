import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xopkcmekdlbzavdxrozu.supabase.co' 
const supabaseAnonKey = 'sb_publishable_-1qf4e6WBE4rFOHVaCgI6g_jfi8eZYe'   

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})