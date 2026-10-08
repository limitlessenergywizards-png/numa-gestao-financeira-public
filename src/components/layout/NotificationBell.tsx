'use client';

import { Bell, ArrowDownCircle, ArrowUpCircle, AlertTriangle, Clock, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useNotificationData, useNotificationCount, useNotificationActions, Notification, BudgetNotification } from "@/contexts/NotificationContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function NotificationItem({
  notification,
  onRead
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const router = useRouter();

  const getIcon = () => {
    if (notification.type === "overdue") {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (notification.type === "due_today") {
      return <Clock className="h-4 w-4 text-warning" />;
    }
    return notification.category === "receivable" 
      ? <ArrowDownCircle className="h-4 w-4 text-success" />
      : <ArrowUpCircle className="h-4 w-4 text-info" />;
  };

  const getTypeColor = () => {
    if (notification.type === "overdue") return "border-l-destructive";
    if (notification.type === "due_today") return "border-l-warning";
    return "border-l-primary";
  };

  const handleClick = () => {
    onRead();
    router.push(notification.link);
  };

  return (
    <DropdownMenuItem
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer border-l-2 transition-colors",
        getTypeColor(),
        notification.read && "opacity-60"
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          !notification.read && "font-medium"
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {notification.description}
        </p>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
      )}
    </DropdownMenuItem>
  );
}

function BudgetNotificationItem({
  notification,
  onRead
}: {
  notification: BudgetNotification;
  onRead: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    onRead();
    router.push(notification.link);
  };

  return (
    <DropdownMenuItem
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer border-l-2 transition-colors",
        notification.type === "budget_critical" ? "border-l-destructive" : "border-l-warning",
        notification.read && "opacity-60"
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5">
        <Target className={cn(
          "h-4 w-4",
          notification.type === "budget_critical" ? "text-destructive" : "text-warning"
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          !notification.read && "font-medium"
        )}>
          {notification.categoryName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {notification.message}
        </p>
      </div>
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
      )}
    </DropdownMenuItem>
  );
}

export function NotificationBell({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const { notifications, budgetNotifications } = useNotificationData();
  const { unreadCount, isLoading } = useNotificationCount();
  const { markAsRead, markAllAsRead } = useNotificationActions();
  const { t } = useLanguage();
  const isSidebar = variant === "sidebar";

  const overdueCount = notifications.filter(n => n.type === "overdue" && !n.read).length;
  const criticalBudgetCount = budgetNotifications.filter(n => n.type === "budget_critical" && !n.read).length;
  const hasOverdue = overdueCount > 0 || criticalBudgetCount > 0;

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
          <Bell className={cn(
            "h-4 w-4 transition-transform",
            unreadCount > 0 && "animate-pulse"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center transition-[color,background-color] duration-200",
              hasOverdue 
                ? "bg-destructive text-destructive-foreground" 
                : "bg-primary text-primary-foreground"
            )}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">{t("notifications.title")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">{t("notifications.title")}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <Check className="h-3 w-3 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {t("common.loading")}
            </div>
          ) : notifications.length === 0 && budgetNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("notifications.noNotifications")}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {/* Budget Alerts Section */}
              {budgetNotifications.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-2">
                    <Target className="h-3 w-3" />
                    Alertas de Orçamento
                  </DropdownMenuLabel>
                  {budgetNotifications.slice(0, 5).map((notification) => (
                    <BudgetNotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                    />
                  ))}
                  {notifications.length > 0 && <DropdownMenuSeparator />}
                </>
              )}
              
              {/* Financial Notifications */}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5 px-3 py-2">
                    <Clock className="h-3 w-3" />
                    Vencimentos
                  </DropdownMenuLabel>
                  {notifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                    />
                  ))}
                </>
              )}
              
              {(notifications.length > 10 || budgetNotifications.length > 5) && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-2 text-center text-xs text-muted-foreground">
                    +{Math.max(0, notifications.length - 10) + Math.max(0, budgetNotifications.length - 5)} mais notificações
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
