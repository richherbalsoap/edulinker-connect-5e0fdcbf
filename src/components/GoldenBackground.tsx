import { useEffect } from "react";

const GoldenBackground = () => {
  useEffect(() => {
    // Inject CSS if not already present
    const styleId = "golden-bg-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .golden-grid-bg {
        background-image:
          linear-gradient(hsl(51 100% 50% / 0.15) 1px, transparent 1px),
          linear-gradient(90deg, hsl(51 100% 50% / 0.15) 1px, transparent 1px);
        background-size: 60px 60px;
      }

      @keyframes goldenFall {
        0%   { transform: translateY(-100%); opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }

      .golden-falling-line {
        position: absolute;
        top: 0;
        width: 1px;
        height: 80px;
        background: linear-gradient(
          to bottom,
          transparent,
          hsl(51 100% 50% / 0.6),
          transparent
        );
        animation: goldenFall linear infinite;
      }

      @keyframes horizonPulse {
        0%, 100% { opacity: 0.3; transform: translateX(-50%) scaleX(1); }
        50%       { opacity: 0.6; transform: translateX(-50%) scaleX(1.05); }
      }

      .golden-horizon-ring {
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        width: 70vw;
        height: 2px;
        background: linear-gradient(
          to right,
          transparent,
          hsl(51 100% 50% / 0.4),
          hsl(51 100% 50% / 0.7),
          hsl(51 100% 50% / 0.4),
          transparent
        );
        border-radius: 50%;
        animation: horizonPulse 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Grid background */}
      <div className="absolute inset-0 golden-grid-bg opacity-15"></div>

      {/* Falling lines */}
      <div className="absolute inset-0">
        {[10, 25, 45, 70, 85, 35, 60].map((left, i) => (
          <div
            key={i}
            className="golden-falling-line"
            style={{
              left: `${left}%`,
              animationDuration: `${4 + (i % 3) * 1.5}s`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Top shimmer line */}
      <div
        className="absolute top-0 left-0 w-full h-px"
        style={{
          background: "linear-gradient(to right, transparent, hsl(51 100% 50% / 0.1), transparent)",
        }}
      />

      {/* Horizon ring */}
      <div className="golden-horizon-ring" />

      {/* Bottom glow blob */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: "60vw",
          height: "200px",
          background: "hsl(51 100% 50% / 0.05)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
};

export default GoldenBackground;
