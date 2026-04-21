import { SignIn } from "@clerk/clerk-react";
import GoldenBackground from "@/components/GoldenBackground";
import InstallBanner from "@/components/InstallBanner";
import edulinkerLogo from "@/assets/edulinker-logo.png";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      <GoldenBackground />
      <InstallBanner />
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <img
          src={edulinkerLogo}
          alt="EDULinker Logo"
          className="w-20 h-20 rounded-xl object-contain"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <h1 className="text-2xl font-bold text-primary">EDULinker</h1>
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-card/80 backdrop-blur-xl border border-primary/20 shadow-[0_0_40px_hsl(51,100%,50%,0.15)]",
              headerTitle: "text-primary",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-primary/20 hover:bg-primary/10",
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]",
              footerActionLink: "text-primary hover:text-primary/80",
              formFieldInput: "bg-background/50 border-primary/20",
            },
          }}
        />
      </div>
    </div>
  );
};

export default LoginPage;