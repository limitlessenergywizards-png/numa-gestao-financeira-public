import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { AdminSettings as AdminSettingsComponent } from "../components/AdminSettings";
import { FeatureFlagsManager } from "../components/FeatureFlagsManager";
import { BroadcastMessage } from "../components/BroadcastMessage";
import { useAdminData } from "@/modules/admin/hooks/useAdminData";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Bell, Flag, Send, Settings } from "lucide-react";

export default function AdminSettings() {
  const adminData = useAdminData();

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Configurações globais, feature flags e comunicação
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Shield className="h-8 w-8 text-brand mb-2" />
              <CardTitle className="text-sm">Segurança</CardTitle>
              <CardDescription className="text-xs">
                Políticas de acesso
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Flag className="h-8 w-8 text-brand mb-2" />
              <CardTitle className="text-sm">Feature Flags</CardTitle>
              <CardDescription className="text-xs">
                Controle de funcionalidades
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Send className="h-8 w-8 text-brand mb-2" />
              <CardTitle className="text-sm">Comunicação</CardTitle>
              <CardDescription className="text-xs">
                Mensagens em massa
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-brand/20 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Bell className="h-8 w-8 text-brand mb-2" />
              <CardTitle className="text-sm">Notificações</CardTitle>
              <CardDescription className="text-xs">
                Alertas do sistema
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="flags" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Feature Flags
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Comunicação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <AdminSettingsComponent />
            </TabsContent>

            <TabsContent value="flags">
              <FeatureFlagsManager />
            </TabsContent>

            <TabsContent value="broadcast">
              <BroadcastMessage
                users={adminData.users}
                companies={adminData.companies}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
