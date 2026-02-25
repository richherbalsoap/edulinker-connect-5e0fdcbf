import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  session: Session | null;
  userName: string;
  schoolId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const deriveUserName = (email?: string | null) => {
    try {
      const stored = localStorage.getItem('schoolName');
      if (stored) return stored;
    } catch {}
    if (email) return email.split('@')[0];
    return 'User';
  };

  const fetchSchoolId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .eq('owner_user_id', userId)
        .maybeSingle();
      if (error) {
        console.warn('fetchSchoolId query error:', error.message);
        setSchoolId(null);
        return;
      }
      setSchoolId(data?.id ?? null);
    } catch (e) {
      console.warn('fetchSchoolId failed:', e);
      setSchoolId(null);
    }
  };

  const handleSession = (s: Session | null) => {
    setSession(s);
    const u = s?.user ?? null;
    setUser(u);
    if (u) {
      setUserName(deriveUserName(u.email));
      fetchSchoolId(u.id);
    } else {
      setUserName('User');
      setSchoolId(null);
    }
  };

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled rejection caught:', event.reason);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', handleRejection);

    // Safety timeout — if auth never resolves, stop loading after 3s
    const timeout = setTimeout(() => {
      console.warn('Auth timeout — clearing stale session and forcing load');
      // Clear any stale tokens that might be causing fetch failures
      try {
        const storageKey = `sb-sdvxekymbfyrznhuvvtj-auth-token`;
        localStorage.removeItem(storageKey);
      } catch {}
      setLoading(false);
    }, 3000);

    let resolved = false;
    const resolve = (s: Session | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      handleSession(s);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session);
    });

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        resolve(session);
      })
      .catch((err) => {
        console.warn('getSession failed, clearing stale session:', err);
        // Clear stale tokens on fetch failure
        try {
          const storageKey = `sb-sdvxekymbfyrznhuvvtj-auth-token`;
          localStorage.removeItem(storageKey);
        } catch {}
        resolve(null);
      });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;

    if (data.session) {
      try {
        await supabase.functions.invoke('reset-school-on-signup', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch (e) {
        console.warn('reset-school-on-signup failed:', e);
      }
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('signOut error:', e);
    }
  };

  const updateUserName = async (newName: string) => {
    setUserName(newName);
    try { localStorage.setItem('schoolName', newName); } catch {}

    try {
      await supabase.auth.updateUser({ data: { display_name: newName } });
    } catch (e) {
      console.warn('updateUser metadata failed:', e);
    }

    if (user) {
      try {
        await supabase
          .from('schools')
          .update({ school_name: newName })
          .eq('owner_user_id', user.id);
      } catch (e) {
        console.warn('update school_name failed:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!session, user, session, userName, schoolId, loading, login, signup, logout, updateUserName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
