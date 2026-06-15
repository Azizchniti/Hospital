import { createClient } from '@supabase/supabase-js'
import type { Patient } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in your credentials.'
  )
}

// Define database types inline (can be generated via supabase gen types later)
export type Database = {
  public: {
    Tables: {
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
