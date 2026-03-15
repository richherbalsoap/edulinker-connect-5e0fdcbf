import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_DISMISSED_KEY = "edulinker_install_banner_dismissed";

const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(INSTALL_DISMISSED_KEY)) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

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
    }
  };

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
  };

  if (!visible) return null;

  return (
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
  );
};

export default InstallBanner;
