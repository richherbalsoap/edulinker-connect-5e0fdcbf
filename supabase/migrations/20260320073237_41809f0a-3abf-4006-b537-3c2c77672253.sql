DROP INDEX IF EXISTS public.idx_students_secret_id;

CREATE UNIQUE INDEX IF NOT EXISTS students_school_id_secret_id_key
ON public.students (school_id, secret_id);