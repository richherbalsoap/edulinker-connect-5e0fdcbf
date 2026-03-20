
CREATE OR REPLACE FUNCTION public.lookup_student_by_secret_id(_secret_id text)
RETURNS TABLE(
  name text,
  standard text,
  section text,
  roll_no integer,
  parent_name text,
  parent_contact text,
  avatar_url text,
  secret_id text,
  school_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.name,
    s.standard,
    s.section,
    s.roll_no,
    s.parent_name,
    s.parent_contact,
    s.avatar_url,
    s.secret_id,
    s.school_id
  FROM public.students s
  WHERE s.secret_id = _secret_id
  LIMIT 1;
$$;
