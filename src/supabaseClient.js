// Клиент Supabase (создаётся только в удалённом режиме)
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isRemoteMode } from './config.js'

export const supabase = isRemoteMode() ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
