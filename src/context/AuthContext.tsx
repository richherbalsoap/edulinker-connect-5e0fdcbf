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
    const stored = localStorage.getItem('schoolName');
    if (stored) return stored;
    if (email) return email.split('@')[0];
    return 'User';
  };

  const fetchSchoolId = async (userId: string) => {
    const { data } = await supabase
      .from('schools')
      .select('id')
      .eq('owner_user_id', userId)
      .single();
    if (data) {
      setSchoolId(data.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserName(deriveUserName(session.user.email));
        fetchSchoolId(session.user.id);
      } else {
        setSchoolId(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserName(deriveUserName(session.user.email));
        fetchSchoolId(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

    // Reset school for this new user to prevent stale data
    if (data.session) {
      try {
        await supabase.functions.invoke('reset-school-on-signup', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      } catch (e) {
        console.error('reset-school-on-signup failed:', e);
      }
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserName = async (newName: string) => {
    setUserName(newName);
    localStorage.setItem('schoolName', newName);

    // Update auth.users metadata
    await supabase.auth.updateUser({
      data: { display_name: newName },
    });

    // Update schools.school_name for this user
    if (user) {
      await supabase
        .from('schools')
        .update({ school_name: newName })
        .eq('user_id', user.id);
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
