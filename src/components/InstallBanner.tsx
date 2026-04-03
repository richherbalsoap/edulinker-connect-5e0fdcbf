import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Share, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed this session
    if (sessionStorage.getItem("edulinker_install_banner_dismissed")) return;

    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") handleClose();
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setShowGuide(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  };

  if (!visible) return null;

  return (
    <>
      {/* Bottom Banner */}
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
          <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Download size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-semibold">Install EDULinker</p>
            <p className="text-muted-foreground text-xs">App install karein quick access ke liye</p>
          </div>
          <Button
            size="sm"
            onClick={handleInstall}
            className="bg-transparent border border-primary text-primary hover:bg-primary/10 font-bold text-xs px-4 shrink-0"
          >
            Install
          </Button>
          <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-primary/20 rounded-xl w-full max-w-sm p-5 relative shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <button onClick={() => setShowGuide(false)} className="absolute right-3 top-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
            <h3 className="text-primary font-bold text-lg mb-3">Install EDULinker</h3>
            {isIOS ? (
              <div className="space-y-2">
                <p className="text-foreground text-sm font-medium">iPhone / iPad pe:</p>
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    Safari mein <Share size={12} className="text-primary inline" /> Share button dabao
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    "Add to Home Screen" select karo
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    "Add" pe tap karo — Done!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-foreground text-sm font-medium">Android / Chrome pe:</p>
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    Chrome mein <MoreVertical size={12} className="text-primary inline" /> 3-dot menu dabao
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    "Install app" ya "Add to Home Screen" select karo
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    "Install" pe tap karo — Done!
                  </p>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={() => setShowGuide(false)} className="w-full mt-4 text-sm">
              Samajh aa gaya
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallBanner;
