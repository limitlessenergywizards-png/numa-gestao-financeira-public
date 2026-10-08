 // Category templates by business segment
 // Used during onboarding to pre-populate categories based on industry
 
 export interface CategoryTemplate {
   name: string;
   icon: string;
   color: string;
   type: "receita" | "despesa";
 }
 
 export interface SegmentTemplate {
   id: string;
   title: string;
   description: string;
   icon: string;
   categories: CategoryTemplate[];
 }
 
 // Infoprodutor / Criador de Conteúdo
 const infoProducerCategories: CategoryTemplate[] = [
   // Receitas
   { name: "Vendas de Cursos", icon: "graduation-cap", color: "#10B981", type: "receita" },
   { name: "Mentorias", icon: "users", color: "#3B82F6", type: "receita" },
   { name: "Assinaturas", icon: "repeat", color: "#8B5CF6", type: "receita" },
   { name: "Comissões de Afiliados", icon: "link", color: "#F59E0B", type: "receita" },
   { name: "Outras Receitas", icon: "plus-circle", color: "#6B7280", type: "receita" },
   // Despesas
   { name: "Tráfego Pago", icon: "megaphone", color: "#EF4444", type: "despesa" },
   { name: "Ferramentas/SaaS", icon: "settings", color: "#F59E0B", type: "despesa" },
   { name: "Equipe/Freelancers", icon: "users", color: "#3B82F6", type: "despesa" },
   { name: "Impostos", icon: "receipt", color: "#8B5CF6", type: "despesa" },
   { name: "Produção de Conteúdo", icon: "video", color: "#EC4899", type: "despesa" },
   { name: "Outras Despesas", icon: "minus-circle", color: "#6B7280", type: "despesa" },
 ];
 
 // Profissional Liberal (Médico, Advogado, Consultor, Dentista)
 const professionalCategories: CategoryTemplate[] = [
   // Receitas
   { name: "Consultas", icon: "stethoscope", color: "#10B981", type: "receita" },
   { name: "Procedimentos", icon: "activity", color: "#3B82F6", type: "receita" },
   { name: "Honorários", icon: "briefcase", color: "#8B5CF6", type: "receita" },
   { name: "Outras Receitas", icon: "plus-circle", color: "#6B7280", type: "receita" },
   // Despesas
   { name: "Aluguel", icon: "home", color: "#EF4444", type: "despesa" },
   { name: "Equipe/Secretária", icon: "users", color: "#F59E0B", type: "despesa" },
   { name: "Material/Insumos", icon: "package", color: "#3B82F6", type: "despesa" },
   { name: "Marketing", icon: "megaphone", color: "#EC4899", type: "despesa" },
   { name: "Impostos", icon: "receipt", color: "#8B5CF6", type: "despesa" },
   { name: "Outras Despesas", icon: "minus-circle", color: "#6B7280", type: "despesa" },
 ];
 
 // Micro/Pequena Empresa
 const smallBusinessCategories: CategoryTemplate[] = [
   // Receitas
   { name: "Venda de Produtos", icon: "shopping-bag", color: "#10B981", type: "receita" },
   { name: "Prestação de Serviços", icon: "wrench", color: "#3B82F6", type: "receita" },
   { name: "Outras Receitas", icon: "plus-circle", color: "#6B7280", type: "receita" },
   // Despesas
   { name: "Custo Mercadorias (CMV)", icon: "package", color: "#EF4444", type: "despesa" },
   { name: "Aluguel", icon: "home", color: "#F59E0B", type: "despesa" },
   { name: "Folha de Pagamento", icon: "users", color: "#3B82F6", type: "despesa" },
   { name: "Impostos", icon: "receipt", color: "#8B5CF6", type: "despesa" },
   { name: "Marketing", icon: "megaphone", color: "#EC4899", type: "despesa" },
   { name: "Fornecedores", icon: "truck", color: "#10B981", type: "despesa" },
   { name: "Outras Despesas", icon: "minus-circle", color: "#6B7280", type: "despesa" },
 ];
 
 // Outro / Genérico
 const genericCategories: CategoryTemplate[] = [
   // Receitas
   { name: "Vendas", icon: "shopping-bag", color: "#10B981", type: "receita" },
   { name: "Serviços", icon: "wrench", color: "#3B82F6", type: "receita" },
   { name: "Outras Receitas", icon: "plus-circle", color: "#6B7280", type: "receita" },
   // Despesas
   { name: "Custos Operacionais", icon: "settings", color: "#EF4444", type: "despesa" },
   { name: "Despesas Administrativas", icon: "building-2", color: "#F59E0B", type: "despesa" },
   { name: "Impostos", icon: "receipt", color: "#8B5CF6", type: "despesa" },
   { name: "Outras Despesas", icon: "minus-circle", color: "#6B7280", type: "despesa" },
 ];
 
 export const SEGMENT_TEMPLATES: SegmentTemplate[] = [
   {
     id: "infoprodutor",
     title: "Infoprodutor / Criador de Conteúdo",
     description: "Cursos, mentorias, produtos digitais, afiliados",
     icon: "graduation-cap",
     categories: infoProducerCategories,
   },
   {
     id: "profissional_liberal",
     title: "Profissional Liberal",
     description: "Médico, advogado, consultor, dentista, psicólogo",
     icon: "briefcase",
     categories: professionalCategories,
   },
   {
     id: "micro_empresa",
     title: "Micro / Pequena Empresa",
     description: "Comércio, serviços, indústria, varejo",
     icon: "building-2",
     categories: smallBusinessCategories,
   },
   {
     id: "outro",
     title: "Outro",
     description: "Categorias genéricas para outros tipos de negócio",
     icon: "folder",
     categories: genericCategories,
   },
 ];
 
 export function getCategoriesBySegment(segmentId: string): CategoryTemplate[] {
   const template = SEGMENT_TEMPLATES.find((t) => t.id === segmentId);
   return template?.categories || genericCategories;
 }
 
 export function getReceitasBySegment(segmentId: string): CategoryTemplate[] {
   return getCategoriesBySegment(segmentId).filter((c) => c.type === "receita");
 }
 
 export function getDespesasBySegment(segmentId: string): CategoryTemplate[] {
   return getCategoriesBySegment(segmentId).filter((c) => c.type === "despesa");
 }