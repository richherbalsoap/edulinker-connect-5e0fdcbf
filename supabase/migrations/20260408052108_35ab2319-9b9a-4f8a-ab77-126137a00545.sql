
-- Create impact_baselines table
CREATE TABLE public.impact_baselines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category text NOT NULL,
  metric_name text NOT NULL,
  baseline_value numeric NOT NULL DEFAULT 0,
  baseline_label text,
  current_value numeric NOT NULL DEFAULT 0,
  current_label text,
  unit text NOT NULL DEFAULT '%',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create impact_milestones table
CREATE TABLE public.impact_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  icon text DEFAULT '🎯',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.impact_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_milestones ENABLE ROW LEVEL SECURITY;

-- RLS for impact_baselines
CREATE POLICY "impact_baselines_select" ON public.impact_baselines
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "impact_baselines_insert" ON public.impact_baselines
  FOR INSERT TO authenticated
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "impact_baselines_update" ON public.impact_baselines
  FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "impact_baselines_delete" ON public.impact_baselines
  FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

-- RLS for impact_milestones
CREATE POLICY "impact_milestones_select" ON public.impact_milestones
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "impact_milestones_insert" ON public.impact_milestones
  FOR INSERT TO authenticated
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "impact_milestones_update" ON public.impact_milestones
  FOR UPDATE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));

CREATE POLICY "impact_milestones_delete" ON public.impact_milestones
  FOR DELETE TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE owner_user_id = auth.uid()));
