
-- ============================================================
-- RESET & REBUILD RLS POLICIES FOR 6 TABLES
-- school-based access model
-- ============================================================

-- ==================== SCHOOLS ====================
DROP POLICY IF EXISTS "school_select" ON public.schools;
DROP POLICY IF EXISTS "school_insert" ON public.schools;
DROP POLICY IF EXISTS "school_update" ON public.schools;
DROP POLICY IF EXISTS "school_delete" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own school" ON public.schools;
DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;
DROP POLICY IF EXISTS "Anyone can read schools" ON public.schools;
DROP POLICY IF EXISTS "Owners can manage their school" ON public.schools;

CREATE POLICY "school_select" ON public.schools FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "school_insert" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "school_update" ON public.schools FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "school_delete" ON public.schools FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- ==================== STUDENTS ====================
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;
DROP POLICY IF EXISTS "Anon can select students by secret_id" ON public.students;

CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

-- Anon access for student lookup by secret_id (needed for parent portal)
CREATE POLICY "anon_students_select" ON public.students FOR SELECT TO anon
  USING (true);

-- ==================== HOMEWORK ====================
DROP POLICY IF EXISTS "homework_select" ON public.homework;
DROP POLICY IF EXISTS "homework_insert" ON public.homework;
DROP POLICY IF EXISTS "homework_update" ON public.homework;
DROP POLICY IF EXISTS "homework_delete" ON public.homework;
DROP POLICY IF EXISTS "Anon can view homework" ON public.homework;

CREATE POLICY "homework_select" ON public.homework FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "homework_insert" ON public.homework FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "homework_update" ON public.homework FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "homework_delete" ON public.homework FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

-- Anon read for parent access
CREATE POLICY "anon_homework_select" ON public.homework FOR SELECT TO anon
  USING (true);

-- ==================== RESULTS ====================
DROP POLICY IF EXISTS "results_select" ON public.results;
DROP POLICY IF EXISTS "results_insert" ON public.results;
DROP POLICY IF EXISTS "results_update" ON public.results;
DROP POLICY IF EXISTS "results_delete" ON public.results;
DROP POLICY IF EXISTS "Anon can view results" ON public.results;

CREATE POLICY "results_select" ON public.results FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "results_insert" ON public.results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "results_update" ON public.results FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "results_delete" ON public.results FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "anon_results_select" ON public.results FOR SELECT TO anon
  USING (true);

-- ==================== COMPLAINTS ====================
DROP POLICY IF EXISTS "complaints_select" ON public.complaints;
DROP POLICY IF EXISTS "complaints_insert" ON public.complaints;
DROP POLICY IF EXISTS "complaints_update" ON public.complaints;
DROP POLICY IF EXISTS "complaints_delete" ON public.complaints;
DROP POLICY IF EXISTS "Anon can view complaints" ON public.complaints;

CREATE POLICY "complaints_select" ON public.complaints FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "complaints_insert" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "complaints_update" ON public.complaints FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "complaints_delete" ON public.complaints FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "anon_complaints_select" ON public.complaints FOR SELECT TO anon
  USING (true);

-- ==================== ANNOUNCEMENTS ====================
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete" ON public.announcements;
DROP POLICY IF EXISTS "Anon can view announcements" ON public.announcements;

CREATE POLICY "announcements_select" ON public.announcements FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "announcements_insert" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_update" ON public.announcements FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "announcements_delete" ON public.announcements FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "anon_announcements_select" ON public.announcements FOR SELECT TO anon
  USING (true);
