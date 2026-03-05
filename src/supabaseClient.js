// This file creates a connection to our database (Supabase) so the rest of the app can use it.
import { createClient } from '@supabase/supabase-js'

// import.meta.env gets environment variables defined in our .env file.
// The fallback strings ('http://localhost' and 'dummy') prevent crashing if the .env file is missing.
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost'
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy'

// We create a single 'supabase' instance and 'export' it.
// Any other file that needs to talk to the database will 'import' this variable.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
