
-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Add school_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN school_id UUID REFERENCES public.schools(id);

-- Users can read their own school
CREATE POLICY "Users can view their own school"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.school_id = schools.id
    AND user_roles.user_id = auth.uid()
  )
);

-- Admins can manage schools
CREATE POLICY "Admins can manage schools"
ON public.schools FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique 8-letter school code
CREATE OR REPLACE FUNCTION public.generate_school_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i int;
BEGIN
  IF NEW.school_code IS NULL OR NEW.school_code = '' THEN
    LOOP
      new_code := '';
      FOR i IN 1..8 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.schools WHERE school_code = new_code);
    END LOOP;
    NEW.school_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_school_code_trigger
BEFORE INSERT ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.generate_school_code();
