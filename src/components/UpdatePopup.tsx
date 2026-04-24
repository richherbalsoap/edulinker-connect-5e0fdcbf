import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Settings, ShieldCheck, Trash2, CheckCircle2, Info, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/LanguageSelector";
import { APP_VERSION, SHOW_UPDATE_POPUP, ACK_STORAGE_KEY } from "@/config/appVersion";
import step1 from "@/assets/update-step-1-menu.jpeg";
import step2 from "@/assets/update-step-2-permissions.jpeg";
import step3 from "@/assets/update-step-3-confirm.jpeg";

const UpdatePopup = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!SHOW_UPDATE_POPUP) return;
    try {
      const ack = localStorage.getItem(ACK_STORAGE_KEY);
      if (ack !== APP_VERSION) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const handleDone = () => {
    try {
      localStorage.setItem(ACK_STORAGE_KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  const steps = [
    {
      icon: Settings,
      title: t("update.step1_title"),
      desc: t("update.step1_desc"),
      img: step1,
      highlight: t("update.step1_highlight"),
    },
    {
      icon: ShieldCheck,
      title: t("update.step2_title"),
      desc: t("update.step2_desc"),
      img: step2,
      highlight: t("update.step2_highlight"),
    },
    {
      icon: Trash2,
      title: t("update.step3_title"),
      desc: t("update.step3_desc"),
      img: step3,
      highlight: t("update.step3_highlight"),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(2, 8, 2, 0.85)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-2xl"
        style={{
          background: "linear-gradient(160deg, #0a1a0a 0%, #0f2010 100%)",
          border: "1px solid rgba(212,133,74,0.35)",
          boxShadow: "0 0 0 1px rgba(212,133,74,0.1), 0 20px 60px rgba(0,0,0,0.7), 0 0 80px rgba(212,133,74,0.08) inset",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b"
          style={{
            background: "rgba(10,26,10,0.96)",
            borderColor: "rgba(212,133,74,0.25)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
              style={{
                background: "rgba(212,133,74,0.15)",
                border: "1px solid rgba(212,133,74,0.5)",
              }}
            >
              <RotateCw size={18} style={{ color: "#d4854a" }} />
            </div>
            <div className="min-w-0">
              <h2
                className="truncate"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "#d4854a",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {t("update.title")}
              </h2>
              <p
                className="truncate"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: "rgba(232,240,236,0.55)",
                  fontSize: "0.7rem",
                }}
              >
                {t("update.version_label")} {APP_VERSION}
              </p>
            </div>
          </div>
          <button
            onClick={handleDone}
            aria-label="close"
            className="shrink-0 p-2 rounded-lg transition-colors"
            style={{ color: "rgba(232,240,236,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#d4854a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(232,240,236,0.6)")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-7 py-5 space-y-5">
          {/* Language selector */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: "rgba(232,240,236,0.7)",
                fontSize: "0.78rem",
              }}
            >
              {t("update.choose_language")}
            </p>
            <div className="min-w-[180px]">
              <LanguageSelector variant="compact" />
            </div>
          </div>

          {/* Safety banner */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(74,138,122,0.12)",
              border: "1px solid rgba(74,138,122,0.4)",
            }}
          >
            <CheckCircle2 size={18} style={{ color: "#7ad4a8", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: "#e8f0ec",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {t("update.safety_title")}
              </p>
              <p
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  color: "rgba(232,240,236,0.65)",
                  fontSize: "0.75rem",
                  fontWeight: 300,
                  lineHeight: 1.55,
                  marginTop: 4,
                }}
              >
                {t("update.safety_desc")}
              </p>
            </div>
          </div>

          {/* Intro */}
          <div className="flex items-start gap-3">
            <Info size={16} style={{ color: "#d4854a", flexShrink: 0, marginTop: 3 }} />
            <p
              style={{
                fontFamily: "'Nunito', sans-serif",
                color: "rgba(232,240,236,0.85)",
                fontSize: "0.85rem",
                lineHeight: 1.6,
              }}
            >
              {t("update.intro")}
            </p>
          </div>

          {/* Steps */}
          <ol className="space-y-5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(74,138,122,0.25)",
                  }}
                >
                  <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(74,138,122,0.2)" }}>
                    <div
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
                      style={{
                        background: "rgba(212,133,74,0.18)",
                        border: "1px solid rgba(212,133,74,0.45)",
                        color: "#d4854a",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {i + 1}
                    </div>
                    <Icon size={16} style={{ color: "#d4854a", flexShrink: 0 }} />
                    <h3
                      style={{
                        fontFamily: "'Cinzel', serif",
                        color: "#e8f0ec",
                        fontSize: "0.92rem",
                        fontWeight: 500,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {s.title}
                    </h3>
                  </div>

                  <div className="px-4 py-4 space-y-3">
                    <p
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        color: "rgba(232,240,236,0.78)",
                        fontSize: "0.8rem",
                        lineHeight: 1.55,
                      }}
                    >
                      {s.desc}
                    </p>

                    {/* Screenshot with highlight badge */}
                    <div className="relative rounded-lg overflow-hidden" style={{ border: "1px solid rgba(212,133,74,0.3)" }}>
                      <img
                        src={s.img}
                        alt={s.title}
                        className="w-full h-auto block"
                        style={{ maxHeight: 320, objectFit: "contain", background: "#000" }}
                        loading="lazy"
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 px-3 py-2"
                        style={{
                          background: "linear-gradient(to top, rgba(212,133,74,0.95), rgba(212,133,74,0.8))",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Nunito', sans-serif",
                            color: "#1a0a02",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textAlign: "center",
                          }}
                        >
                          👉 {s.highlight}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Footer note */}
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              color: "rgba(232,240,236,0.55)",
              fontSize: "0.72rem",
              lineHeight: 1.5,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            {t("update.footer_note")}
          </p>

          {/* Done button */}
          <Button
            onClick={handleDone}
            className="w-full h-12"
            style={{
              background: "linear-gradient(135deg, #2a4a2a 0%, #1a3a1a 100%)",
              border: "1px solid rgba(212,133,74,0.5)",
              color: "#d4854a",
              fontFamily: "'Cinzel', serif",
              fontWeight: 500,
              letterSpacing: "0.1em",
              fontSize: "0.85rem",
              boxShadow: "0 0 25px rgba(212,133,74,0.2)",
            }}
          >
            <CheckCircle2 size={16} className="mr-2" />
            {t("update.done_button")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePopup;
