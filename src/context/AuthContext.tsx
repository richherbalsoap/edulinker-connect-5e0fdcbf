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
        const supabaseToken = await getToken({ template: "supabase" });
        if (supabaseToken) return supabaseToken;

        return await getToken();
      } catch {
        return null;
      }
    });
    return () => setClerkTokenGetter(null);
  }, [getToken]);

  const ensureSchoolExists = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("upsert_school_for_clerk_user", {
        p_clerk_user_id: userId,
        p_school_name: "My School",
      });

      if (error) {
        console.error("Failed to upsert school for Clerk user:", error);
        setSchoolId(null);
        return;
      }

      setSchoolId(data ?? null);
    } catch (e) {
      console.error("Failed to ensure school exists:", e);
      setSchoolId(null);
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
