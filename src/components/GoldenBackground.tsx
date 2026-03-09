import { useEffect, useRef } from "react";

const GoldenBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas floating gold particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", resize);

    const COLORS = ["255,215,0", "255,193,7", "255,236,100", "218,165,32", "255,248,180", "255,223,50"];

    type Particle = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      alpha: number;
      alphaDir: number;
      color: string;
    };

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -(Math.random() * 0.38 + 0.08),
      alpha: Math.random(),
      alphaDir: Math.random() > 0.5 ? 1 : -1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += 0.003 * p.alphaDir;
        if (p.alpha >= 1) p.alphaDir = -1;
        if (p.alpha <= 0) p.alphaDir = 1;
        if (p.y < -10) {
          p.y = H + 10;
          p.x = Math.random() * W;
        }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha * 0.75})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(255,215,0,0.55)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Inject styles
  useEffect(() => {
    const id = "gp-styles-v2";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      /* GRID */
      .gp-grid {
        background-image:
          linear-gradient(hsl(51 100% 50% / 0.06) 1px, transparent 1px),
          linear-gradient(90deg, hsl(51 100% 50% / 0.06) 1px, transparent 1px);
        background-size: 64px 64px;
      }

      /* SCANLINES */
      .gp-scanlines {
        background: repeating-linear-gradient(
          0deg,
          transparent, transparent 3px,
          hsl(51 100% 50% / 0.016) 3px,
          hsl(51 100% 50% / 0.016) 4px
        );
      }

      /* AURORA */
      @keyframes gp-aurora {
        0%,100% { transform:translateX(-50%) scaleY(1)   skewX(0deg);  opacity:.13; }
        25%      { transform:translateX(-50%) scaleY(1.4) skewX(4deg);  opacity:.22; }
        50%      { transform:translateX(-50%) scaleY(.85) skewX(-3deg); opacity:.15; }
        75%      { transform:translateX(-50%) scaleY(1.2) skewX(2deg);  opacity:.20; }
      }
      .gp-aurora {
        position:absolute; top:0; left:50%;
        width:85vw; height:340px;
        background:linear-gradient(180deg,
          hsl(51 100% 55%/.20) 0%,
          hsl(45 100% 50%/.10) 45%,
          transparent 100%
        );
        filter:blur(36px);
        border-radius:0 0 50% 50%;
        animation:gp-aurora 8s ease-in-out infinite;
      }

      /* ORBS */
      @keyframes gp-pulse  { 0%,100%{opacity:.22;} 50%{opacity:.45;} }
      @keyframes gp-drift  {
        0%   { translate:  0px   0px; }
        25%  { translate:  20px -14px; }
        50%  { translate: -10px  18px; }
        75%  { translate:  14px  10px; }
        100% { translate:  0px   0px; }
      }
      .gp-orb {
        position:absolute; border-radius:50%;
        background:radial-gradient(circle, hsl(51 100% 60%/.38) 0%, transparent 68%);
        filter:blur(2px);
        animation: gp-pulse ease-in-out infinite, gp-drift ease-in-out infinite;
      }

      /* FALLING STREAKS */
      @keyframes gp-fall {
        0%   { transform:translateY(-130px); opacity:0; }
        7%   { opacity:1; }
        90%  { opacity:.7; }
        100% { transform:translateY(106vh); opacity:0; }
      }
      .gp-streak {
        position:absolute; top:0;
        width:1.5px; border-radius:999px;
        background:linear-gradient(to bottom,
          transparent 0%,
          hsl(51 100% 70%/.0) 5%,
          hsl(51 100% 70%/.95) 50%,
          hsl(51 100% 55%/.4) 85%,
          transparent 100%
        );
        animation:gp-fall linear infinite;
        filter:blur(.5px);
      }

      /* TOP SWEEP */
      @keyframes gp-sweep {
        0%   { transform:translateX(-140%); opacity:0; }
        15%  { opacity:1; }
        85%  { opacity:1; }
        100% { transform:translateX(260%); opacity:0; }
      }
      .gp-sweep {
        position:absolute; top:0; left:0;
        width:35%; height:2px;
        background:linear-gradient(to right, transparent, hsl(51 100% 70%/.7), transparent);
        animation:gp-sweep 5.5s ease-in-out infinite;
      }

      /* CORNER GLOWS */
      @keyframes gp-corner { 0%,100%{opacity:.35;} 50%{opacity:.8;} }
      .gp-corner { position:absolute; width:160px; height:160px; animation:gp-corner ease-in-out infinite; }
      .gp-c-tl { top:0;    left:0;  background:radial-gradient(circle at top left,    hsl(51 100% 55%/.28) 0%, transparent 70%); animation-duration:3.5s; }
      .gp-c-tr { top:0;    right:0; background:radial-gradient(circle at top right,   hsl(51 100% 55%/.22) 0%, transparent 70%); animation-duration:4s;   animation-delay:.8s; }
      .gp-c-bl { bottom:0; left:0;  background:radial-gradient(circle at bottom left, hsl(51 100% 55%/.22) 0%, transparent 70%); animation-duration:5s;   animation-delay:.4s; }
      .gp-c-br { bottom:0; right:0; background:radial-gradient(circle at bottom right,hsl(51 100% 55%/.28) 0%, transparent 70%); animation-duration:3.8s; animation-delay:1.2s;}

      /* HORIZON */
      @keyframes gp-horizon {
        0%,100% { opacity:.3; width:58vw; box-shadow:0 0 12px 2px hsl(51 100% 50%/.2); }
        50%      { opacity:.7; width:70vw; box-shadow:0 0 22px 4px hsl(51 100% 50%/.4); }
      }
      .gp-horizon {
        position:absolute; bottom:100px; left:50%;
        transform:translateX(-50%);
        height:1.5px;
        background:linear-gradient(to right,
          transparent 0%,
          hsl(51 100% 55%/.45) 20%,
          hsl(51 100% 68%/.9) 50%,
          hsl(51 100% 55%/.45) 80%,
          transparent 100%
        );
        border-radius:50%;
        filter:blur(.6px);
        animation:gp-horizon 4.5s ease-in-out infinite;
      }

      /* SECONDARY HORIZON */
      @keyframes gp-horizon2 {
        0%,100% { opacity:.15; width:40vw; }
        50%      { opacity:.35; width:50vw; }
      }
      .gp-horizon2 {
        position:absolute; bottom:80px; left:50%;
        transform:translateX(-50%);
        height:1px;
        background:linear-gradient(to right,
          transparent, hsl(51 100% 60%/.5), transparent
        );
        border-radius:50%;
        filter:blur(.8px);
        animation:gp-horizon2 6s ease-in-out infinite;
        animation-delay:1s;
      }

      /* VIGNETTE */
      .gp-vignette {
        background:radial-gradient(ellipse at center,
          transparent 38%, hsl(35 60% 4%/.6) 100%
        );
      }

      /* NOISE OVERLAY */
      .gp-noise {
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        background-repeat: repeat;
        background-size: 200px 200px;
        opacity: 0.022;
        mix-blend-mode: overlay;
      }
    `;
    document.head.appendChild(s);
  }, []);

  const streaks = [5, 14, 22, 32, 42, 52, 63, 73, 82, 91];

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Vignette */}
      <div className="absolute inset-0 gp-vignette" />

      {/* Grid */}
      <div className="absolute inset-0 gp-grid" />

      {/* Scanlines */}
      <div className="absolute inset-0 gp-scanlines" />

      {/* Noise grain */}
      <div className="absolute inset-0 gp-noise" />

      {/* Aurora */}
      <div className="gp-aurora" />

      {/* Orbs */}
      <div
        className="gp-orb"
        style={{ left: "15%", top: "30%", width: "500px", height: "500px", animationDuration: "6s,15s" }}
      />
      <div
        className="gp-orb"
        style={{
          left: "78%",
          top: "50%",
          width: "350px",
          height: "350px",
          animationDuration: "9s,18s",
          animationDelay: "2s,4s",
        }}
      />
      <div
        className="gp-orb"
        style={{
          left: "50%",
          top: "85%",
          width: "600px",
          height: "600px",
          animationDuration: "11s,22s",
          animationDelay: "1s,6s",
        }}
      />
      <div
        className="gp-orb"
        style={{
          left: "88%",
          top: "10%",
          width: "220px",
          height: "220px",
          animationDuration: "7s,12s",
          animationDelay: "0.5s,2s",
        }}
      />
      <div
        className="gp-orb"
        style={{
          left: "5%",
          top: "70%",
          width: "250px",
          height: "250px",
          animationDuration: "8s,14s",
          animationDelay: "3s,7s",
        }}
      />

      {/* Falling streaks */}
      <div className="absolute inset-0 overflow-hidden">
        {streaks.map((left, i) => (
          <div
            key={i}
            className="gp-streak"
            style={{
              left: `${left}%`,
              animationDuration: `${3.2 + (i % 4) * 1.3}s`,
              animationDelay: `${i * 0.55}s`,
              height: `${65 + (i % 4) * 38}px`,
            }}
          />
        ))}
      </div>

      {/* Top line + sweep */}
      <div
        className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(to right, transparent, hsl(51 100% 60%/.3), transparent)" }}
      />
      <div className="gp-sweep" />

      {/* Corner glows */}
      <div className="gp-corner gp-c-tl" />
      <div className="gp-corner gp-c-tr" />
      <div className="gp-corner gp-c-bl" />
      <div className="gp-corner gp-c-br" />

      {/* Horizon lines */}
      <div className="gp-horizon" />
      <div className="gp-horizon2" />

      {/* Bottom bloom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
        style={{ width: "75vw", height: "250px", background: "hsl(51 100% 50%/.08)", filter: "blur(75px)" }}
      />

      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ mixBlendMode: "screen" }} />
    </div>
  );
};

export default GoldenBackground;
