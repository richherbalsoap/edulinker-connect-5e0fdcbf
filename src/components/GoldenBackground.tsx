import { useEffect, useRef } from "react";

const GoldenBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const isMobile = W < 768;

    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };

    window.addEventListener("resize", resize);

    const COLORS = ["255,215,0", "255,193,7", "255,236,100", "218,165,32", "255,248,180"];

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

    // 🔥 reduced particles
    const particles: Particle[] = Array.from({ length: isMobile ? 25 : 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.3 + 0.05),
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

        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255,215,0,0.4)";

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

  // CSS
  useEffect(() => {
    const id = "gp-styles-v3";

    if (document.getElementById(id)) return;

    const s = document.createElement("style");

    s.id = id;

    s.textContent = `

.gp-grid{
background-image:
linear-gradient(hsl(51 100% 50% / 0.05) 1px, transparent 1px),
linear-gradient(90deg, hsl(51 100% 50% / 0.05) 1px, transparent 1px);
background-size:64px 64px;
}

.gp-scanlines{
background:repeating-linear-gradient(
0deg,
transparent,
transparent 3px,
hsl(51 100% 50% / 0.012) 3px,
hsl(51 100% 50% / 0.012) 4px
);
}

@keyframes gp-aurora{
0%,100%{transform:translateX(-50%) scaleY(1);opacity:.12}
50%{transform:translateX(-50%) scaleY(1.2);opacity:.2}
}

.gp-aurora{
position:absolute;
top:0;
left:50%;
width:85vw;
height:300px;
background:linear-gradient(
180deg,
hsl(51 100% 55%/.18) 0%,
hsl(45 100% 50%/.08) 45%,
transparent 100%
);
filter:blur(20px);
border-radius:0 0 50% 50%;
animation:gp-aurora 8s ease-in-out infinite;
}

@keyframes gp-pulse{
0%,100%{opacity:.25}
50%{opacity:.45}
}

.gp-orb{
position:absolute;
border-radius:50%;
background:radial-gradient(circle,hsl(51 100% 60%/.35) 0%,transparent 70%);
filter:blur(2px);
animation:gp-pulse 6s ease-in-out infinite;
}

@keyframes gp-fall{
0%{transform:translateY(-120px);opacity:0}
10%{opacity:1}
90%{opacity:.6}
100%{transform:translateY(106vh);opacity:0}
}

.gp-streak{
position:absolute;
top:0;
width:1.5px;
border-radius:999px;
background:linear-gradient(
to bottom,
transparent,
hsl(51 100% 70%/.9),
transparent
);
animation:gp-fall linear infinite;
}

.gp-vignette{
background:radial-gradient(
ellipse at center,
transparent 40%,
hsl(35 60% 4%/.6) 100%
);
}

`;

    document.head.appendChild(s);
  }, []);

  const streaks = [5, 14, 22, 32, 42, 52, 63, 73, 82, 91];

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 gp-vignette" />

      <div className="absolute inset-0 gp-grid" />

      <div className="absolute inset-0 gp-scanlines" />

      <div className="gp-aurora" />

      <div className="gp-orb" style={{ left: "15%", top: "30%", width: "420px", height: "420px" }} />
      <div className="gp-orb" style={{ left: "78%", top: "50%", width: "300px", height: "300px" }} />
      <div className="gp-orb" style={{ left: "50%", top: "85%", width: "480px", height: "480px" }} />

      <div className="absolute inset-0 overflow-hidden">
        {streaks.map((left, i) => (
          <div
            key={i}
            className="gp-streak"
            style={{
              left: `${left}%`,
              animationDuration: `${3 + (i % 4) * 1.2}s`,
              animationDelay: `${i * 0.5}s`,
              height: `${60 + (i % 4) * 30}px`,
            }}
          />
        ))}
      </div>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ mixBlendMode: "screen" }} />
    </div>
  );
};

export default GoldenBackground;
