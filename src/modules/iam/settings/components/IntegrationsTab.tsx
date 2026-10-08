import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationCard } from "./IntegrationCard";
import { Plug, Building2, FileSpreadsheet, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function IntegrationsTab() {
  const handleOFXImport = () => {
    toast.info("Funcionalidade de importação OFX em desenvolvimento");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            Integrações
          </CardTitle>
          <CardDescription>
            Conecte serviços externos para automatizar seu fluxo de trabalho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <IntegrationCard
              title="BTG Pactual Banking"
              description="Sincronize transações automaticamente"
              icon={Building2}
              status="coming_soon"
            />

            <IntegrationCard
              title="Importação OFX"
              description="Importe extratos bancários"
              icon={FileSpreadsheet}
              status="available"
              onAction={handleOFXImport}
              actionLabel="Importar Arquivo"
            />

            <IntegrationCard
              title="Emissão de NFe"
              description="Emita notas fiscais eletrônicas"
              icon={FileText}
              status="coming_soon"
            />

            <IntegrationCard
              title="Gateway de Pagamento"
              description="Receba pagamentos online"
              icon={CreditCard}
              status="coming_soon"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximas Integrações</CardTitle>
          <CardDescription>
            Integrações que estamos desenvolvendo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Sincronização com Banco do Brasil
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Integração com Nubank Business
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Importação automática de NFe
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Exportação para contabilidade (SPED)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
