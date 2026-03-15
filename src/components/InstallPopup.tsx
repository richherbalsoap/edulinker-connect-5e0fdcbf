import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISSED_KEY = "edulinker_install_dismissed";

const InstallPopup = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(INSTALL_DISMISSED_KEY)) return;

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return; // Already installed, don't show
    }

    setVisible(true);

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
    if (outcome === "accepted") {
      setIsInstalled(true);
      handleClose();
    }
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  };

  if (!visible || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-card border-primary/20 shadow-2xl relative animate-in slide-in-from-top-4 duration-300">
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X size={16} />
        </button>

        <CardHeader className="text-center space-y-2 pb-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Smartphone size={26} className="text-primary" />
          </div>
          <CardTitle className="text-xl text-primary">Install EDULinker</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            App install karo — real app jaisi feel milegi!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {isIOS ? (
            <div className="space-y-2 text-center">
              <p className="text-foreground text-sm">iPhone/iPad pe:</p>
              <div className="space-y-1.5 text-left bg-muted/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  Safari mein <Share size={12} className="text-primary inline" /> Share dabao
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  "Add to Home Screen" select karo
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  "Add" pe tap karo
                </p>
              </div>
              <Button variant="outline" onClick={handleClose} className="w-full mt-2 text-sm">
                Baad mein karenge
              </Button>
            </div>
          ) : deferredPrompt ? (
            <div className="space-y-2">
              <Button
                onClick={handleInstall}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              >
                <Download size={16} className="mr-2" /> Install App
              </Button>
              <Button variant="ghost" onClick={handleClose} className="w-full text-sm text-muted-foreground">
                Baad mein karenge
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <p className="text-foreground text-sm">Android pe:</p>
              <div className="space-y-1.5 text-left bg-muted/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  Chrome mein 3-dot menu dabao
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  "Install app" select karo
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  "Install" pe tap karo
                </p>
              </div>
              <Button variant="ghost" onClick={handleClose} className="w-full text-sm text-muted-foreground">
                Baad mein karenge
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPopup;
