
-- Step 1: Add school_id to students, homework, complaints, results, announcements
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_homework_school_id ON public.homework(school_id);
CREATE INDEX IF NOT EXISTS idx_complaints_school_id ON public.complaints(school_id);
CREATE INDEX IF NOT EXISTS idx_results_school_id ON public.results(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON public.announcements(school_id);

-- Step 3: Create helper function to get current user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Step 4: Drop old RLS policies and create new school-isolated ones

-- STUDENTS
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
DROP POLICY IF EXISTS "Admins can delete students" ON public.students;

CREATE POLICY "Users can view own school students" ON public.students FOR SELECT USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can insert own school students" ON public.students FOR INSERT WITH CHECK (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update own school students" ON public.students FOR UPDATE USING (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete own school students" ON public.students FOR DELETE USING (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'::app_role));

-- HOMEWORK
DROP POLICY IF EXISTS "Authenticated users can view homework" ON public.homework;
DROP POLICY IF EXISTS "Admin or teacher can insert homework" ON public.homework;
DROP POLICY IF EXISTS "Admin or teacher can update homework" ON public.homework;
DROP POLICY IF EXISTS "Admin or teacher can delete homework" ON public.homework;

CREATE POLICY "Users can view own school homework" ON public.homework FOR SELECT USING (school_id = public.get_user_school_id());
CREATE POLICY "Admin or teacher can insert own school homework" ON public.homework FOR INSERT WITH CHECK (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admin or teacher can update own school homework" ON public.homework FOR UPDATE USING (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admin or teacher can delete own school homework" ON public.homework FOR DELETE USING (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));

-- COMPLAINTS
DROP POLICY IF EXISTS "Authenticated users can view complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin or teacher can insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin or teacher can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin or teacher can delete complaints" ON public.complaints;

CREATE POLICY "Users can view own school complaints" ON public.complaints FOR SELECT USING (school_id = public.get_user_school_id());
CREATE POLICY "Admin or teacher can insert own school complaints" ON public.complaints FOR INSERT WITH CHECK (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admin or teacher can update own school complaints" ON public.complaints FOR UPDATE USING (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admin or teacher can delete own school complaints" ON public.complaints FOR DELETE USING (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));

-- RESULTS
DROP POLICY IF EXISTS "Authenticated users can view results" ON public.results;
DROP POLICY IF EXISTS "Admin or teacher can insert results" ON public.results;
DROP POLICY IF EXISTS "Admin or teacher can update results" ON public.results;
DROP POLICY IF EXISTS "Admin or teacher can delete results" ON public.results;

CREATE POLICY "Users can view own school results" ON public.results FOR SELECT USING (school_id = public.get_user_school_id());
CREATE POLICY "Admin or teacher can insert own school results" ON public.results FOR INSERT WITH CHECK (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admin or teacher can update own school results" ON public.results FOR UPDATE USING (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));
CREATE POLICY "Admin or teacher can delete own school results" ON public.results FOR DELETE USING (school_id = public.get_user_school_id() AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)));

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Authenticated users can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Users can view own school announcements" ON public.announcements FOR SELECT USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can insert own school announcements" ON public.announcements FOR INSERT WITH CHECK (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update own school announcements" ON public.announcements FOR UPDATE USING (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete own school announcements" ON public.announcements FOR DELETE USING (school_id = public.get_user_school_id() AND public.has_role(auth.uid(), 'admin'::app_role));
