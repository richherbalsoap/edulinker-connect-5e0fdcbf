import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Delete } from 'lucide-react';
import { usePin } from '@/context/PinContext';
import { toast } from 'sonner';

const PinLockScreen = () => {
  const { verifyPin } = usePin();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      handleVerify(pin);
    }
  }, [pin]);

  const handleVerify = async (enteredPin: string) => {
    setLoading(true);
    const correct = await verifyPin(enteredPin);
    setLoading(false);
    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        toast.error('Too many wrong attempts. Contact your administrator.');
      } else {
        toast.error(`Wrong PIN. ${5 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleNumpad = (num: string) => {
    if (pin.length < 4 && !loading) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (!loading) setPin(prev => prev.slice(0, -1));
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="spotlight-bg" />
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div className="horizon-ring" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[200px] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-sm z-20"
      >
        <div className="bg-card/40 backdrop-blur-[40px] border border-primary/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="p-10 space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(51,100%,50%,0.2)]">
                <Lock size={28} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                <span className="text-primary">EDU</span>Linker
              </h1>
              <p className="text-muted-foreground text-sm">Enter your PIN to continue</p>
            </div>

            {/* PIN Dots */}
            <motion.div
              animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-4"
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-primary shadow-[0_0_10px_hsl(51,100%,50%,0.7)] scale-110'
                    : 'bg-primary/20 border border-primary/30'
                }`} />
              ))}
            </motion.div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {numpadKeys.map((key, i) => {
                if (key === '') return <div key={i} />;
                if (key === 'del') return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    disabled={loading || pin.length === 0}
                    className="h-16 rounded-2xl bg-black/40 border border-primary/10 flex items-center justify-center text-foreground/60 hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all disabled:opacity-30"
                  >
                    <Delete size={20} />
                  </button>
                );
                return (
                  <button
                    key={i}
                    onClick={() => handleNumpad(key)}
                    disabled={loading || pin.length >= 4}
                    className="h-16 rounded-2xl bg-black/40 border border-primary/10 text-foreground text-xl font-bold hover:bg-primary/10 hover:border-primary/30 hover:text-primary active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading && pin.length === 4 && key === pin[pin.length - 1] ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : key}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted-foreground/30 uppercase tracking-widest">
              Locked for security
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PinLockScreen;
