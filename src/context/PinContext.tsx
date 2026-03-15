import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface PinContextType {
  pinSet: boolean;
  isLocked: boolean;
  loading: boolean;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lock: () => void;
}

const PinContext = createContext<PinContextType | null>(null);

// Simple hash — SHA-256 via Web Crypto API
const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'edulinker_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, schoolId } = useAuth();
  const [pinSet, setPinSet] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch school PIN status on mount
  useEffect(() => {
    if (!schoolId) return;
    const fetchPinStatus = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('schools')
        .select('pin_set')
        .eq('id', schoolId)
        .maybeSingle();
      setPinSet(data?.pin_set || false);
      setIsLocked(true); // Always locked on fresh load
      setLoading(false);
    };
    fetchPinStatus();
  }, [schoolId]);

  // Inactivity timer — reset on user activity
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setIsLocked(true);
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Listen for user activity
  useEffect(() => {
    if (!pinSet || isLocked) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer(); // Start timer

    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [pinSet, isLocked, resetInactivityTimer]);

  const setupPin = async (pin: string) => {
    if (!schoolId) throw new Error('No school found');
    const hash = await hashPin(pin);
    const { error } = await supabase
      .from('schools')
      .update({ pin_hash: hash, pin_set: true } as any)
      .eq('id', schoolId);
    if (error) throw error;
    setPinSet(true);
    setIsLocked(false);
    resetInactivityTimer();
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!schoolId) return false;
    const { data } = await supabase
      .from('schools')
      .select('pin_hash')
      .eq('id', schoolId)
      .maybeSingle();
    if (!data?.pin_hash) return false;
    const hash = await hashPin(pin);
    const correct = hash === data.pin_hash;
    if (correct) {
      setIsLocked(false);
      resetInactivityTimer();
    }
    return correct;
  };

  const lock = useCallback(() => {
    setIsLocked(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  return (
    <PinContext.Provider value={{ pinSet, isLocked, loading, setupPin, verifyPin, lock }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) throw new Error('usePin must be used within PinProvider');
  return context;
};
