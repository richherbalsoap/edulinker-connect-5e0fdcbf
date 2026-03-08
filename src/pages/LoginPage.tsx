import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Login Failed', description: 'Invalid email or password.', variant: 'destructive' });
      return;
    }
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      toast({ title: 'Email Not Verified', description: 'Please verify your email before logging in.', variant: 'destructive', duration: 8000 });
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Animated Gradient Glow Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[20%] md:top-0 md:left-1/4 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'hsla(51, 100%, 50%, 0.15)' }} />
        <div className="absolute -bottom-[10%] -right-[20%] md:bottom-0 md:right-1/4 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: 'hsla(43, 100%, 50%, 0.15)', animationDelay: '1s' }} />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 50%, hsla(51, 100%, 50%, 0.05), transparent 50%)' }} />
      </div>

      {/* Spline 3D Interactive Background */}
      <div className="fixed inset-0 w-full h-full z-[1]">
        <iframe
          src="https://my.spline.design/aidatamodelinteraction-mdTL3FktFVHgDvFr5TKtnYDV/"
          frameBorder="0"
          width="100%"
          height="100%"
          style={{ display: 'block', filter: 'sepia(1) hue-rotate(15deg) saturate(2) brightness(0.9)' }}
          title="3D Background"
        />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-20 border border-primary/20 bg-card/30 backdrop-blur-2xl shadow-[0_8px_32px_hsl(51,100%,50%,0.15),inset_0_1px_0_hsl(0,0%,100%,0.1)]">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 backdrop-blur-md border border-primary/30 flex items-center justify-center shadow-[0_0_20px_hsl(51,100%,50%,0.2)]">
            <GraduationCap size={32} className="text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary drop-shadow-[0_0_10px_hsl(51,100%,50%,0.3)]">EDULinker</CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="bg-background/20 backdrop-blur-md border-primary/20 focus:border-primary/50 transition-colors"
            />
            <Input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required
              className="bg-background/20 backdrop-blur-md border-primary/20 focus:border-primary/50 transition-colors"
            />
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_25px_hsl(51,100%,50%,0.35)] transition-shadow hover:shadow-[0_0_35px_hsl(51,100%,50%,0.5)]">
              <LogIn size={18} className="mr-2" /> {loading ? 'Signing in...' : 'Login'}
            </Button>
            <div className="flex justify-between text-sm">
              <Link to="/signup" className="text-primary/80 hover:text-primary transition-colors">Create Account</Link>
              <Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">Forgot Password?</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
