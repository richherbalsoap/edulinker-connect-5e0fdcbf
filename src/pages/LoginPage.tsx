import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Phone, Sparkles } from "lucide-react";

type LoginTab = "magic" | "password" | "phone";

const LoginPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LoginTab>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async () => {
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        console.error("Magic link error:", error);
        toast.error(error.message);
      } else {
        toast.success("Magic link sent! Check your email.");
      }
    } catch (err: any) {
      console.error("Magic link exception:", err);
      toast.error(err?.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email || !password) return toast.error("Enter email and password");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate("/dashboard");
  };

  const handlePhoneOtp = async () => {
    if (!phone) return toast.error("Enter phone number");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) return toast.error(error.message);
    setOtpSent(true);
    toast.success("OTP sent to your phone!");
  };

  const handleVerifyOtp = async () => {
    if (!otp) return toast.error("Enter the OTP");
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate("/dashboard");
  };

  const tabs: { key: LoginTab; label: string; icon: React.ReactNode }[] = [
    { key: "magic", label: "Magic Link", icon: <Sparkles className="h-4 w-4" /> },
    { key: "password", label: "Email / Password", icon: <Lock className="h-4 w-4" /> },
    { key: "phone", label: "Phone OTP", icon: <Phone className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="golden-grid-bg absolute inset-0" />
      <div className="golden-horizon-ring" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="golden-falling-line"
          style={{
            left: `${10 + i * 16}%`,
            animationDuration: `${3 + i * 0.7}s`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">EduSpark Hub</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* Tab selector */}
          <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setOtpSent(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Magic Link */}
          {tab === "magic" && (
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleMagicLink} disabled={loading} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? "Sending..." : "Send Magic Link"}
              </Button>
            </div>
          )}

          {/* Email / Password */}
          {tab === "password" && (
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handlePasswordLogin} disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          )}

          {/* Phone OTP */}
          {tab === "phone" && (
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
              {otpSent && (
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              )}
              <Button
                onClick={otpSent ? handleVerifyOtp : handlePhoneOtp}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
