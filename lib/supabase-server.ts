/**
 * Client Supabase côté serveur (Server Components + routes API).
 * Utilise next/headers — à importer UNIQUEMENT dans du code serveur (pas dans Client Components).
 */
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// --------------------------------------------------------
// Client serveur avec cookies (Server Components, Route Handlers)
// Supabase SSR exige getAll + setAll pour pouvoir rafraîchir la session (cookies).
// --------------------------------------------------------
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En Server Component, set() n'est pas disponible ; le middleware gère le refresh.
        }
      },
    },
  });
}

// --------------------------------------------------------
// Client admin (service_role) — serveur uniquement, bypass RLS
// --------------------------------------------------------
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// --------------------------------------------------------
// Client anon sans session — signUp / auth depuis une route API
// (pas de cookies ; évite de mélanger avec la session navigateur)
// --------------------------------------------------------
export function createAnonAuthClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
