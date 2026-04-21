import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, setClerkTokenGetter } from "@/integrations/supabase/client";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";

interface AuthContextType {
  user: { id: string; email?: string | null } | null;
  session: { user: { id: string; email?: string | null } } | null;
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
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { isLoaded: clerkAuthLoaded, isSignedIn, getToken, signOut: clerkSignOut } = useClerkAuth();
  const { isLoaded: clerkUserLoaded, user: clerkUser } = useClerkUser();

  const loading = !clerkAuthLoaded || !clerkUserLoaded;

  const user = isSignedIn && clerkUser
    ? { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress ?? null }
    : null;
  const session = user ? { user } : null;

  // Wire Clerk's getToken into the Supabase client so every query carries a fresh Clerk JWT.
  useEffect(() => {
    setClerkTokenGetter(async () => {
      try {
        return await getToken({ template: "supabase" });
      } catch {
        return null;
      }
    });
    return () => setClerkTokenGetter(null);
  }, [getToken]);

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
    if (loading) return;
    if (user) {
      ensureSchoolExists(user.id).catch(console.error);
    } else {
      setSchoolId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  const signOut = async () => {
    try {
      await clerkSignOut();
    } catch (e) {
      console.error("signOut failed:", e);
    }
    setSchoolId(null);
  };

  return <AuthContext.Provider value={{ user, session, loading, schoolId, signOut }}>{children}</AuthContext.Provider>;
};
