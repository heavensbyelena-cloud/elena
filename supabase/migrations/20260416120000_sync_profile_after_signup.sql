-- ============================================================
-- EXÉCUTION UNIQUE : Supabase → SQL Editor → tout coller → Run
-- 1) Ajoute les colonnes manquantes sur public.profiles (first_name, etc.)
-- 2) Crée la fonction sync_profile_after_signup
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_address jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'profiles_role_check: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.profiles ALTER COLUMN last_name DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'profiles.last_name: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_after_signup(
  p_user_id uuid,
  p_email text,
  p_first_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_first text := NULLIF(trim(p_first_name), '');
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, default_address, is_admin, role)
    VALUES (p_user_id, v_email, v_first, NULL, NULL, false, 'user')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      is_admin = COALESCE(EXCLUDED.is_admin, profiles.is_admin),
      role = COALESCE(profiles.role, EXCLUDED.role);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_profile try1: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, is_admin, role)
    VALUES (p_user_id, v_email, v_first, NULL, false, 'user')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      is_admin = COALESCE(EXCLUDED.is_admin, profiles.is_admin),
      role = COALESCE(profiles.role, EXCLUDED.role);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_profile try2: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, is_admin)
    VALUES (p_user_id, v_email, v_first, NULL, false)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      is_admin = COALESCE(EXCLUDED.is_admin, profiles.is_admin);
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sync_profile try3: %', SQLERRM;
  END;

  INSERT INTO public.profiles (id, email, first_name, is_admin)
  VALUES (p_user_id, v_email, v_first, false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    is_admin = COALESCE(EXCLUDED.is_admin, profiles.is_admin);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_after_signup(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile_after_signup(uuid, text, text) TO service_role;
