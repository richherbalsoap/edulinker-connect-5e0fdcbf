
-- ============================================
-- PHASE 1: EduLinker Core Backend Schema
-- ============================================

-- 1. STUDENTS TABLE
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_id text NOT NULL,
  name text NOT NULL,
  standard text NOT NULL,
  section text NOT NULL,
  parent_name text,
  parent_contact text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_students_secret_id ON public.students (secret_id);
CREATE INDEX idx_students_standard_section ON public.students (standard, section);

-- 2. SECRET ID GENERATION TRIGGER
CREATE OR REPLACE FUNCTION public.generate_secret_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id text;
  year_str text;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i int;
  random_part text;
BEGIN
  year_str := extract(year from now())::text;
  LOOP
    random_part := '';
    FOR i IN 1..5 LOOP
      random_part := random_part || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    new_id := 'EDU-' || year_str || '-' || random_part;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.students WHERE secret_id = new_id);
  END LOOP;
  NEW.secret_id := new_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_secret_id
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_secret_id();

-- 3. HOMEWORK TABLE
CREATE TABLE public.homework (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  standard text NOT NULL,
  section text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homework_standard_section ON public.homework (standard, section);
CREATE INDEX idx_homework_created_at ON public.homework (created_at);

-- 4. COMPLAINTS TABLE
CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_student_id ON public.complaints (student_id);
CREATE INDEX idx_complaints_created_at ON public.complaints (created_at);

-- 5. RESULTS TABLE
CREATE TABLE public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  marks_obtained numeric NOT NULL,
  total_marks numeric NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_results_student_id ON public.results (student_id);
CREATE INDEX idx_results_created_at ON public.results (created_at);

-- 6. PERCENTAGE CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.calculate_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.total_marks > 0 THEN
    NEW.percentage := round((NEW.marks_obtained / NEW.total_marks) * 100, 2);
  ELSE
    NEW.percentage := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_percentage
  BEFORE INSERT OR UPDATE ON public.results
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_percentage();

-- 7. ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  content text,
  type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. RLS POLICIES (permissive for anon until auth is implemented)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Students policies
CREATE POLICY "Allow all access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- Homework policies
CREATE POLICY "Allow all access to homework" ON public.homework FOR ALL USING (true) WITH CHECK (true);

-- Complaints policies
CREATE POLICY "Allow all access to complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);

-- Results policies
CREATE POLICY "Allow all access to results" ON public.results FOR ALL USING (true) WITH CHECK (true);

-- Announcements policies
CREATE POLICY "Allow all access to announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);
