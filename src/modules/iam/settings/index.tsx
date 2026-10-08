'use client';

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompany } from "@/contexts/CompanyContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Settings as SettingsIcon, Plug, CreditCard, History, Layers } from "lucide-react";
import { CompanyTab } from "./components/CompanyTab";
import { UsersTab } from "./components/UsersTab";
import { PreferencesTab } from "./components/PreferencesTab";
import { IntegrationsTab } from "./components/IntegrationsTab";
import { PlansTab } from "./components/PlansTab";
import { AuditTab } from "./components/AuditTab";
import { FluidComponentsDemo } from "./components/FluidComponentsDemo";
import { motion, AnimatePresence } from "framer-motion";

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function Settings() {
  const { isCompanyAdmin } = useCompany();
  const [activeTab, setActiveTab] = useState("empresa");

  return (
    <AppLayout title="Configurações" description="Gerencie empresas, usuários e preferências do sistema">
      <div className="space-y-6 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-4 ${isCompanyAdmin ? 'md:grid-cols-6' : 'md:grid-cols-5'} h-auto gap-2 bg-transparent p-0`}>
            <TabsTrigger
              value="empresa"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresa</span>
            </TabsTrigger>
            {isCompanyAdmin && (
              <TabsTrigger
                value="usuarios"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="preferencias"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferências</span>
            </TabsTrigger>
            <TabsTrigger
              value="integracoes"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
            >
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
            <TabsTrigger
              value="planos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Planos</span>
            </TabsTrigger>
            <TabsTrigger
              value="auditoria"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Auditoria</span>
            </TabsTrigger>
            {process.env.NODE_ENV !== 'production' && (
              <TabsTrigger
                value="componentes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-colors"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">UI Demo</span>
              </TabsTrigger>
            )}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="empresa" className="mt-6">
                <CompanyTab />
              </TabsContent>

              {isCompanyAdmin && (
                <TabsContent value="usuarios" className="mt-6">
                  <UsersTab />
                </TabsContent>
              )}

              <TabsContent value="preferencias" className="mt-6">
                <PreferencesTab />
              </TabsContent>

              <TabsContent value="integracoes" className="mt-6">
                <IntegrationsTab />
              </TabsContent>

              <TabsContent value="planos" className="mt-6">
                <PlansTab />
              </TabsContent>

              <TabsContent value="auditoria" className="mt-6">
                <AuditTab />
              </TabsContent>

              {process.env.NODE_ENV !== 'production' && (
                <TabsContent value="componentes" className="mt-6">
                  <FluidComponentsDemo />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </AppLayout>
  );
}
