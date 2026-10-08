'use client';

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

const languages: { code: Language; name: string; flag: string }[] = [
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
];

export function LanguageSelector({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const { language, setLanguage } = useLanguage();
  const isSidebar = variant === "sidebar";
  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-colors duration-300",
            isSidebar && "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <span className="text-base">{currentLang?.flag || "🌐"}</span>
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "cursor-pointer",
              language === lang.code && "bg-accent"
            )}
          >
            <span className="mr-2 text-base">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
