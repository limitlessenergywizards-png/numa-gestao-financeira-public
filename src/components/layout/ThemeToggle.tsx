'use client';

import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function ThemeToggle({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useLanguage();

  const isSidebar = variant === "sidebar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-[color,background-color] duration-150",
            isSidebar && "h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          <Sun className={cn(
            "h-4 w-4 rotate-0 scale-100 transition-[transform,opacity] duration-300",
            resolvedTheme === "dark" && "-rotate-90 scale-0"
          )} />
          <Moon className={cn(
            "absolute h-4 w-4 rotate-90 scale-0 transition-[transform,opacity] duration-300",
            resolvedTheme === "dark" && "rotate-0 scale-100"
          )} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          {t("settings.lightMode")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          {t("settings.darkMode")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
