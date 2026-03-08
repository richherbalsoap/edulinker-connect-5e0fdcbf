
DROP POLICY IF EXISTS "fees_reminders_insert" ON public.fees_reminders;
CREATE POLICY "fees_reminders_insert" ON public.fees_reminders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
