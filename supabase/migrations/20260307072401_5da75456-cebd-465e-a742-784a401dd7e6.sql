
CREATE TABLE public.fees_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message text NOT NULL,
  school_id uuid REFERENCES public.schools(id),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.fees_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fees_reminders_select" ON public.fees_reminders
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (school_id IN (SELECT schools.id FROM schools WHERE schools.owner_user_id = auth.uid()));

CREATE POLICY "fees_reminders_insert" ON public.fees_reminders
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "fees_reminders_delete" ON public.fees_reminders
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (school_id IN (SELECT schools.id FROM schools WHERE schools.owner_user_id = auth.uid()));

CREATE POLICY "anon_fees_reminders_select" ON public.fees_reminders
  AS RESTRICTIVE FOR SELECT TO anon
  USING (true);
