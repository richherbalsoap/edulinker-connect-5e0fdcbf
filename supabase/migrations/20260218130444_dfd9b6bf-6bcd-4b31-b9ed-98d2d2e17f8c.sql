
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create has_role security definer function FIRST
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Policy: users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Policy: only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Update write policies to role-based
-- Students: only admin can write
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

CREATE POLICY "Admins can insert students" ON public.students
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update students" ON public.students
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete students" ON public.students
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Homework: admin and teacher
DROP POLICY IF EXISTS "Authenticated users can insert homework" ON public.homework;
DROP POLICY IF EXISTS "Authenticated users can update homework" ON public.homework;
DROP POLICY IF EXISTS "Authenticated users can delete homework" ON public.homework;

CREATE POLICY "Admin or teacher can insert homework" ON public.homework
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin or teacher can update homework" ON public.homework
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin or teacher can delete homework" ON public.homework
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Results: admin and teacher
DROP POLICY IF EXISTS "Authenticated users can insert results" ON public.results;
DROP POLICY IF EXISTS "Authenticated users can update results" ON public.results;
DROP POLICY IF EXISTS "Authenticated users can delete results" ON public.results;

CREATE POLICY "Admin or teacher can insert results" ON public.results
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin or teacher can update results" ON public.results
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin or teacher can delete results" ON public.results
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Complaints: admin and teacher
DROP POLICY IF EXISTS "Authenticated users can insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Authenticated users can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Authenticated users can delete complaints" ON public.complaints;

CREATE POLICY "Admin or teacher can insert complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin or teacher can update complaints" ON public.complaints
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
CREATE POLICY "Admin or teacher can delete complaints" ON public.complaints
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Announcements: only admin
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;

CREATE POLICY "Admins can insert announcements" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update announcements" ON public.announcements
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete announcements" ON public.announcements
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
