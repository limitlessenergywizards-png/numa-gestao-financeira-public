'use client';

import { memo } from "react";
import Link from "next/link";
import { Users, Settings, LogOut, ChevronDown } from "lucide-react";
import { SETTINGS_ROUTES } from "@/lib/routes";

import { SidebarFooter } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/hooks/useMemoizedNavigation";

interface UserFooterProps {
  isLoading: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string;
  onSignOut: () => void;
}

export const UserFooter = memo(function UserFooter({
  isLoading,
  avatarUrl,
  fullName,
  email,
  onSignOut,
}: UserFooterProps) {
  return (
    <SidebarFooter className="border-t border-brand/20 p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-sidebar-accent/50 transition-[color,background-color,border-color] duration-150 group border border-transparent hover:border-brand/20">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-9 rounded-full bg-sidebar-border" />
                <div className="flex-1 text-left">
                  <Skeleton className="h-4 w-24 mb-1 bg-sidebar-border" />
                  <Skeleton className="h-3 w-32 bg-sidebar-border" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-9 w-9 ring-2 ring-brand/30">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-brand text-brand-foreground text-sm font-bold">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {fullName || "Usuário"}
                  </p>
                  <p className="text-xs text-emerald-500/70 truncate">{email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-brand/70 shrink-0 group-hover:text-brand transition-colors" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-brand/20">
          <DropdownMenuItem asChild>
            <Link href={SETTINGS_ROUTES.PROFILE} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={SETTINGS_ROUTES.SETTINGS} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
});
