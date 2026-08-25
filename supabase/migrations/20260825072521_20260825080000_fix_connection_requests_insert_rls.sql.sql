/*
# Fix connection_requests INSERT policy — bypass RLS on manager check

## Problem
The INSERT policy's WITH CHECK used a subquery against `public.profiles`
to verify `manager_id` is a manager:
  manager_id IN (SELECT p.id FROM profiles p WHERE p.role = 'manager')
But `profiles` has RLS enabled (select_own_profile: auth.uid() = id), so
when an employee inserts a request, the subquery runs under the employee's
RLS context and can only see their own profile row — which is not a manager.
The subquery returns zero rows, so the WITH CHECK is always false, and
every INSERT fails with "new row violates row-level security policy".

## Fix
1. Add a SECURITY DEFINER function `is_manager(p_user_id uuid)` that
   returns true if the given user id has role = 'manager' in profiles.
   This bypasses RLS on profiles (it runs as the function owner).
   EXECUTE is granted to authenticated only, revoked from anon/public.
2. Replace the INSERT policy's WITH CHECK to use `public.is_manager(manager_id)`
   instead of the RLS-blocked subquery.

## What does NOT change
- SELECT, UPDATE policies are untouched.
- The unique constraint on (employee_id, manager_id) still prevents duplicates.
- The partial unique index on approved requests still enforces one active manager.
- The approval trigger still creates assignments.
- No UI changes.
*/

-- ============================================================
-- 1. is_manager helper function (SECURITY DEFINER, bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT p.role INTO v_role
  FROM public.profiles p
  WHERE p.id = p_user_id;

  RETURN v_role = 'manager';
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_manager(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM PUBLIC;

-- ============================================================
-- 2. Replace the INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "insert_own_connection_requests" ON public.connection_requests;
CREATE POLICY "insert_own_connection_requests"
ON public.connection_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = employee_id
  AND public.is_manager(manager_id)
);
