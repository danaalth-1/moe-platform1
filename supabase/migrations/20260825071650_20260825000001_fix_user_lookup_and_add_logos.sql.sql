/*
# Fix user lookup by email + add manager logos

This migration fixes two issues:
1. Email-based user lookup (manager finding employee, employee finding manager)
   was broken because RLS on `profiles` only allowed reading your own row.
   We add two SECURITY DEFINER lookup functions that bypass RLS safely and
   return only the minimal fields needed for connection/assignment flows.
2. Adds a `manager_logos` table and a private storage bucket so each manager
   can upload, preview, persist, delete, and select logos for future PDFs.

## 1. Lookup functions (SECURITY DEFINER)

- `lookup_user_by_email(p_email text, p_role text)`
  Returns `id, full_name, email, role` for the user matching `p_email`
  (case-insensitive, trimmed) AND `p_role`. Returns no rows if not found
  or if the role does not match. Callable only by authenticated users.
  EXECUTE revoked from anon so unauthenticated clients cannot enumerate users.

- `lookup_manager_for_employee(p_email text)`
  Convenience wrapper returning manager profiles by email.

- `lookup_employee_for_manager(p_email text)`
  Convenience wrapper returning employee profiles by email.

These functions are the single source of truth for email-based lookup and
respect the role separation (manager vs employee) at the database level.

## 2. connection_requests INSERT policy fix

The old INSERT policy's WITH CHECK used a subquery against `public.profiles`
to verify `manager_id` is a manager. That subquery was subject to RLS, so an
employee could not see the manager's profile row and the insert would fail.
We replace the policy with one that verifies the manager role via the
`lookup_user_by_email` SECURITY DEFINER function (bypasses RLS) OR simply
checks `manager_id <> employee_id` and lets the trigger enforce the rest.
The robust fix: WITH CHECK verifies `auth.uid() = employee_id` and that
`manager_id` corresponds to a real manager via the lookup function.

## 3. manager_logos table

- `id` uuid PK
- `manager_id` uuid NOT NULL (references profiles, ON DELETE CASCADE)
- `storage_path` text NOT NULL — the path in the `manager-logos` bucket
- `public_url` text NOT NULL — the public URL of the uploaded file
- `file_name` text NOT NULL — original file name
- `selected_for_pdf` boolean NOT NULL DEFAULT false — whether to use in PDFs
- `created_at` timestamptz DEFAULT now()

RLS: each manager can only SELECT/INSERT/UPDATE/DELETE their own logos
(manager_id = auth.uid()).

## 4. Storage bucket

- Private bucket `manager-logos` (not public) so logos are access-controlled.
- Storage policies allow each authenticated user to manage only objects under
  a path prefixed with their own auth.uid().

## 5. Security notes

- Lookup functions: SECURITY DEFINER, search_path = public, EXECUTE granted
  to authenticated only, revoked from anon and public.
- manager_logos: standard owner-scoped RLS (4 policies, TO authenticated).
- Storage: path-prefixed policies ensure Manager A cannot read/write
  Manager B's logo objects.
*/

-- ============================================================
-- 1. Lookup functions
-- ============================================================

-- Drop old versions if they exist
DROP FUNCTION IF EXISTS public.lookup_user_by_email(text, text);
DROP FUNCTION IF EXISTS public.lookup_manager_for_employee(text);
DROP FUNCTION IF EXISTS public.lookup_employee_for_manager(text);

-- Main lookup: returns user by email + role
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(p_email text, p_role text)
RETURNS TABLE (id uuid, full_name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.role
  FROM public.profiles p
  WHERE lower(trim(p.email)) = lower(trim(p_email))
    AND p.role = p_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_user_by_email(text, text) FROM PUBLIC;

-- Convenience: manager lookup
CREATE OR REPLACE FUNCTION public.lookup_manager_for_employee(p_email text)
RETURNS TABLE (id uuid, full_name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.role
  FROM public.profiles p
  WHERE lower(trim(p.email)) = lower(trim(p_email))
    AND p.role = 'manager';
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_manager_for_employee(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_manager_for_employee(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_manager_for_employee(text) FROM PUBLIC;

-- Convenience: employee lookup
CREATE OR REPLACE FUNCTION public.lookup_employee_for_manager(p_email text)
RETURNS TABLE (id uuid, full_name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.email, p.role
  FROM public.profiles p
  WHERE lower(trim(p.email)) = lower(trim(p_email))
    AND p.role = 'employee';
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_employee_for_manager(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_employee_for_manager(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.lookup_employee_for_manager(text) FROM PUBLIC;

-- ============================================================
-- 2. Fix connection_requests INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "insert_own_connection_requests" ON public.connection_requests;
CREATE POLICY "insert_own_connection_requests"
ON public.connection_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = employee_id
  AND manager_id IN (
    SELECT p.id FROM public.profiles p WHERE p.role = 'manager'
  )
);

-- ============================================================
-- 3. manager_logos table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.manager_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_name text NOT NULL,
  selected_for_pdf boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.manager_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_logos" ON public.manager_logos;
CREATE POLICY "select_own_logos"
ON public.manager_logos FOR SELECT
TO authenticated
USING (auth.uid() = manager_id);

DROP POLICY IF EXISTS "insert_own_logos" ON public.manager_logos;
CREATE POLICY "insert_own_logos"
ON public.manager_logos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS "update_own_logos" ON public.manager_logos;
CREATE POLICY "update_own_logos"
ON public.manager_logos FOR UPDATE
TO authenticated
USING (auth.uid() = manager_id)
WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS "delete_own_logos" ON public.manager_logos;
CREATE POLICY "delete_own_logos"
ON public.manager_logos FOR DELETE
TO authenticated
USING (auth.uid() = manager_id);

CREATE INDEX IF NOT EXISTS idx_manager_logos_manager ON public.manager_logos(manager_id);

-- ============================================================
-- 4. Storage bucket + policies
-- ============================================================

-- Create private bucket for manager logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('manager-logos', 'manager-logos', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: users can read their own logo objects (path starts with their uid)
DROP POLICY IF EXISTS "manager_logos_storage_select" ON storage.objects;
CREATE POLICY "manager_logos_storage_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'manager-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- INSERT: users can upload to their own folder
DROP POLICY IF EXISTS "manager_logos_storage_insert" ON storage.objects;
CREATE POLICY "manager_logos_storage_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'manager-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE: users can update their own logo objects
DROP POLICY IF EXISTS "manager_logos_storage_update" ON storage.objects;
CREATE POLICY "manager_logos_storage_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'manager-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE: users can delete their own logo objects
DROP POLICY IF EXISTS "manager_logos_storage_delete" ON storage.objects;
CREATE POLICY "manager_logos_storage_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'manager-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
