import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { usePin } from '@/context/PinContext';
import { toast } from 'sonner';

const PinSetupScreen = () => {
  const { setupPin } = usePin();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match.');
      return;
    }
    setLoading(true);
    try {
      await setupPin(pin);
      toast.success('PIN set successfully!');
    } catch {
      toast.error('Failed to set PIN. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-5 py-4 bg-background/20 border border-primary/10 rounded-2xl text-foreground text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="spotlight-bg" />
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div className="horizon-ring" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[200px] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md z-20"
      >
        <div className="bg-card/40 backdrop-blur-[40px] border border-primary/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-10 sm:p-12 space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(51,100%,50%,0.2)]">
                <ShieldCheck size={30} className="text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Set Your <span className="text-primary">PIN</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Set a 4-digit PIN to secure your admin panel. You'll need this every time you open the app.
              </p>
            </div>

            <form onSubmit={handleSetup} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                  Enter 4-Digit PIN
                </label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className={inputClass}
                    placeholder="••••"
                  />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
                  Confirm PIN
                </label>
                <input
                  type={show ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className={inputClass}
                  placeholder="••••"
                />
              </div>

              {/* PIN dots indicator */}
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`w-3 h-3 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-primary shadow-[0_0_8px_hsl(51,100%,50%,0.6)]' : 'bg-primary/20 border border-primary/30'}`} />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_hsl(51,100%,50%,0.3)] hover:shadow-[0_0_30px_hsl(51,100%,50%,0.5)]"
              >
                {loading ? 'Setting PIN...' : 'Set PIN & Continue'}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground/40 uppercase tracking-widest">
              ⚠️ Remember your PIN — it cannot be recovered
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PinSetupScreen;
