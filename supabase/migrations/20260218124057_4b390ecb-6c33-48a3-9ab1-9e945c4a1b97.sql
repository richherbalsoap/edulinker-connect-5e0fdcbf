
-- ============================================
-- PHASE 1 UPGRADE: Production-Grade Security
-- ============================================

-- 1. DROP ALL PERMISSIVE POLICIES
DROP POLICY IF EXISTS "Allow all access to students" ON public.students;
DROP POLICY IF EXISTS "Allow all access to homework" ON public.homework;
DROP POLICY IF EXISTS "Allow all access to complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow all access to results" ON public.results;
DROP POLICY IF EXISTS "Allow all access to announcements" ON public.announcements;

-- 2. AUTHENTICATED-ONLY RLS POLICIES

-- Students
CREATE POLICY "Authenticated users can view students"
  ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students"
  ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students"
  ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete students"
  ON public.students FOR DELETE TO authenticated USING (true);

-- Homework
CREATE POLICY "Authenticated users can view homework"
  ON public.homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert homework"
  ON public.homework FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update homework"
  ON public.homework FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete homework"
  ON public.homework FOR DELETE TO authenticated USING (true);

-- Complaints
CREATE POLICY "Authenticated users can view complaints"
  ON public.complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert complaints"
  ON public.complaints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update complaints"
  ON public.complaints FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete complaints"
  ON public.complaints FOR DELETE TO authenticated USING (true);

-- Results
CREATE POLICY "Authenticated users can view results"
  ON public.results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert results"
  ON public.results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update results"
  ON public.results FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete results"
  ON public.results FOR DELETE TO authenticated USING (true);

-- Announcements
CREATE POLICY "Authenticated users can view announcements"
  ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert announcements"
  ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update announcements"
  ON public.announcements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete announcements"
  ON public.announcements FOR DELETE TO authenticated USING (true);

-- 3. MISSING INDEXES
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students (created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements (created_at);

-- 4. ADD file_url COLUMN TO HOMEWORK
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS file_url text;

-- 5. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'edulinker-files',
  'edulinker-files',
  false,
  7340032,  -- 7MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- 6. STORAGE RLS POLICIES (authenticated only, 7MB max enforced by bucket config)
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'edulinker-files');

CREATE POLICY "Authenticated users can view files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'edulinker-files');

CREATE POLICY "Authenticated users can update files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'edulinker-files');

CREATE POLICY "Authenticated users can delete files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'edulinker-files');
