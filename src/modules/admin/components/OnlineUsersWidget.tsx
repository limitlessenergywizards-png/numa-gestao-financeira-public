'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Circle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OnlineUser {
  user_id: string;
  last_heartbeat: string;
  device_info: {
    browser?: string;
    os?: string;
  };
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  company_name?: string;
}

export function OnlineUsersWidget() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      // Get sessions from the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select(`
          user_id,
          last_heartbeat,
          device_info,
          company_id
        `)
        .gte('last_heartbeat', fiveMinutesAgo)
        .order('last_heartbeat', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        setOnlineUsers([]);
        return;
      }

      if (!sessions || sessions.length === 0) {
        setOnlineUsers([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(sessions.map(s => s.user_id))];
      const companyIds = [...new Set(sessions.map(s => s.company_id).filter(Boolean))] as string[];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Fetch companies
      const { data: companies } = companyIds.length > 0 
        ? await supabase
            .from('companies')
            .select('id, name')
            .in('id', companyIds)
        : { data: [] };

      const profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>(
        (profiles || []).map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }] as [string, { full_name: string | null; avatar_url: string | null }])
      );
      const companiesMap = new Map<string, string>(
        (companies || []).map(c => [c.id, c.name] as [string, string])
      );

      // Build online users list (unique by user_id)
      const uniqueUsers = new Map<string, OnlineUser>();
      for (const session of sessions) {
        if (!uniqueUsers.has(session.user_id)) {
          uniqueUsers.set(session.user_id, {
            user_id: session.user_id,
            last_heartbeat: session.last_heartbeat,
            device_info: (session.device_info as OnlineUser['device_info']) || {},
            profile: profilesMap.get(session.user_id),
            company_name: session.company_id ? companiesMap.get(session.company_id) : undefined,
          });
        }
      }

      setOnlineUsers(Array.from(uniqueUsers.values()));
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchOnlineUsers, 30000);

    // Subscribe to realtime updates
    const channelName = `online-users-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel);
      }).catch(() => {
        supabase.removeChannel(channel);
      });
    };
  }, [fetchOnlineUsers]);

  if (isLoading) {
    return (
      <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Usuários Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand" />
            Usuários Online
          </CardTitle>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <Circle className="h-2 w-2 mr-1 fill-emerald-400" />
            {onlineUsers.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {onlineUsers.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum usuário online</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {onlineUsers.map((user) => (
                <div 
                  key={user.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-brand/10 text-brand text-xs">
                        {user.profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-emerald-400 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.company_name || 'Sem empresa'}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(user.last_heartbeat), {
                      addSuffix: false,
                      locale: ptBR
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
