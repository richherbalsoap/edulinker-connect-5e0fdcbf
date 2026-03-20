ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_secret_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS students_school_id_secret_id_key
ON public.students (school_id, secret_id);