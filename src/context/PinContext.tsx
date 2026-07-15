import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from "@/lib/apiClient";
import { useAuth } from '@/context/AuthContext';

interface PinContextType {
  pinSet: boolean;
  loading: boolean;
  requestAccess: () => Promise<boolean>;
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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'setup' | 'verify'>('verify');
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const resolveEffectiveSchoolId = useCallback(async () => {
    if (schoolId) return schoolId;
    if (!user?.id) return null;

    const { data, error } = await apiClient.rpc('upsert_school_for_clerk_user', {
      p_clerk_user_id: user.id,
      p_school_name: 'My School',
    });

    if (error) {
      console.error('Failed to resolve school for PIN flow:', error);
      return null;
    }

    return data ?? null;
  }, [schoolId, user?.id]);

  useEffect(() => {
    if (!schoolId) {
      setPinSet(false);
      setLoading(false);
      return;
    }
    const fetchPinStatus = async () => {
      setLoading(true);
      const { data, error } = await apiClient
        .from('schools')
        .select('pin_set, pin_hash')
        .eq('id', schoolId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch PIN status:', error);
        setPinSet(false);
        setLoading(false);
        return;
      }

      setPinSet(Boolean(data?.pin_set && data?.pin_hash));
      setLoading(false);
    };
    fetchPinStatus();
  }, [schoolId]);

  // Always ask for PIN — no session caching
  const requestAccess = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalMode(pinSet ? 'verify' : 'setup');
      setModalOpen(true);
    });
  }, [pinSet]);

  const handleModalSubmit = async (pin: string): Promise<boolean> => {
    const effectiveSchoolId = await resolveEffectiveSchoolId();
    if (!effectiveSchoolId) return false;

    if (modalMode === 'setup') {
      const hash = await hashPin(pin);
      const { data, error } = await apiClient
        .from('schools')
        .update({ pin_hash: hash, pin_set: true } as any)
        .eq('id', effectiveSchoolId)
        .select('id, pin_set, pin_hash')
        .maybeSingle();

      if (error || !data?.id || !data.pin_set || data.pin_hash !== hash) {
        console.error('PIN setup failed:', error ?? new Error('PIN row update was not persisted'));
        return false;
      }

      setPinSet(true);
      setModalOpen(false);
      resolveRef.current?.(true);
      resolveRef.current = null;
      return true;
    } else {
      const { data } = await apiClient
        .from('schools')
        .select('pin_hash')
        .eq('id', effectiveSchoolId)
        .maybeSingle();

      if (!data?.pin_hash) return false;
      const hash = await hashPin(pin);
      const correct = hash === data.pin_hash;
      if (correct) {
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

  return (
    <PinContext.Provider value={{
      pinSet, loading, requestAccess,
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
