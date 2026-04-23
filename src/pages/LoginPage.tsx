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
        /* Kill any white flash from Clerk during mount/route transition */
        html, body, #root { background: hsl(0 0% 6%) !important; }
        .cl-rootBox, .cl-cardBox, .cl-card, .cl-main, .cl-form,
        .cl-pageScrollBox, .cl-modalBackdrop, .cl-modalContent,
        .cl-component, .cl-internal-1hp5nqm, .cl-internal-b3fm6y {
          background: transparent !important;
          background-color: transparent !important;
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

        /* Logo wrapper */
        .logo-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: contain;
          background: hsl(0 0% 6%);
          padding: 8px;
          border: 2px solid hsl(51 100% 50% / 0.55);
          animation: logoPulse 3s ease-in-out infinite;
          position: relative;
          z-index: 2;
          display: block;
        }
        /* Circular rings around logo */
        .logo-ring-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px dashed hsl(51 100% 50% / 0.45);
          animation: ringRotate 9s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
        .logo-ring-outer {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
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

        /* Prevent text/field overlap & smooth view transitions */
        .cl-rootBox, .cl-cardBox, .cl-card { width: 100% !important; max-width: 100% !important; }
        .cl-main { gap: 18px !important; }
        .cl-form { gap: 16px !important; }
        .cl-formField { margin-bottom: 0 !important; width: 100% !important; }
        .cl-formFieldRow { gap: 10px !important; }
        .cl-formFieldInput, .cl-input {
          height: 48px !important;
          padding: 12px 14px !important;
          font-size: 15px !important;
          line-height: 1.4 !important;
          width: 100% !important;
          box-sizing: border-box !important;
          color: hsl(0 0% 98%) !important;
          background: hsl(0 0% 12%) !important;
          border: 1px solid hsl(51 100% 50% / 0.35) !important;
        }
        .cl-formFieldInput::placeholder,
        .cl-input::placeholder {
          color: hsl(0 0% 75%) !important;
          opacity: 1 !important;
        }
        /* "Use another method" alternative buttons */
        .cl-alternativeMethodsBlockButton,
        .cl-alternativeMethods .cl-button,
        button[data-localization-key^="userVerificationAlternativeMethods"],
        .cl-alternativeMethodsBlockButton__emailCode,
        .cl-alternativeMethodsBlockButton__phoneCode,
        .cl-alternativeMethodsBlockButton__password {
          background: hsl(0 0% 12%) !important;
          color: hsl(0 0% 98%) !important;
          border: 1px solid hsl(51 100% 50% / 0.35) !important;
          font-weight: 600 !important;
        }
        .cl-alternativeMethodsBlockButton:hover,
        .cl-alternativeMethods .cl-button:hover {
          background: hsl(51 100% 50% / 0.1) !important;
          border-color: hsl(51 100% 50% / 0.6) !important;
        }
        .cl-alternativeMethodsBlockButtonText,
        .cl-alternativeMethodsBlockButtonArrow {
          color: hsl(0 0% 98%) !important;
        }
        .cl-formFieldLabelRow { margin-bottom: 8px !important; }
        .cl-header { margin-bottom: 20px !important; padding: 0 !important; }
        .cl-headerTitle { font-size: 1.25rem !important; line-height: 1.3 !important; }
        .cl-headerSubtitle { font-size: 0.875rem !important; line-height: 1.4 !important; margin-top: 6px !important; }
        .cl-footer { margin-top: 16px !important; padding: 0 !important; }
        .cl-socialButtonsBlockButton { height: 48px !important; padding: 12px !important; }
        .cl-divider { margin: 8px 0 !important; }
        .cl-formButtonPrimary { height: 48px !important; margin-top: 4px !important; }

        /* Disable Clerk's slow internal slide/scale transitions on view changes */
        .cl-rootBox *,
        .cl-rootBox *::before,
        .cl-rootBox *::after {
          transition-duration: 0.15s !important;
          animation-duration: 0.2s !important;
        }
        .cl-cardBox, .cl-card { transition: none !important; animation: none !important; }
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
          <img src={edulinkerLogo} alt="EDULinker Logo" className="logo-img" loading="eager" decoding="sync" />
        </div>

        {/* Title */}
        <div className="text-center" style={{ marginTop: "-4px" }}>
          <h1 className="text-2xl font-bold text-primary tracking-tight leading-tight">EDULinker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">School Management Platform</p>
        </div>

        {/* Clerk card */}
        <div
          className="w-full rounded-2xl border border-primary/20 bg-card/70 backdrop-blur-xl shadow-[0_0_40px_hsl(51,100%,50%,0.13)]"
          style={{ padding: "28px 22px" }}
        >
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
      </div>
    </div>
  );
};

export default LoginPage;
