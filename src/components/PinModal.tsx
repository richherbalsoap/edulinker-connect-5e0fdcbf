import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck, Delete, X } from 'lucide-react';
import { usePin } from '@/context/PinContext';
import { toast } from 'sonner';

const PinModal = () => {
  const { modalOpen, modalMode, handleModalSubmit, closeModal } = usePin();
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const processingRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (modalOpen) {
      setPin('');
      setFirstPin('');
      setStep('enter');
      setLoading(false);
      setShake(false);
      setAttempts(0);
      processingRef.current = false;
    }
  }, [modalOpen]);

  // Handle PIN completion
  useEffect(() => {
    if (pin.length !== 4 || processingRef.current) return;
    processingRef.current = true;

    if (modalMode === 'setup') {
      if (step === 'enter') {
        setFirstPin(pin);
        setTimeout(() => {
          setStep('confirm');
          setPin('');
          processingRef.current = false;
        }, 200);
      } else {
        // Confirm step
        if (pin === firstPin) {
          handleSetup(pin);
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
          setPin('');
          setStep('enter');
          setFirstPin('');
          processingRef.current = false;
          toast.error('PINs did not match. Try again.');
        }
      }
    } else {
      handleVerify(pin);
    }
  }, [pin]);

  const handleVerify = async (enteredPin: string) => {
    setLoading(true);
    const correct = await handleModalSubmit(enteredPin);
    setLoading(false);
    if (!correct) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      processingRef.current = false;
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        toast.error('Too many wrong attempts.');
        closeModal();
      } else {
        toast.error(`Wrong PIN. ${5 - newAttempts} attempts left.`);
      }
    }
  };

  const handleSetup = async (enteredPin: string) => {
    setLoading(true);
    const ok = await handleModalSubmit(enteredPin);
    setLoading(false);
    if (ok) {
      toast.success('PIN set successfully!');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      setStep('enter');
      setFirstPin('');
      processingRef.current = false;
      toast.error('Failed to set PIN. Please try again.');
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

  const title = modalMode === 'setup'
    ? (step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN')
    : 'Enter PIN';
  const subtitle = modalMode === 'setup'
    ? (step === 'enter' ? 'Set a 4-digit PIN to secure principal tools' : 'Re-enter your PIN to confirm')
    : 'Enter your PIN to access this section';

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-xs mx-4"
          >
            <div className="bg-card/95 backdrop-blur-[40px] border border-primary/20 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors z-10"
              >
                <X size={16} />
              </button>

              <div className="p-6 space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_hsl(51,100%,50%,0.15)]">
                    {modalMode === 'setup' ? <ShieldCheck size={22} className="text-primary" /> : <Lock size={22} className="text-primary" />}
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{title}</h2>
                  <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
                </div>

                <motion.div
                  animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center gap-3"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      i < pin.length
                        ? 'bg-primary shadow-[0_0_8px_hsl(51,100%,50%,0.6)] scale-110'
                        : 'bg-primary/15 border border-primary/30'
                    }`} />
                  ))}
                </motion.div>

                <div className="grid grid-cols-3 gap-2">
                  {numpadKeys.map((key, i) => {
                    if (key === '') return <div key={i} />;
                    if (key === 'del') return (
                      <button
                        key={i}
                        onClick={handleDelete}
                        disabled={loading || pin.length === 0}
                        className="h-12 rounded-xl bg-muted/50 border border-primary/10 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all disabled:opacity-30"
                      >
                        <Delete size={18} />
                      </button>
                    );
                    return (
                      <button
                        key={i}
                        onClick={() => handleNumpad(key)}
                        disabled={loading || pin.length >= 4}
                        className="h-12 rounded-xl bg-muted/50 border border-primary/10 text-foreground text-lg font-bold hover:bg-primary/10 hover:border-primary/30 hover:text-primary active:scale-95 transition-all disabled:opacity-50"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PinModal;
