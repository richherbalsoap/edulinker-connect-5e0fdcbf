import { SignIn } from "@clerk/clerk-react";
import { useState, useEffect, Suspense } from "react";
import GoldenBackground from "@/components/GoldenBackground";
import InstallBanner from "@/components/InstallBanner";
import edulinkerLogo from "@/assets/edulinker-logo.png";

/* ─── Skeleton shown while Clerk loads ─── */
const LoginSkeleton = () => (
  <div className="w-full max-w-sm mx-auto">
    {/* Card skeleton */}
    <div
      className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl p-8 space-y-5 shadow-[0_0_40px_hsl(51,100%,50%,0.12)]"
      style={{ animation: "skeletonFade 1.5s ease-in-out infinite alternate" }}
    >
      {/* Title */}
      <div className="space-y-2 text-center">
        <div className="h-5 w-40 mx-auto rounded-full bg-primary/20" />
        <div className="h-3 w-56 mx-auto rounded-full bg-white/8" />
      </div>
      {/* Google button */}
      <div className="h-11 rounded-lg bg-white/6 border border-white/10" />
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <div className="h-3 w-4 rounded bg-white/10" />
        <div className="flex-1 h-px bg-white/10" />
      </div>
      {/* Email field */}
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="h-11 rounded-lg bg-white/6 border border-white/10" />
      </div>
      {/* Button */}
      <div className="h-11 rounded-lg bg-primary/40" />
    </div>
  </div>
);

const LoginPage = () => {
  const [clerkReady, setClerkReady] = useState(false);

  /* Show skeleton for a brief moment, then reveal Clerk */
  useEffect(() => {
    // Small delay so skeleton is visible on fast connections too
    const t = setTimeout(() => setClerkReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      {/* ── Styles ── */}
      <style>{`
        /* Skeleton pulse */
        @keyframes skeletonFade {
          from { opacity: 0.5; }
          to   { opacity: 1; }
        }

        /* Logo glow pulse */
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(51 100% 50% / 0), 0 0 24px hsl(51 100% 50% / 0.25); }
          50%       { box-shadow: 0 0 0 6px hsl(51 100% 50% / 0.08), 0 0 40px hsl(51 100% 50% / 0.45); }
        }

        /* Subtle rotate on the glow ring — NOT on the logo itself */
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* Page fade-in */
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Clerk card fade in when ready */
        @keyframes clerkReveal {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Logo wrapper ── */
        .logo-wrapper {
          position: relative;
          width: 88px;
          height: 88px;
        }

        /* Spinning dashed ring around logo */
        .logo-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1.5px dashed hsl(51 100% 50% / 0.35);
          animation: ringRotate 8s linear infinite;
          pointer-events: none;
        }
        /* Second counter-ring, subtler */
        .logo-ring-2 {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px solid hsl(51 100% 50% / 0.12);
          animation: ringRotate 14s linear infinite reverse;
          pointer-events: none;
        }

        .logo-img {
          width: 88px;
          height: 88px;
          border-radius: 20px;
          object-fit: contain;
          animation: logoPulse 3s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }

        .page-container {
          animation: pageFadeIn 0.5s ease both;
        }

        .clerk-wrap {
          animation: clerkReveal 0.4s ease both;
        }

        /* ── Clerk overrides ── */
        .cl-internal-1dauvpw, .cl-badge, .cl-internal-b3fm6y,
        [data-localization-key="badge__developmentMode"],
        .cl-footer .cl-badge { display: none !important; }

        .cl-card {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
        .cl-rootBox { width: 100% !important; }

        .cl-socialButtonsBlockButton__google,
        .cl-socialButtonsBlockButton {
          color: hsl(0 0% 98%) !important;
          background: hsl(0 0% 9%) !important;
          border: 1px solid hsl(51 100% 50% / 0.25) !important;
          transition: background 0.2s, border-color 0.2s !important;
        }
        .cl-socialButtonsBlockButton:hover {
          background: hsl(51 100% 50% / 0.08) !important;
          border-color: hsl(51 100% 50% / 0.5) !important;
        }
        .cl-socialButtonsBlockButtonText {
          color: hsl(0 0% 98%) !important;
          font-weight: 600 !important;
        }
        .cl-formFieldAction, .cl-formFieldAction__identifier {
          background: hsl(51 100% 50% / 0.12) !important;
          color: hsl(51 100% 50%) !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          border: 1px solid hsl(51 100% 50% / 0.4) !important;
          font-weight: 700 !important;
          font-size: 0.75rem !important;
        }
        .cl-formFieldAction:hover { background: hsl(51 100% 50% / 0.2) !important; }
        .cl-dividerText { color: hsl(0 0% 64%) !important; }
        .cl-formFieldLabel { color: hsl(0 0% 98%) !important; font-weight: 600 !important; }
        .cl-headerTitle { color: hsl(51 100% 50%) !important; }
        .cl-headerSubtitle { color: hsl(0 0% 64%) !important; }
      `}</style>

      {/* Background — kept but clipped so it doesn't bleed through logo area */}
      <GoldenBackground />
      <InstallBanner />

      {/* Main card */}
      <div className="page-container relative z-10 flex flex-col items-center space-y-5 w-full max-w-sm">
        {/* Logo */}
        <div className="logo-wrapper">
          <div className="logo-ring" />
          <div className="logo-ring-2" />
          <img
            src={edulinkerLogo}
            alt="EDULinker Logo"
            className="logo-img"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
        </div>

        {/* Title */}
        <div className="text-center space-y-0.5">
          <h1 className="text-2xl font-bold text-primary tracking-tight">EDULinker</h1>
          <p className="text-xs text-muted-foreground">School Management Platform</p>
        </div>

        {/* Clerk card with outer glow border */}
        <div
          className="w-full rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-xl p-6 shadow-[0_0_40px_hsl(51,100%,50%,0.13)]"
          style={{ minHeight: "320px" }}
        >
          {!clerkReady ? (
            <LoginSkeleton />
          ) : (
            <div className="clerk-wrap">
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                forceRedirectUrl="/dashboard"
                appearance={{
                  layout: { logoPlacement: "none", showOptionalFields: true },
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none p-0",
                    headerTitle: "text-primary",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton:
                      "border border-primary/30 bg-background/60 hover:bg-primary/10 text-foreground transition-colors",
                    socialButtonsBlockButtonText: "text-foreground font-semibold",
                    formButtonPrimary:
                      "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)] transition-all",
                    footerActionLink: "text-primary hover:text-primary/80",
                    formFieldInput:
                      "bg-background/60 border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary/70 transition-colors",
                    formFieldLabel: "text-foreground font-semibold",
                    badge: "hidden",
                    footer: "hidden-dev-badge",
                  },
                  variables: {
                    colorPrimary: "hsl(51 100% 50%)",
                    colorText: "hsl(0 0% 98%)",
                    colorTextSecondary: "hsl(0 0% 64%)",
                    colorBackground: "hsl(0 0% 6%)",
                    colorInputBackground: "hsl(0 0% 8%)",
                    colorInputText: "hsl(0 0% 98%)",
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
