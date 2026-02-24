
-- Part B: student_keys_archive table
CREATE TABLE public.student_keys_archive (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secret_id text NOT NULL UNIQUE,
  original_student_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  archived_reason text
);

ALTER TABLE public.student_keys_archive ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read archive (needed for uniqueness checks)
CREATE POLICY "Anyone can read archived keys"
ON public.student_keys_archive FOR SELECT
USING (true);

-- Only system/service role inserts via trigger, but allow authenticated inserts too
CREATE POLICY "Authenticated users can insert archived keys"
ON public.student_keys_archive FOR INSERT
WITH CHECK (true);

-- Archive keys must NEVER be deleted
-- No DELETE or UPDATE policies

-- Trigger: when a student is deleted, archive their secret_id
CREATE OR REPLACE FUNCTION public.archive_student_secret_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.student_keys_archive (secret_id, original_student_id, archived_reason)
  VALUES (OLD.secret_id, OLD.id, 'student_deleted')
  ON CONFLICT (secret_id) DO NOTHING;
  RETURN OLD;
END;
$$;

CREATE TRIGGER archive_secret_id_on_delete
BEFORE DELETE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.archive_student_secret_id();
