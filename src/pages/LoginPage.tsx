import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import GoldenBackground from "@/components/GoldenBackground";
import InstallBanner from "@/components/InstallBanner";
import edulinkerLogo from "@/assets/edulinker-logo.png";

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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <GoldenBackground />
      <InstallBanner />
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-3">
          <img src={edulinkerLogo} alt="EDULinker Logo" className="mx-auto w-20 h-20 rounded-xl object-contain" loading="eager" fetchPriority="high" decoding="sync" />
          <CardTitle className="text-2xl text-primary">EDULinker</CardTitle>
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
              className="bg-background/50 border-primary/20"
            />

            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-primary/20"
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
            >
              <LogIn size={18} className="mr-2" /> {loading ? "Signing in..." : "Login"}
            </Button>
            <div className="flex justify-between text-sm">
              <Link to="/signup" className="text-primary/80 hover:text-primary transition-colors">
                Create Account
              </Link>
              <Link to="/gmail-confirmation" className="transition-colors text-primary font-sans">
                ​Gmail Confirmation
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;