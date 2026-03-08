import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, LogIn } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      return;
    }
    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      toast({
        title: "Email Not Verified",
        description: "Please verify your email before logging in.",
        variant: "destructive",
        duration: 8000,
      });
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Gradient Glow Blobs - Blue theme */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[10%] left-[10%] w-72 h-72 md:w-[500px] md:h-[500px] rounded-full blur-[120px] animate-pulse"
          style={{ background: "hsl(230 80% 50% / 0.15)" }}
        />
        <div
          className="absolute bottom-[5%] right-[5%] w-80 h-80 md:w-[600px] md:h-[600px] rounded-full blur-[120px] animate-pulse [animation-delay:1s]"
          style={{ background: "hsl(260 80% 50% / 0.12)" }}
        />
        <div
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[150px]"
          style={{ background: "hsl(230 100% 50% / 0.06)" }}
        />
      </div>

      {/* 3D Spline Background - non-interactive */}
      <div className="fixed inset-0 w-full h-full z-[1] pointer-events-none overflow-hidden">
        <iframe
          src="https://my.spline.design/aidatamodelinteraction-mdTL3FktFVHgDvFr5TKtnYDV/"
          frameBorder="0"
          width="100%"
          height="100%"
          className="block w-full h-full object-cover pointer-events-none"
          title="3D Background"
          style={{ minHeight: "100dvh" }}
        />
      </div>

      {/* Glassmorphism login card */}
      <Card className="w-full max-w-md relative z-10 border border-[hsl(230,80%,50%,0.3)] bg-card/30 backdrop-blur-2xl shadow-[0_8px_32px_hsl(230,100%,50%,0.2),inset_0_1px_0_hsl(0,0%,100%,0.1)]">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-[hsl(230,80%,50%,0.15)] backdrop-blur-md border border-[hsl(230,80%,50%,0.4)] flex items-center justify-center shadow-[0_0_20px_hsl(230,100%,50%,0.3)]">
            <GraduationCap size={32} className="text-[hsl(230,80%,60%)]" />
          </div>
          <CardTitle className="text-2xl text-[hsl(230,80%,60%)] drop-shadow-[0_0_10px_hsl(230,100%,50%,0.4)]">
            EDULinker
          </CardTitle>
          <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/20 backdrop-blur-md border-[hsl(230,80%,50%,0.25)] focus:border-[hsl(230,80%,50%,0.6)] transition-colors"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/20 backdrop-blur-md border-[hsl(230,80%,50%,0.25)] focus:border-[hsl(230,80%,50%,0.6)] transition-colors"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[hsl(230,80%,55%)] text-white hover:bg-[hsl(230,80%,60%)] font-bold shadow-[0_0_25px_hsl(230,100%,50%,0.4)] transition-shadow hover:shadow-[0_0_35px_hsl(230,100%,50%,0.6)]"
            >
              <LogIn size={18} className="mr-2" /> {loading ? "Signing in..." : "Login"}
            </Button>
            <div className="flex justify-between text-sm">
              <Link to="/signup" className="text-[hsl(230,80%,60%)] hover:text-[hsl(230,80%,70%)] transition-colors">
                Create Account
              </Link>
              <Link to="/forgot-password" className="text-muted-foreground hover:text-[hsl(230,80%,60%)] transition-colors">
                Forgot Password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
