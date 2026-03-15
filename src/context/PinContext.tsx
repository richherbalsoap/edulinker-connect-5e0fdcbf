import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface PinContextType {
  pinSet: boolean;
  principalUnlocked: boolean;
  loading: boolean;
  requestAccess: () => Promise<boolean>;
  lock: () => void;
  // Modal state
  modalOpen: boolean;
  modalMode: 'setup' | 'verify';
  handleModalSubmit: (pin: string) => Promise<boolean>;
  closeModal: () => void;
}

const PinContext = createContext<PinContextType | null>(null);

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
  const [principalUnlocked, setPrincipalUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'setup' | 'verify'>('verify');
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

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
      setPrincipalUnlocked(false);
      setLoading(false);
    };
    fetchPinStatus();
  }, [schoolId]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setPrincipalUnlocked(false);
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (!pinSet || !principalUnlocked) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [pinSet, principalUnlocked, resetInactivityTimer]);

  const requestAccess = useCallback((): Promise<boolean> => {
    if (principalUnlocked && pinSet) return Promise.resolve(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalMode(pinSet ? 'verify' : 'setup');
      setModalOpen(true);
    });
  }, [principalUnlocked, pinSet]);

  const handleModalSubmit = async (pin: string): Promise<boolean> => {
    if (!schoolId) return false;

    if (modalMode === 'setup') {
      const hash = await hashPin(pin);
      const { error } = await supabase
        .from('schools')
        .update({ pin_hash: hash, pin_set: true } as any)
        .eq('id', schoolId);
      if (error) return false;
      setPinSet(true);
      setPrincipalUnlocked(true);
      resetInactivityTimer();
      setModalOpen(false);
      resolveRef.current?.(true);
      resolveRef.current = null;
      return true;
    } else {
      const { data } = await supabase
        .from('schools')
        .select('pin_hash')
        .eq('id', schoolId)
        .maybeSingle();
      if (!data?.pin_hash) return false;
      const hash = await hashPin(pin);
      const correct = hash === data.pin_hash;
      if (correct) {
        setPrincipalUnlocked(true);
        resetInactivityTimer();
        setModalOpen(false);
        resolveRef.current?.(true);
        resolveRef.current = null;
      }
      return correct;
    }
  };

  const closeModal = useCallback(() => {
    setModalOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const lock = useCallback(() => {
    setPrincipalUnlocked(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  return (
    <PinContext.Provider value={{
      pinSet, principalUnlocked, loading, requestAccess, lock,
      modalOpen, modalMode, handleModalSubmit, closeModal
    }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) throw new Error('usePin must be used within PinProvider');
  return context;
};
