import { Loader2 } from 'lucide-react';
import { usePin } from '@/context/PinContext';
import PinSetupScreen from '@/components/PinSetupScreen';
import PinLockScreen from '@/components/PinLockScreen';

/**
 * PinGuard — Admin dashboard ke around wrap karo
 * 
 * Flow:
 * - PIN not set → PinSetupScreen (first time)
 * - PIN set + locked → PinLockScreen
 * - PIN set + unlocked → children (actual dashboard)
 */
const PinGuard = ({ children }: { children: React.ReactNode }) => {
  const { pinSet, isLocked, loading } = usePin();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary/60">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // First time — PIN setup
  if (!pinSet) return <PinSetupScreen />;

  // Locked — show lock screen
  if (isLocked) return <PinLockScreen />;

  // Unlocked — show dashboard
  return <>{children}</>;
};

export default PinGuard;
