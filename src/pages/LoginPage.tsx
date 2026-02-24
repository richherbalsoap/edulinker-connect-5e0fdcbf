import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email, password);
        toast.success('Account created! Check your email to confirm your account.');
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] flex items-center justify-center p-4 overflow-hidden relative selection:bg-[#ff1a75]/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="spotlight-bg"></div>
        <div className="absolute inset-0 tech-grid opacity-20"></div>
        <div className="absolute inset-0">
          {[10, 25, 45, 70, 85, 35, 60].map((left, i) => (
            <div key={i} className="falling-line" style={{ left: `${left}%`, animationDuration: `${4 + (i % 3) * 1.5}s`, animationDelay: `${i * 0.5}s` }} />
          ))}
        </div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent via-white/10"></div>
        <div className="horizon-ring"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[200px] bg-pink-600/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative w-full max-w-md z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0A0A0B]/40 backdrop-blur-[40px] border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/5"
        >
          <div className="relative p-10 sm:p-12">
            <div className="text-center mb-10">
              <motion.h1
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-4xl font-bold tracking-tight text-white mb-3"
              >
                EDULinker
              </motion.h1>
              <p className="text-gray-400 text-sm font-medium tracking-wide opacity-80">
                {isSignup ? 'Create your account' : 'Enter your credentials to access the portal'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff1a75]/20 focus:border-[#ff1a75]/40 transition-all duration-500 hover:bg-white/[0.04] focus:bg-white/[0.05]"
                  placeholder="name@institution.edu" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-5 py-4 bg-white/[0.02] border border-white/10 rounded-2xl text-white placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#ff1a75]/20 focus:border-[#ff1a75]/40 transition-all duration-500 hover:bg-white/[0.04] focus:bg-white/[0.05]"
                  placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-14 bg-[#ff1a75] text-white hover:bg-[#ff1a75]/90 font-bold rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_20px_rgba(255,26,117,0.3)] hover:shadow-[0_0_30px_rgba(255,26,117,0.5)]">
                {isSignup ? <UserPlus size={20} className="mr-2" /> : <LogIn size={20} className="mr-2" />}
                {submitting ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>

            <div className="mt-10 text-center">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">Secure access for authorized personnel only</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
