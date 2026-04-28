import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jtubizlrigutrhwcdmqd.supabase.co'
const supabaseAnonKey = 'sb_publishable_7dqSoSESHxrNLtCK1EckNg_-NTkecI9'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
