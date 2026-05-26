import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Info, X } from "lucide-react";
import GoldenBackground from "@/components/GoldenBackground";
import InstallBanner from "@/components/InstallBanner";
import LanguageSelector from "@/components/LanguageSelector";
import edulinkerLogo from "@/assets/edulinker-logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(
    typeof window !== "undefined" && sessionStorage.getItem("edulinker-refresh-tip-dismissed") !== "1"
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      {showTip && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
        >
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-card/90 backdrop-blur-md px-3 py-2 shadow-lg">
            <Info size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/90 flex-1 leading-snug">
              {t("auth.refresh_tip")}
            </p>
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem("edulinker-refresh-tip-dismissed", "1");
                setShowTip(false);
              }}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-3">
          <img
            src={edulinkerLogo}
            alt="EDULinker Logo"
            className="mx-auto w-20 h-20 rounded-xl object-contain"
            loading="eager"
            decoding="sync"
          />
          <CardTitle className="text-2xl text-primary">{t("app.name")}</CardTitle>
          <CardDescription className="text-muted-foreground">{t("auth.signin")}</CardDescription>
          <div className="pt-2">
            <LanguageSelector />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-primary/20"
            />

            <Input
              type="password"
              placeholder={t("auth.password")}
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
              <LogIn size={18} className="mr-2" /> {loading ? t("auth.signing_in") : t("auth.login")}
            </Button>
            <div className="flex justify-between text-sm">
              <Link to="/signup" className="text-primary/80 hover:text-primary transition-colors">
                {t("auth.create_account")}
              </Link>
              <Link to="/forgot-password" className="transition-colors text-primary font-sans">
                {t("auth.forgot_password")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
