import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Smartphone, Check, Share } from "lucide-react";
import GoldenBackground from "@/components/GoldenBackground";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <GoldenBackground />
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-primary/20 relative z-10">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Smartphone size={32} className="text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary">Install EDULinker</CardTitle>
          <CardDescription className="text-muted-foreground">
            Apne phone pe app install karo — bilkul real app jaisi feel!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={32} className="text-green-400" />
              </div>
              <p className="text-foreground font-medium">App already installed hai! 🎉</p>
              <p className="text-muted-foreground text-sm">Home screen se open karo.</p>
            </div>
          ) : isIOS ? (
            <div className="space-y-3 text-center">
              <p className="text-foreground text-sm">iPhone/iPad pe install karne ke liye:</p>
              <div className="space-y-2 text-left bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                  Safari mein <Share size={14} className="text-primary inline" /> Share button dabao
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                  "Add to Home Screen" select karo
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                  "Add" pe tap karo
                </p>
              </div>
            </div>
          ) : deferredPrompt ? (
            <Button
              onClick={handleInstall}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"
              size="lg"
            >
              <Download size={18} className="mr-2" /> Install App
            </Button>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-foreground text-sm">Android pe install karne ke liye:</p>
              <div className="space-y-2 text-left bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
                  Chrome browser mein 3-dot menu dabao
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                  "Install app" ya "Add to Home screen" select karo
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
                  "Install" pe tap karo
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPage;
