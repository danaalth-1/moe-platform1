/*
# Phase 2.1: Connection requests system

1. New Tables
- `connection_requests`
  - `id` (uuid, primary key)
  - `employee_id` (uuid, references profiles — the employee who sent the request)
  - `manager_id` (uuid, references profiles — the manager who receives the request)
  - `status` (text, 'pending' | 'approved' | 'rejected', default 'pending')
  - `created_at` (timestamptz)
  - Unique constraint on (employee_id, manager_id) to prevent duplicate requests.
  - Partial unique index on employee_id WHERE status = 'approved' so an employee
    can have only ONE approved (active) manager at a time.

2. Security
- Enable RLS on `connection_requests`.
- Employees can SELECT their own requests (employee_id = auth.uid()).
- Managers can SELECT requests sent to them (manager_id = auth.uid()).
- Employees can INSERT requests where they are the employee, and the manager_id
  must reference a user with role = 'manager' (enforced by WITH CHECK subquery).
- Managers can UPDATE the status of requests sent to them (manager_id = auth.uid()).
  The WITH CHECK ensures they can only change status, not reassign ids.
- No DELETE policy — requests are permanent records.

3. Trigger
- `on_connection_approved` — AFTER UPDATE on connection_requests.
  When status changes to 'approved':
    1. Delete any existing assignment for this employee (so the employee has only
       one active manager — the newly approved one).
    2. Insert a new row in `assignments` linking employee_id → manager_id.
  This runs as SECURITY DEFINER so it can write to `assignments` regardless of
  which role triggered it. EXECUTE is revoked from anon/authenticated so it
  cannot be called directly via REST.

4. Notes
- The existing `assignments` table from Phase 2 is reused unchanged.
- The unique partial index guarantees the "one active manager per employee" rule
  at the database level — a second approval for the same employee would fail.
- Rejected requests remain in the table so the employee sees "تم الرفض".
  The employee can send a new request to a different manager.
*/

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, manager_id)
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_connection_requests" ON public.connection_requests;
CREATE POLICY "select_own_connection_requests"
ON public.connection_requests FOR SELECT
TO authenticated
USING (auth.uid() = employee_id OR auth.uid() = manager_id);

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

DROP POLICY IF EXISTS "update_own_connection_requests" ON public.connection_requests;
CREATE POLICY "update_own_connection_requests"
ON public.connection_requests FOR UPDATE
TO authenticated
USING (auth.uid() = manager_id)
WITH CHECK (auth.uid() = manager_id);

-- Partial unique index: only one approved request per employee
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_approved_manager_per_employee
ON public.connection_requests (employee_id)
WHERE status = 'approved';

-- Trigger function: when a request is approved, create the assignment
CREATE OR REPLACE FUNCTION public.on_connection_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status <> 'approved') THEN
    -- Remove any existing assignment for this employee (one active manager rule)
    DELETE FROM public.assignments WHERE employee_id = NEW.employee_id;
    -- Create the new assignment
    INSERT INTO public.assignments (manager_id, employee_id)
    VALUES (NEW.manager_id, NEW.employee_id)
    ON CONFLICT (manager_id, employee_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connection_approved ON public.connection_requests;
CREATE TRIGGER trg_connection_approved
AFTER UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.on_connection_approved();

-- Revoke direct EXECUTE on the trigger function from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.on_connection_approved() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_connection_approved() FROM anon;
REVOKE EXECUTE ON FUNCTION public.on_connection_approved() FROM authenticated;

-- Index for manager's incoming requests query
CREATE INDEX IF NOT EXISTS idx_connection_requests_manager ON public.connection_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_employee ON public.connection_requests(employee_id);