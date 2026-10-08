import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { AdminBilling } from "../components/AdminBilling";
import { useAdminData } from "@/modules/admin/hooks/useAdminData";

export default function AdminPayments() {
  const adminData = useAdminData();

  return (
    <SuperAdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground">
            Gestão de billing, assinaturas e métricas de receita
          </p>
        </div>

        {/* Billing Content */}
        <div className="animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
          <AdminBilling
            subscriptions={adminData.subscriptions}
            users={adminData.users}
            billingStats={adminData.billingStats}
            isLoading={adminData.isLoading}
          />
        </div>
      </div>
    </SuperAdminLayout>
  );
}
