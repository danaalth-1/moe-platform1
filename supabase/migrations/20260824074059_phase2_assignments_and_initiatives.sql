/*
# Phase 2: Employee assignments + initiatives tables

1. New Tables
- `assignments`
  - `id` (uuid, primary key)
  - `manager_id` (uuid, references profiles, the manager who owns the assignment)
  - `employee_id` (uuid, references profiles, the employee assigned to the manager)
  - `created_at` (timestamptz)
  - Unique constraint on (manager_id, employee_id) to prevent duplicate assignments.

- `initiatives`
  - `id` (uuid, primary key)
  - `employee_id` (uuid, references profiles, the employee who created the initiative)
  - `manager_id` (uuid, references profiles, the manager assigned to that employee at creation time)
  - `status` (text, default 'under_review' — only status in Phase 2)
  - `created_at` (timestamptz)
  - Step 1 fields: `name`, `idea_description`, `school_or_entity`, `coordinator_name`, `launch_date`, `initiative_type`
  - Step 2 fields: `problem_need`, `need_indicators`
  - Step 3 fields: `general_goal`, `detailed_goals`, `target_audience`, `target_category`
  - Step 4 fields: `execution_actions`, `execution_phases`
  - Step 5 fields: `performance_indicators`, `targeted_results`
  - Step 6 fields: `impact_measurement`, `baseline_comparison`
  - Step 7 fields: `sustainability_plan`, `expansion_plan`

2. Security
- Enable RLS on both tables.
- `assignments`:
  - Managers can SELECT their own assignments (manager_id = auth.uid()).
  - Managers can INSERT assignments where they are the manager.
  - Managers can DELETE their own assignments.
  - Employees can SELECT assignments where they are the employee (so they know their manager).
- `initiatives`:
  - Employees can SELECT/INSERT/UPDATE/DELETE their own initiatives (employee_id = auth.uid()).
  - Managers can SELECT initiatives where manager_id = auth.uid() (initiatives from their assigned employees).

3. Notes
- The `manager_id` on initiatives is set at creation time by the frontend, based on the
  employee's current assignment. This is validated by an RLS WITH CHECK that ensures
  the manager_id matches an existing assignment for that employee.
- `status` is constrained to 'under_review' for Phase 2; future phases will add more statuses.
*/

-- ============ assignments ============
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (manager_id, employee_id)
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assignments" ON public.assignments;
CREATE POLICY "select_own_assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (auth.uid() = manager_id OR auth.uid() = employee_id);

DROP POLICY IF EXISTS "insert_own_assignments" ON public.assignments;
CREATE POLICY "insert_own_assignments"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = manager_id);

DROP POLICY IF EXISTS "delete_own_assignments" ON public.assignments;
CREATE POLICY "delete_own_assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (auth.uid() = manager_id);

-- ============ initiatives ============
CREATE TABLE IF NOT EXISTS public.initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'under_review' CHECK (status IN ('under_review')),
  created_at timestamptz DEFAULT now(),

  -- Step 1: اسم المبادرة وفكرتها
  name text NOT NULL,
  idea_description text NOT NULL,
  school_or_entity text NOT NULL,
  coordinator_name text NOT NULL,
  launch_date date NOT NULL,
  initiative_type text NOT NULL CHECK (initiative_type IN ('educational', 'community', 'developmental')),

  -- Step 2: مبررات المبادرة واحتياجها
  problem_need text NOT NULL,
  need_indicators text NOT NULL,

  -- Step 3: الهدف والفئة المستهدفة
  general_goal text NOT NULL,
  detailed_goals text NOT NULL,
  target_audience text NOT NULL,
  target_category text NOT NULL CHECK (target_category IN ('skill_development', 'academic_support', 'community_participation')),

  -- Step 4: خطة التنفيذ
  execution_actions text NOT NULL,
  execution_phases text NOT NULL,

  -- Step 5: مؤشرات الأداء والنتائج المستهدفة
  performance_indicators text NOT NULL,
  targeted_results text NOT NULL,

  -- Step 6: الأثر وقياس النتائج
  impact_measurement text NOT NULL,
  baseline_comparison text NOT NULL,

  -- Step 7: الاستدامة والتوسع
  sustainability_plan text NOT NULL,
  expansion_plan text NOT NULL
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_initiatives" ON public.initiatives;
CREATE POLICY "select_own_initiatives"
ON public.initiatives FOR SELECT
TO authenticated
USING (auth.uid() = employee_id OR auth.uid() = manager_id);

DROP POLICY IF EXISTS "insert_own_initiatives" ON public.initiatives;
CREATE POLICY "insert_own_initiatives"
ON public.initiatives FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = employee_id
  AND manager_id IN (
    SELECT a.manager_id FROM public.assignments a WHERE a.employee_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "update_own_initiatives" ON public.initiatives;
CREATE POLICY "update_own_initiatives"
ON public.initiatives FOR UPDATE
TO authenticated
USING (auth.uid() = employee_id)
WITH CHECK (auth.uid() = employee_id);

DROP POLICY IF EXISTS "delete_own_initiatives" ON public.initiatives;
CREATE POLICY "delete_own_initiatives"
ON public.initiatives FOR DELETE
TO authenticated
USING (auth.uid() = employee_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignments_manager ON public.assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON public.assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_employee ON public.initiatives(employee_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_manager ON public.initiatives(manager_id);