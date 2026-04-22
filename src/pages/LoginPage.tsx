import { SignIn } from "@clerk/clerk-react";
import GoldenBackground from "@/components/GoldenBackground";
import InstallBanner from "@/components/InstallBanner";
import edulinkerLogo from "@/assets/edulinker-logo.png";

const LoginPage = () => {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden"
      style={{ padding: "env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)" }}
    >
      <style>{`
        @keyframes skeletonFade {
          from { opacity: 0.4; }
          to   { opacity: 1; }
        }
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes clerkReveal {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(51 100% 50% / 0), 0 0 20px hsl(51 100% 50% / 0.2); }
          50%       { box-shadow: 0 0 0 4px hsl(51 100% 50% / 0.07), 0 0 36px hsl(51 100% 50% / 0.4); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ringRotateReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        .page-container { animation: pageFadeIn 0.5s ease both; }
        .clerk-wrap     { animation: clerkReveal 0.4s ease both; }

        /* Logo wrapper */
        .logo-wrapper {
          position: relative;
          width: 88px;
          height: 88px;
          flex-shrink: 0;
        }
        .logo-img {
          width: 88px;
          height: 88px;
          border-radius: 20px;
          object-fit: contain;
          animation: logoPulse 3s ease-in-out infinite;
          position: relative;
          z-index: 1;
          display: block;
        }
        /* Rings match the logo's rounded-xl shape — NOT circular */
        .logo-ring-inner {
          position: absolute;
          inset: -7px;
          border-radius: 26px;
          border: 1.5px dashed hsl(51 100% 50% / 0.45);
          animation: ringRotate 9s linear infinite;
          pointer-events: none;
          z-index: 0;
        }
        .logo-ring-outer {
          position: absolute;
          inset: -14px;
          border-radius: 32px;
          border: 1px solid hsl(51 100% 50% / 0.15);
          animation: ringRotateReverse 16s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        /* Clerk overrides */
        .cl-internal-1dauvpw, .cl-badge, .cl-internal-b3fm6y,
        [data-localization-key="badge__developmentMode"],
        .cl-footer .cl-badge { display: none !important; }
        .cl-rootBox { width: 100% !important; }
        .cl-card {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
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
        .cl-headerTitle  { color: hsl(51 100% 50%) !important; }
        .cl-headerSubtitle { color: hsl(0 0% 64%) !important; }
      `}</style>

      {/* GoldenBackground — strictly behind, clipped to viewport */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <GoldenBackground />
      </div>

      <InstallBanner />

      {/* Content — max-width contained, never overflows */}
      <div
        className="page-container relative z-10 flex flex-col items-center w-full"
        style={{ maxWidth: "400px", gap: "20px" }}
      >
        {/* Logo with matching-shape rings */}
        <div className="logo-wrapper">
          <div className="logo-ring-inner" />
          <div className="logo-ring-outer" />
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
        <div className="text-center" style={{ marginTop: "-4px" }}>
          <h1 className="text-2xl font-bold text-primary tracking-tight leading-tight">EDULinker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">School Management Platform</p>
        </div>

        {/* Clerk card */}
        <div
          className="w-full rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-xl shadow-[0_0_40px_hsl(51,100%,50%,0.13)]"
          style={{ padding: "24px" }}
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
                    card: "bg-transparent shadow-none border-none p-0 m-0",
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
