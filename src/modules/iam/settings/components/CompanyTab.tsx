import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { CompanyForm } from "@/components/shared";
import { useCompany } from "@/contexts/CompanyContext";

interface CompanyTabProps {
  onSuccess?: () => void;
}

export function CompanyTab({ onSuccess }: CompanyTabProps) {
  const { currentCompany, refreshCompanies } = useCompany();

  const handleSuccess = async () => {
    await refreshCompanies();
    onSuccess?.();
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhuma empresa selecionada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Dados da Empresa
        </CardTitle>
        <CardDescription>
          Atualize as informações da empresa. O CNPJ e CEP serão validados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CompanyForm
          company={currentCompany as any}
          onSuccess={handleSuccess}
          onCancel={() => {}}
        />
      </CardContent>
    </Card>
  );
}
