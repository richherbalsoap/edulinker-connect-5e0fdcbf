import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSchoolId = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await (supabase as any).from('schools').select('id').limit(1).maybeSingle();
        setSchoolId((data as any)?.id ?? null);
      } catch {
        setSchoolId(null);
      }
    };
    fetch();
  }, []);

  return schoolId;
};
