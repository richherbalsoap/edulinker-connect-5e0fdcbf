import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Center bottom primary glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] bg-blue-600/20 rounded-t-[100%] blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-indigo-600/20 via-blue-900/5 to-transparent blur-2xl" />
      </div>

      {/* 3D Spline Background - only on desktop */}
      {!isMobile && (
        <div className="fixed inset-0 w-full h-[100dvh] z-[1] overflow-hidden pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            <iframe
              src="https://my.spline.design/aidatamodelinteraction-mdTL3FktFVHgDvFr5TKtnYDV/"
              frameBorder="0"
              title="3D Background"
              className="absolute w-[120vw] h-[130dvh] left-[-10vw] bottom-[-30dvh] md:bottom-[-25dvh] outline-none border-none block"
            />
          </div>
        </div>
      )}

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
