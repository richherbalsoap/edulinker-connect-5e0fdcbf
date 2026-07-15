import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import GoldenBackground from "@/components/GoldenBackground";
import InstallBanner from "@/components/InstallBanner";
import edulinkerLogo from "@/assets/edulinker-logo.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await apiClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden"
      style={{ padding: "env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)" }}
    >
      <style>{`
        html, body, #root { background: hsl(0 0% 6%) !important; }
        @keyframes logoPulse {
          0%,100% { box-shadow: 0 0 0 0 hsl(51 100% 50% / 0), 0 0 20px hsl(51 100% 50% / 0.2); }
          50%     { box-shadow: 0 0 0 4px hsl(51 100% 50% / 0.07), 0 0 36px hsl(51 100% 50% / 0.4); }
        }
        @keyframes ringRotate { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes ringRotateReverse { from { transform: rotate(0deg);} to { transform: rotate(-360deg);} }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .logo-wrapper { position: relative; width: 96px; height: 96px; display:flex; align-items:center; justify-content:center; }
        .logo-img { width:80px; height:80px; border-radius:50%; object-fit:contain; background: hsl(0 0% 6%); padding:8px; border:2px solid hsl(51 100% 50% / 0.55); animation: logoPulse 3s ease-in-out infinite; position:relative; z-index:2; }
        .logo-ring-inner { position:absolute; inset:0; border-radius:50%; border:1.5px dashed hsl(51 100% 50% / 0.45); animation: ringRotate 9s linear infinite; }
        .logo-ring-outer { position:absolute; inset:-8px; border-radius:50%; border:1px solid hsl(51 100% 50% / 0.15); animation: ringRotateReverse 16s linear infinite; }
        .fp-card { animation: fadeSlideUp 0.35s ease both; }
        .fp-input { width:100%; height:48px; padding:12px 14px; font-size:15px; box-sizing:border-box; color: hsl(0 0% 98%); background: hsl(0 0% 12%); border:1px solid hsl(51 100% 50% / 0.35); border-radius:8px; outline:none; }
        .fp-input::placeholder { color: hsl(0 0% 60%); }
        .fp-input:focus { border-color: hsl(51 100% 50% / 0.7); }
        .fp-btn { width:100%; height:48px; background: hsl(51 100% 50%); color: hsl(0 0% 6%); font-weight:700; font-size:15px; border:none; border-radius:8px; cursor:pointer; box-shadow: 0 0 20px hsl(51 100% 50% / 0.3); display:flex; align-items:center; justify-content:center; gap:8px; }
        .fp-btn:hover:not(:disabled) { background: hsl(51 100% 60%); }
        .fp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .fp-success-icon { width:56px; height:56px; border-radius:50%; background: hsl(51 100% 50% / 0.12); border:2px solid hsl(51 100% 50% / 0.4); display:flex; align-items:center; justify-content:center; margin: 0 auto 16px; }
      `}</style>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <GoldenBackground />
      </div>
      <InstallBanner />

      <div className="relative z-10 flex flex-col items-center w-full" style={{ maxWidth: "400px", gap: "20px" }}>
        <div className="logo-wrapper">
          <div className="logo-ring-inner" />
          <div className="logo-ring-outer" />
          <img src={edulinkerLogo} alt="EDULinker Logo" className="logo-img" loading="eager" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary tracking-tight">EDULinker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">School Management Platform</p>
        </div>

        <div className="fp-card w-full rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-xl shadow-[0_0_40px_hsl(51,100%,50%,0.13)]" style={{ padding: "28px 22px" }}>
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <h2 className="font-bold text-primary" style={{ fontSize: "1.2rem" }}>Forgot Password?</h2>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "0.875rem" }}>Enter your email and we'll send a reset link</p>
              </div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <input
                  id="fp-email"
                  type="email"
                  className="fp-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
                <button type="submit" className="fp-btn" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <p className="text-center text-sm">
                  <Link to="/login" style={{ color: "hsl(51 100% 50% / 0.85)" }}>← Back to Login</Link>
                </p>
              </form>
            </>
          ) : (
            <div className="text-center" style={{ padding: "8px 0" }}>
              <div className="fp-success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(51 100% 50%)" strokeWidth="2.5">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h2 className="font-bold text-primary" style={{ fontSize: "1.15rem", marginBottom: "8px" }}>Check your inbox!</h2>
              <p className="text-muted-foreground" style={{ fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "24px" }}>
                We sent a password reset link to <span className="text-primary font-semibold">{email}</span>.
              </p>
              <button className="fp-btn" onClick={() => { setSent(false); setEmail(""); }} style={{ marginBottom: "12px" }}>
                Try a different email
              </button>
              <p style={{ fontSize: "0.875rem" }}>
                <Link to="/login" style={{ color: "hsl(51 100% 50% / 0.85)" }}>← Back to Login</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
