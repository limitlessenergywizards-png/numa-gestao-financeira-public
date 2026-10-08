'use client';

 import { memo } from "react";
 import { motion } from "framer-motion";
 import { Check, X } from "lucide-react";
 
 const DIFFERENTIATORS = [
   {
     feature: 'DRE automática mensal com comparativo',
     others: 'Só anual ou nem tem',
     numa: true,
   },
   {
     feature: 'Fluxo de caixa diário com projeção',
     others: 'Só mensal',
     numa: true,
   },
   {
     feature: 'Resumo financeiro no WhatsApp',
     others: 'Nenhum oferece',
     numa: true,
   },
   {
     feature: 'Indicadores de margem em tempo real',
     others: 'Só com contador',
     numa: true,
   },
 ] as const;
 
 export const DifferentiatorSection = memo(function DifferentiatorSection() {
   return (
     <section className="py-20 lg:py-28 bg-muted/30">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-12"
         >
           <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
             Por que o Numa não é mais do mesmo?
           </h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             Comparado com sistemas tradicionais de gestão financeira
           </p>
         </motion.div>
 
         <div className="max-w-3xl mx-auto">
           <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
             {/* Header */}
             <div className="grid grid-cols-3 bg-muted/50 border-b border-border/50">
               <div className="p-4 lg:p-6 font-semibold text-foreground">
                 Funcionalidade
               </div>
               <div className="p-4 lg:p-6 font-semibold text-center text-muted-foreground">
                 Outros
               </div>
               <div className="p-4 lg:p-6 font-semibold text-center text-brand">
                 Numa
               </div>
             </div>
 
             {/* Rows */}
             {DIFFERENTIATORS.map((item, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: index * 0.1 }}
                 className={`grid grid-cols-3 ${
                   index !== DIFFERENTIATORS.length - 1 ? 'border-b border-border/30' : ''
                 }`}
               >
                 <div className="p-4 lg:p-6 text-sm lg:text-base text-foreground">
                   {item.feature}
                 </div>
                 <div className="p-4 lg:p-6 flex items-center justify-center">
                   <div className="flex items-center gap-2">
                     <X className="h-4 w-4 text-destructive/60" />
                     <span className="text-xs lg:text-sm text-muted-foreground hidden sm:inline">
                       {item.others}
                     </span>
                   </div>
                 </div>
                 <div className="p-4 lg:p-6 flex items-center justify-center">
                   <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand/10">
                     <Check className="h-5 w-5 text-brand" />
                   </div>
                 </div>
               </motion.div>
             ))}
           </div>
         </div>
       </div>
     </section>
   );
 });
 
 DifferentiatorSection.displayName = "DifferentiatorSection";