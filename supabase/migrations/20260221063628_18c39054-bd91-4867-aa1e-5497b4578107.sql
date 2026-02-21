
-- Add created_by column to all data tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_created_by ON public.students(created_by);
CREATE INDEX IF NOT EXISTS idx_homework_created_by ON public.homework(created_by);
CREATE INDEX IF NOT EXISTS idx_complaints_created_by ON public.complaints(created_by);
CREATE INDEX IF NOT EXISTS idx_results_created_by ON public.results(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- Drop all existing RLS policies on students
DROP POLICY IF EXISTS "Users can view own school students" ON public.students;
DROP POLICY IF EXISTS "Admins can insert own school students" ON public.students;
DROP POLICY IF EXISTS "Admins can update own school students" ON public.students;
DROP POLICY IF EXISTS "Admins can delete own school students" ON public.students;

-- New user-based RLS for students
CREATE POLICY "Users can view own students" ON public.students FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own students" ON public.students FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own students" ON public.students FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own students" ON public.students FOR DELETE USING (created_by = auth.uid());

-- Drop all existing RLS policies on homework
DROP POLICY IF EXISTS "Users can view own school homework" ON public.homework;
DROP POLICY IF EXISTS "Admin or teacher can insert own school homework" ON public.homework;
DROP POLICY IF EXISTS "Admin or teacher can update own school homework" ON public.homework;
DROP POLICY IF EXISTS "Admin or teacher can delete own school homework" ON public.homework;

-- New user-based RLS for homework
CREATE POLICY "Users can view own homework" ON public.homework FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own homework" ON public.homework FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own homework" ON public.homework FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own homework" ON public.homework FOR DELETE USING (created_by = auth.uid());

-- Drop all existing RLS policies on complaints
DROP POLICY IF EXISTS "Users can view own school complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin or teacher can insert own school complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin or teacher can update own school complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin or teacher can delete own school complaints" ON public.complaints;

-- New user-based RLS for complaints
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own complaints" ON public.complaints FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own complaints" ON public.complaints FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own complaints" ON public.complaints FOR DELETE USING (created_by = auth.uid());

-- Drop all existing RLS policies on results
DROP POLICY IF EXISTS "Users can view own school results" ON public.results;
DROP POLICY IF EXISTS "Admin or teacher can insert own school results" ON public.results;
DROP POLICY IF EXISTS "Admin or teacher can update own school results" ON public.results;
DROP POLICY IF EXISTS "Admin or teacher can delete own school results" ON public.results;

-- New user-based RLS for results
CREATE POLICY "Users can view own results" ON public.results FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own results" ON public.results FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own results" ON public.results FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own results" ON public.results FOR DELETE USING (created_by = auth.uid());

-- Drop all existing RLS policies on announcements
DROP POLICY IF EXISTS "Users can view own school announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can insert own school announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update own school announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete own school announcements" ON public.announcements;

-- New user-based RLS for announcements
CREATE POLICY "Users can view own announcements" ON public.announcements FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Users can insert own announcements" ON public.announcements FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own announcements" ON public.announcements FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can delete own announcements" ON public.announcements FOR DELETE USING (created_by = auth.uid());
