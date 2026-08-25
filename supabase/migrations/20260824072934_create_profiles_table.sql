/*
# Create profiles table for role-based authentication

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users on delete cascade)
  - `full_name` (text, not null) — the user's full Arabic name
  - `email` (text, not null) — the user's email address
  - `role` (text, not null) — either 'manager' or 'employee'
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `profiles`.
- Each authenticated user can read their own profile row.
- Each authenticated user can insert their own profile row (created on signup).
- Each authenticated user can update their own profile row.
- A trigger automatically inserts a profile row when a new auth.users row is created.

3. Notes
- The `role` column is stored in `profiles` (not in user_metadata) so it is
  server-controlled and cannot be tampered with from the client.
- A SECURITY DEFINER function `handle_new_user` inserts a default profile
  row on signup; the frontend then updates it with the real role and full_name.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'employee')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;
CREATE POLICY "delete_own_profile"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Function to handle new user signup: insert a default profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();