import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import GoldenBackground from "@/components/GoldenBackground";
import edulinkerLogo from "@/assets/edulinker-logo.png";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Signup Failed", description: error.message || "Could not create account.", variant: "destructive" });
      return;
    }

    // Fire-and-forget welcome email via Resend (won't block signup if it fails)
    if (data.user?.email) {
      supabase.functions
        .invoke("send-welcome-email", { body: { email: data.user.email } })
        .catch((err) => console.warn("Welcome email failed:", err));
    }

    setLoading(false);
    toast({
      title: "Account Created",
      description: "Check your inbox to verify your email, then log in.",
      duration: 8000,
    });
    navigate("/login");
  };

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center bg-background relative overflow-hidden p-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      <GoldenBackground />
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-3">
          <img
            src={edulinkerLogo}
            alt="EDULinker Logo"
            className="mx-auto w-20 h-20 rounded-xl object-contain"
            loading="eager"
            decoding="sync"
          />
          <CardTitle className="text-2xl text-primary">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">Sign up for EDULinker</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-primary/20"
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-background/50 border-primary/20"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
            >
              <UserPlus size={18} className="mr-2" /> {loading ? "Creating..." : "Create Account"}
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-primary/80 hover:text-primary transition-colors">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
