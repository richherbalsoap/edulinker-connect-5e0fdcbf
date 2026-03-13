import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KeyRound, Loader2 } from 'lucide-react';
import GoldenBackground from '@/components/GoldenBackground';
import edulinkerLogo from '@/assets/edulinker-logo.png';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event from the URL token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Also handle if already signed in via recovery token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'recovery') {
          setIsValidSession(true);
          setChecking(false);
        }
      }
    });

    // Check if we already have a session (page might have loaded with token already processed)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setChecking(false);
    };

    // Give onAuthStateChange a moment to fire, then fallback to checking session
    const timeout = setTimeout(checkSession, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password updated successfully. Please log in.' });
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        <GoldenBackground />
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        <GoldenBackground />
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
          <CardHeader className="text-center space-y-3">
            <img src={edulinkerLogo} alt="EDULinker Logo" className="mx-auto w-20 h-20 rounded-xl object-contain" />
            <CardTitle className="text-2xl text-primary">Invalid or Expired Link</CardTitle>
            <CardDescription className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/forgot-password')} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]">
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <GoldenBackground />
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-3">
          <img src={edulinkerLogo} alt="EDULinker Logo" className="mx-auto w-20 h-20 rounded-xl object-contain" />
          <CardTitle className="text-2xl text-primary">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input type="password" placeholder="New Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required className="bg-background/50 border-primary/20" />
            <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="bg-background/50 border-primary/20" />
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]">
              <KeyRound size={18} className="mr-2" /> {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
