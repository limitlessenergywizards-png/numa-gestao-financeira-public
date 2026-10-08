import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageHeader } from "./MobilePageHeader";
import { SmartHeader } from "./SmartHeader";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function AppLayout({ children, title, description, actions }: AppLayoutProps) {
  const isMobile = useIsMobile();

  // Mobile: compact page header + content with reduced padding
  if (isMobile) {
    return (
      <>
        <MobilePageHeader title={title} description={description} actions={actions} />
        <main id="main-scroll-container" className="flex-1 p-4 pb-20 overflow-y-auto overflow-x-hidden gradient-bg min-w-0">
          {children}
        </main>
      </>
    );
  }

  // Desktop: existing header with SidebarTrigger
  return (
    <>
      <ScrollProgress className="z-50" />
      <SmartHeader className="flex h-16 shrink-0 items-center justify-between gap-2 glass-header px-4 border-b border-brand/10">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 hover:bg-brand/10 hover:text-brand transition-colors rounded-lg" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-brand/20" />
          <div>
            {title && (
              <h1 className="text-lg font-semibold tracking-tight text-foreground animate-fade-in">
                {title}
              </h1>
            )}
            {description && (
              <p
                className="text-sm text-muted-foreground animate-fade-in"
                style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div
            className="flex items-center gap-2 animate-fade-in"
            style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
          >
            {actions}
          </div>
        )}
      </SmartHeader>

      <main id="main-scroll-container" className="flex-1 p-6 pb-24 overflow-y-auto overflow-x-hidden gradient-bg min-w-0 relative">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </>
  );
}
