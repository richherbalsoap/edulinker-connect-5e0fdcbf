import { useState, useEffect } from "react";
import { Download, Smartphone, Check, Share, AlertCircle, Monitor } from "lucide-react";
import GoldenBackground from "@/components/GoldenBackground";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showError, setShowError] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);
    const desktop = !iOS && !android;

    setIsIOS(iOS);
    setIsAndroid(android);
    setIsDesktop(desktop);

    // Already installed check
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Service worker register
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("SW registration failed:", err);
      });
    }

    // beforeinstallprompt — Android + Desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("Install failed:", err);
      setShowError(true);
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <GoldenBackground />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="mx-auto w-14 h-14 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Smartphone size={32} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-400">Install EDULinker</h1>
          <p className="text-slate-300 text-sm">Apne device pe app install karo — bilkul real app jaisi feel!</p>
        </div>

        <div className="space-y-4">
          {/* ── Already Installed ── */}
          {isInstalled && (
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={32} className="text-green-400" />
              </div>
              <p className="text-white font-medium">App already installed hai! 🎉</p>
              <p className="text-slate-400 text-sm">Home screen se open karo aur enjoy karo!</p>
            </div>
          )}

          {/* ── Install Button (Android + Desktop Chrome) ── */}
          {!isInstalled && deferredPrompt && (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base disabled:opacity-70"
            >
              <Download size={20} />
              {installing ? "Installing..." : "Install App"}
            </button>
          )}

          {/* ── iOS Instructions ── */}
          {!isInstalled && isIOS && (
            <div className="space-y-4 text-center">
              <p className="text-white text-sm font-medium">iPhone/iPad pe install karne ke liye:</p>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                {[
                  "Safari browser mein yeh page open karo",
                  <span className="flex items-center gap-1">
                    Bottom share button <Share size={14} className="text-amber-400 inline" /> dabao
                  </span>,
                  '"Add to Home Screen" tap karo',
                  '"Add" pe tap karo — done! 🎯',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-300 text-left">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Android Manual (no prompt available) ── */}
          {!isInstalled && isAndroid && !deferredPrompt && (
            <div className="space-y-4 text-center">
              <p className="text-white text-sm font-medium">Android pe install karne ke liye:</p>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                {[
                  "Chrome browser ke 3-dot menu (top-right) ko tap karo",
                  '"Install app" ya "Add to Home screen" tap karo',
                  '"Install" confirm karo — done! 🎯',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-300 text-left">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Desktop Manual (no prompt available) ── */}
          {!isInstalled && isDesktop && !deferredPrompt && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
                <Monitor size={16} className="text-amber-400" />
                Desktop pe install karne ke liye:
              </div>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                {[
                  "Chrome browser mein yeh page open karo",
                  "Address bar ke right side mein Install icon (⊕) dhundo",
                  'Ya 3-dot menu → "Install EDULinker" click karo',
                  '"Install" confirm karo — done! 🎯',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-300 text-left">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Error State ── */}
          {showError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">
                Installation mein kuch problem aaya. Please refresh karo aur dobara try karo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
