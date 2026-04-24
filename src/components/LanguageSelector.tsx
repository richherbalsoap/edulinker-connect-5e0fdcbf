import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
  className?: string;
}

const LanguageSelector = ({ variant = "default", className = "" }: LanguageSelectorProps) => {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.split("-")[0] || "en";

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe size={16} className="text-primary/80 shrink-0" />
      <Select value={current} onValueChange={handleChange}>
        <SelectTrigger
          className={`bg-background/60 border-primary/30 text-foreground ${
            variant === "compact" ? "h-9 text-xs" : "h-10 text-sm"
          }`}
          aria-label={t("common.select_language")}
        >
          <SelectValue placeholder={t("common.select_language")} />
        </SelectTrigger>
        <SelectContent className="max-h-72 bg-popover border-primary/30 z-[100]">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <SelectItem key={lng.code} value={lng.code}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{lng.native}</span>
                <span className="text-xs text-muted-foreground">({lng.name})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;