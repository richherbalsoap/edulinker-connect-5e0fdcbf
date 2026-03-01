import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSchoolId = () => {
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setSchoolId(null);
          return;
        }

        const { data } = await supabase.from("schools").select("id").eq("owner_user_id", user.id).maybeSingle();
        setSchoolId(data?.id ?? null);
      } catch {
        setSchoolId(null);
      }
    };
    fetchSchoolId();
  }, []);

  return schoolId;
};
