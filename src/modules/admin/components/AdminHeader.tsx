import React from 'react';
import { Crown } from 'lucide-react';
import { Logo } from "@/components/shared";
import { ADMIN_ROUTES } from "@/lib/routes";

export const AdminHeader: React.FC = () => {
  return (
    <div
      className="flex items-center gap-4 mb-6 animate-fade-in"
    >
      {/* Logo + Admin Badge */}
      <div className="flex items-center gap-4">
        <Logo size="small" showText variant="full" linkTo={ADMIN_ROUTES.ADMIN} />

        {/* Admin Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/30">
          <Crown className="h-4 w-4 text-brand" />
          <span className="text-brand font-bold text-xs uppercase tracking-wider">Admin</span>
          <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
        </div>
      </div>

      {/* Decorative line */}
      <div className="flex-1 h-px bg-gradient-to-r from-brand/30 via-brand/10 to-transparent" />
    </div>
  );
};
