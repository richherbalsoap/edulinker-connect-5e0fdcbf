import { useState, useEffect } from "react";
import { Download, Smartphone, Check, Share, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);

    setIsIOS(iOS);
    setIsAndroid(android);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
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

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("Install failed:", err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <GoldenBackground />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 shadow-2xl relative z-10">
        <div className="text-center space-y-4 mb-6">
          <div className="mx-auto w-14 h-14 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Smartphone size={32} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-amber-400">Install EDULinker</h1>
          <p className="text-slate-300 text-sm">Apne phone pe quick access ke liye home screen par add karo.</p>
        </div>

        <div className="space-y-4">
          {isInstalled && (
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={32} className="text-green-400" />
              </div>
              <p className="text-white font-medium">Shortcut already added hai! 🎉</p>
              <p className="text-slate-400 text-sm">Home screen se open karo aur use karo.</p>
            </div>
          )}

          {!isInstalled && isIOS && (
            <div className="space-y-4 text-center">
              <p className="text-white text-sm font-medium">iPhone/iPad pe add karne ke liye:</p>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <p className="text-sm text-slate-300 text-left">Safari browser mein yeh page open rakho</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <p className="text-sm text-slate-300 text-left flex items-center gap-1">
                    Bottom share button <Share size={14} className="text-amber-400" /> dabao
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <p className="text-sm text-slate-300 text-left">"Add to Home Screen" tap karo</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <p className="text-sm text-slate-300 text-left">"Add" pe tap karo — done! 🎯</p>
                </div>
              </div>
            </div>
          )}

          {!isInstalled && isAndroid && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
            >
              <Download size={20} /> Add to Home Screen
            </button>
          )}

          {!isInstalled && isAndroid && !deferredPrompt && (
            <div className="space-y-4 text-center">
              <p className="text-white text-sm font-medium">Android pe add karne ke liye:</p>
              <div className="space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <p className="text-sm text-slate-300 text-left">Chrome browser ke 3-dot menu (top-right) ko tap karo</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <p className="text-sm text-slate-300 text-left">"Add to Home screen" ya shortcut option select karo</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <p className="text-sm text-slate-300 text-left">Confirm karo — done! 🎯</p>
                </div>
              </div>
            </div>
          )}

          {!isInstalled && !isIOS && !isAndroid && (
            <div className="text-center space-y-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <AlertCircle size={24} className="text-blue-400 mx-auto" />
              <p className="text-white text-sm font-medium">Mobile phone pe open karo</p>
              <p className="text-slate-400 text-xs">Shortcut/add-to-home-screen option mobile browser mein better kaam karega.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPage;
