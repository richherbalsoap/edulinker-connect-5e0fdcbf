import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn } from "lucide-react";
import InstallBanner from "@/components/InstallBanner";
import LanguageSelector from "@/components/LanguageSelector";
import edulinkerLogo from "@/assets/edulinker-logo.png";

/* ─── Types ────────────────────────────────────── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

/* ─── Forest Background Canvas ─────────────────── */
const ForestBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Deep jungle gradient sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#020a02");
      sky.addColorStop(0.4, "#0a1a0a");
      sky.addColorStop(0.7, "#0f2010");
      sky.addColorStop(1, "#152515");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant mountain silhouette
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.55);
      ctx.bezierCurveTo(w * 0.1, h * 0.35, w * 0.2, h * 0.45, w * 0.28, h * 0.38);
      ctx.bezierCurveTo(w * 0.36, h * 0.31, w * 0.42, h * 0.42, w * 0.5, h * 0.34);
      ctx.bezierCurveTo(w * 0.58, h * 0.26, w * 0.65, h * 0.4, w * 0.72, h * 0.36);
      ctx.bezierCurveTo(w * 0.8, h * 0.32, w * 0.88, h * 0.44, w, h * 0.5);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "#0d1f0d";
      ctx.fill();

      // Mid mountains
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, h * 0.65);
      ctx.bezierCurveTo(w * 0.08, h * 0.55, w * 0.15, h * 0.62, w * 0.22, h * 0.58);
      ctx.bezierCurveTo(w * 0.3, h * 0.54, w * 0.38, h * 0.64, w * 0.45, h * 0.57);
      ctx.bezierCurveTo(w * 0.52, h * 0.5, w * 0.6, h * 0.62, w * 0.68, h * 0.56);
      ctx.bezierCurveTo(w * 0.76, h * 0.5, w * 0.85, h * 0.6, w, h * 0.62);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = "#132213";
      ctx.fill();

      // Foreground trees (dark silhouettes)
      const drawTree = (x: number, baseY: number, height: number, spread: number) => {
        ctx.beginPath();
        // trunk
        ctx.rect(x - spread * 0.06, baseY - height * 0.3, spread * 0.12, height * 0.3);
        ctx.fillStyle = "#0a150a";
        ctx.fill();
        // layered triangles
        for (let i = 0; i < 4; i++) {
          const layerH = height * (0.5 - i * 0.05);
          const layerW = spread * (1 - i * 0.15);
          const layerY = baseY - height * (0.2 + i * 0.22);
          ctx.beginPath();
          ctx.moveTo(x, layerY - layerH);
          ctx.lineTo(x - layerW / 2, layerY);
          ctx.lineTo(x + layerW / 2, layerY);
          ctx.closePath();
          ctx.fillStyle = i === 0 ? "#0d1c0d" : "#111f11";
          ctx.fill();
        }
      };

      // Row of trees along bottom
      const treeData = [
        { x: 0.04, h: 0.52, s: 0.07 },
        { x: 0.1, h: 0.65, s: 0.09 },
        { x: 0.17, h: 0.48, s: 0.06 },
        { x: 0.24, h: 0.7, s: 0.1 },
        { x: 0.32, h: 0.55, s: 0.07 },
        { x: 0.68, h: 0.55, s: 0.07 },
        { x: 0.76, h: 0.7, s: 0.1 },
        { x: 0.83, h: 0.48, s: 0.06 },
        { x: 0.9, h: 0.65, s: 0.09 },
        { x: 0.97, h: 0.52, s: 0.07 },
      ];
      treeData.forEach(({ x, h: th, s }) => drawTree(x * w, h, th * h, s * w));

      // Subtle amber glow at horizon center
      const glow = ctx.createRadialGradient(w / 2, h * 0.6, 0, w / 2, h * 0.6, w * 0.35);
      glow.addColorStop(0, "rgba(212,133,74,0.07)");
      glow.addColorStop(1, "rgba(212,133,74,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />;
};

/* ─── Firefly Particles ─────────────────────────── */
const Fireflies = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const pts: Particle[] = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 40 + Math.random() * 50,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 8,
      duration: 5 + Math.random() * 8,
      driftX: (Math.random() - 0.5) * 20,
    }));
    setParticles(pts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={
            {
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: "#d4854a",
              boxShadow: `0 0 ${p.size * 3}px ${p.size}px rgba(212,133,74,0.6)`,
              animation: `fireflyFloat ${p.duration}s ${p.delay}s infinite ease-in-out`,
              "--drift": `${p.driftX}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes fireflyFloat {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          15%  { opacity: 1; }
          50%  { transform: translate(var(--drift), -40px) scale(1.4); opacity: 0.8; }
          85%  { opacity: 0.6; }
          100% { transform: translate(calc(var(--drift) * -1), -80px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/* ─── Stars ─────────────────────────────────────── */
const Stars = () => {
  const [stars] = useState<Star[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 45,
      size: 0.5 + Math.random() * 1.5,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    })),
  );

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "#e8f0ec",
            animation: `twinkle ${s.duration}s ${s.delay}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50%       { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

/* ─── Main Login Page ───────────────────────────── */
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
    <>
      {/* Google Fonts — Cinzel + Nunito */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Nunito:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .forest-card {
          background: rgba(10, 26, 10, 0.82);
          border: 1px solid rgba(74, 138, 122, 0.3);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(74,138,122,0.1),
            0 8px 40px rgba(0,0,0,0.6),
            0 0 80px rgba(74,138,122,0.05) inset;
        }
        .forest-input {
          background: rgba(255,255,255,0.04) !important;
          border: 1px solid rgba(74, 138, 122, 0.35) !important;
          color: #e8f0ec !important;
          font-family: 'Nunito', sans-serif;
          font-weight: 300;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .forest-input::placeholder { color: rgba(232,240,236,0.35) !important; }
        .forest-input:focus {
          border-color: rgba(212,133,74,0.6) !important;
          box-shadow: 0 0 0 2px rgba(212,133,74,0.12) !important;
          outline: none !important;
        }
        .forest-btn {
          background: linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 50%, #d4854a 200%) !important;
          background: #2a4a2a !important;
          border: 1px solid rgba(74,138,122,0.5) !important;
          color: #e8f0ec !important;
          font-family: 'Cinzel', serif !important;
          font-weight: 500 !important;
          letter-spacing: 0.08em !important;
          font-size: 0.8rem !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 0 20px rgba(74,138,122,0.15) !important;
        }
        .forest-btn:hover:not(:disabled) {
          background: rgba(74,138,122,0.25) !important;
          border-color: #4a8a7a !important;
          box-shadow: 0 0 30px rgba(74,138,122,0.3) !important;
          color: #d4854a !important;
        }
        .forest-btn:disabled {
          opacity: 0.5 !important;
        }
        .forest-link {
          color: rgba(212,133,74,0.7);
          font-family: 'Nunito', sans-serif;
          font-size: 0.8rem;
          font-weight: 300;
          transition: color 0.25s;
          text-decoration: none;
        }
        .forest-link:hover { color: #d4854a; }
        .amber-divider {
          width: 60px; height: 1px;
          background: linear-gradient(to right, transparent, #d4854a55, transparent);
          margin: 0 auto;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter { animation: cardFadeIn 0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        {/* Layered Background */}
        <ForestBackground />
        <Stars />
        <Fireflies />

        {/* Vignette overlay */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,8,2,0.7) 100%)",
          }}
        />

        <InstallBanner />

        {/* Login Card */}
        <div className="forest-card card-enter w-full max-w-sm px-8 py-10 relative" style={{ zIndex: 10 }}>
          {/* Logo + Title */}
          <div className="text-center mb-7">
            <img
              src={edulinkerLogo}
              alt="EDULinker"
              className="mx-auto mb-4 rounded-xl object-contain"
              style={{ width: 64, height: 64 }}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                color: "#d4854a",
                fontSize: "1.35rem",
                fontWeight: 500,
                letterSpacing: "0.12em",
                marginBottom: 4,
              }}
            >
              {t("app.name")}
            </h1>
            <div className="amber-divider my-3" />
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: "rgba(232,240,236,0.5)",
                fontSize: "0.75rem",
                fontWeight: 300,
                letterSpacing: "0.06em",
              }}
            >
              {t("auth.signin")}
            </p>
            <div className="mt-3">
              <LanguageSelector />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="forest-input h-11"
            />
            <Input
              type="password"
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="forest-input h-11"
            />

            <Button type="submit" disabled={loading} className="forest-btn w-full h-11 mt-2">
              <LogIn size={15} className="mr-2" />
              {loading ? t("auth.signing_in") : t("auth.login")}
            </Button>

            {/* Links */}
            <div className="flex justify-between pt-1">
              <Link to="/signup" className="forest-link">
                {t("auth.create_account")}
              </Link>
              <Link to="/forgot-password" className="forest-link">
                {t("auth.forgot_password")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
