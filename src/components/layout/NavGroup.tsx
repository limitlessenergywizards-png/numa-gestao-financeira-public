'use client';

import { memo, useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrefetchLink } from "@/components/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/hooks/useMemoizedNavigation";

// Groups that start collapsed by default
const COLLAPSED_BY_DEFAULT = ["Cadastros"];

interface NavGroupProps {
  label: string;
  items: NavItem[];
}

// Memoized individual nav item
const NavItemComponent = memo(function NavItemComponent({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "transition-[transform,background-color,color] duration-150 hover:translate-x-1 hover:bg-sidebar-accent/60",
          isActive && "bg-brand/20 text-brand hover:bg-brand/25"
        )}
      >
        <PrefetchLink
          href={item.href}
          className={cn("relative", isActive && "nav-item-active")}
        >
          <Icon className={cn("h-4 w-4", isActive && "text-brand")} />
          <span className={cn(isActive && "font-medium text-brand")}>
            {item.title}
          </span>
        </PrefetchLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

NavItemComponent.displayName = 'NavItemComponent';

// Memoized nav group - only re-renders when items or active state changes
// Supports collapsible groups (Cadastros starts collapsed by default)
export const NavGroup = memo(function NavGroup({ label, items }: NavGroupProps) {
  const pathname = usePathname();
  const isCollapsible = COLLAPSED_BY_DEFAULT.includes(label);

  // Check if any item in this group is active (auto-expand if user is on one of these pages)
  const hasActiveItem = useMemo(
    () => items.some((item) => pathname === item.href),
    [items, pathname]
  );

  // Read initial state from localStorage, default to collapsed for COLLAPSED_BY_DEFAULT groups
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!isCollapsible) return false;
    if (hasActiveItem) return false; // auto-expand if user is on an item in this group
    const stored = localStorage.getItem(`nav-collapsed-${label}`);
    if (stored !== null) return stored === "true";
    return true; // collapsed by default
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(`nav-collapsed-${label}`, String(next));
      return next;
    });
  }, [label]);

  // Memoize active states to prevent recalculation
  const activeStates = useMemo(
    () => items.map((item) => pathname === item.href),
    [items, pathname]
  );

  return (
    <SidebarGroup>
      {isCollapsible ? (
        <button
          onClick={toggleCollapse}
          className="flex items-center justify-between w-full px-2 group"
        >
          <SidebarGroupLabel className="text-brand/70 uppercase text-[10px] tracking-widest font-semibold pointer-events-none">
            {label}
          </SidebarGroupLabel>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-brand/50 transition-transform duration-200",
              isCollapsed && "-rotate-90"
            )}
          />
        </button>
      ) : (
        <SidebarGroupLabel className="text-brand/70 uppercase text-[10px] tracking-widest font-semibold">
          {label}
        </SidebarGroupLabel>
      )}
      {(!isCollapsible || !isCollapsed) && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item, index) => (
              <NavItemComponent
                key={item.href}
                item={item}
                isActive={activeStates[index]}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
});

NavGroup.displayName = 'NavGroup';
