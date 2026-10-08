
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecurrenceList } from "./components/RecurrenceList";
import { NewRecurringDialog } from "./components/NewRecurringDialog";

export default function RecurrencesPage() {
    return (
        <AppLayout title="Recorrências" description="Gerencie suas receitas e despesas recorrentes">
            <div className="space-y-6">
                <PageHeader
                    title="Recorrências"
                    description="Acompanhe e gerencie itens recorrentes (assinaturas, aluguéis, salários)"
                    actions={<NewRecurringDialog />}
                />
                <RecurrenceList />
            </div>
        </AppLayout>
    );
}
