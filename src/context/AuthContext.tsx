import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/lib/apiClient";
import type { Session, User } from "@apiClient/apiClient-js";

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

  useEffect(() => {
    // Set up listener FIRST, then read existing session.
    const { data: { subscription } } = apiClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    apiClient.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureSchoolExists = async (userId: string) => {
    try {
      const { data, error } = await apiClient.rpc("upsert_school_for_clerk_user", {
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
      await apiClient.auth.signOut();
    } catch (e) {
      console.error("signOut failed:", e);
    }
    setSchoolId(null);
  };

  return <AuthContext.Provider value={{ user, session, loading, schoolId, signOut }}>{children}</AuthContext.Provider>;
};
