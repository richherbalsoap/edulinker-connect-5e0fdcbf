import { SignUp } from "@clerk/clerk-react";
import GoldenBackground from "@/components/GoldenBackground";
import edulinkerLogo from "@/assets/edulinker-logo.png";

const SignupPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      <GoldenBackground />
      <style>{`
        .cl-internal-1dauvpw, .cl-badge,
        [data-localization-key="badge__developmentMode"] { display: none !important; }
        .cl-socialButtonsBlockButton {
          color: hsl(0 0% 98%) !important;
          background: hsl(0 0% 8%) !important;
        }
        .cl-socialButtonsBlockButtonText { color: hsl(0 0% 98%) !important; font-weight: 600 !important; }
        .cl-formFieldAction {
          background: hsl(51 100% 50% / 0.12) !important;
          color: hsl(51 100% 50%) !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          border: 1px solid hsl(51 100% 50% / 0.4) !important;
          font-weight: 700 !important;
          font-size: 0.75rem !important;
        }
        .cl-dividerText { color: hsl(0 0% 64%) !important; }
      `}</style>
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <img src={edulinkerLogo} alt="EDULinker Logo" className="w-20 h-20 rounded-xl object-contain" />
        <h1 className="text-2xl font-bold text-primary">EDULinker</h1>
        <SignUp
          routing="path"
          path="/signup"
          signInUrl="/login"
          forceRedirectUrl="/dashboard"
          appearance={{
            layout: { logoPlacement: "none" },
            elements: {
              rootBox: "w-full",
              card: "bg-card/80 backdrop-blur-xl border border-primary/20 shadow-[0_0_40px_hsl(51,100%,50%,0.15)]",
              headerTitle: "text-primary",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "border border-primary/30 bg-background/60 hover:bg-primary/10 text-foreground",
              socialButtonsBlockButtonText: "text-foreground font-semibold",
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]",
              footerActionLink: "text-primary hover:text-primary/80",
              formFieldInput: "bg-background/60 border-primary/30 text-foreground placeholder:text-muted-foreground",
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
  );
};

export default SignupPage;
