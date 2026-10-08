'use client';

import { memo } from "react";
import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  userName?: string;
  avatarUrl?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  className?: string;
}

export const MobileHeader = memo(function MobileHeader({
  userName = "Usuário",
  avatarUrl,
  notificationCount = 0,
  onMenuClick,
  onNotificationClick,
  className,
}: MobileHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 glass-nav px-4 py-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gold-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center ring-2 ring-gold-500/30">
              <span className="text-lg font-bold text-numa-deep">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">
              {getGreeting()} 👋
            </p>
            <p className="font-semibold text-foreground">{userName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 rounded-xl bg-glass-elevated/50 hover:bg-glass-highlight/50 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-500 text-numa-deep text-[10px] font-bold flex items-center justify-center animate-gold-pulse">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Menu */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl bg-glass-elevated/50 hover:bg-glass-highlight/50 transition-colors"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
});
