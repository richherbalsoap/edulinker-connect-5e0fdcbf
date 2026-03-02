import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  schoolId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  schoolId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const ensureSchoolExists = async (userId: string) => {
    try {
      const { data } = await supabase.from("schools").select("id").eq("owner_user_id", userId).maybeSingle();
      if (data) {
        setSchoolId(data.id);
      } else {
        const code = Array.from({ length: 8 }, () =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36)),
        ).join("");
        const { data: newSchool } = await supabase
          .from("schools")
          .insert({
            school_name: "My School",
            school_code: code,
            owner_user_id: userId,
            user_id: userId,
          })
          .select("id")
          .single();
        if (newSchool) setSchoolId(newSchool.id);
      }
    } catch (e) {
      console.error("Failed to ensure school exists:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth initialization timed out, forcing load");
        setLoading(false);
      }
    }, 5000);

    // First restore session from storage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await ensureSchoolExists(session.user.id);
        } catch (e) {
          console.error("ensureSchoolExists failed:", e);
        }
      }
      if (mounted) {
        setLoading(false);
        clearTimeout(timeout);
      }
    }).catch((err) => {
      console.error("getSession failed:", err);
      if (mounted) {
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    // Then listen for subsequent auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureSchoolExists(session.user.id).catch(console.error);
      } else {
        setSchoolId(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return <AuthContext.Provider value={{ user, session, loading, schoolId, signOut }}>{children}</AuthContext.Provider>;
};
