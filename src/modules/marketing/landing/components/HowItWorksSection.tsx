'use client';

 import { memo } from "react";
 import { motion } from "framer-motion";
 import { Settings, Upload, Sparkles } from "lucide-react";
 
 const STEPS = [
   {
     number: 1,
     title: 'Cadastre suas contas e categorias',
     description: 'Configure em 5 minutos com templates prontos para seu segmento.',
     Icon: Settings,
   },
   {
     number: 2,
     title: 'Lance entradas e saídas',
     description: 'Manual ou importe direto do extrato bancário.',
     Icon: Upload,
   },
   {
     number: 3,
     title: 'Receba insights automaticamente',
     description: 'Dashboards, DRE, alertas de inadimplência e projeções.',
     Icon: Sparkles,
   },
 ] as const;
 
 export const HowItWorksSection = memo(function HowItWorksSection() {
   return (
     <section className="py-20 lg:py-28 bg-background">
       <div className="container mx-auto px-4">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="text-center mb-12"
         >
           <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
             Como funciona?
           </h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             3 passos simples para ter controle total das suas finanças
           </p>
         </motion.div>
 
         <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
           {STEPS.map((step, index) => (
             <motion.div
               key={step.number}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.15 }}
               className="relative text-center"
             >
               {/* Connector Line (desktop only) */}
               {index < STEPS.length - 1 && (
                 <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-brand/30 to-brand/10" />
               )}
 
               {/* Step Number */}
               <div className="relative z-10 mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/30 flex items-center justify-center mb-6">
                 <step.Icon className="h-10 w-10 text-brand" />
                 <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-sm font-bold">
                   {step.number}
                 </div>
               </div>
 
               <h3 className="text-lg font-semibold text-foreground mb-2">
                 {step.title}
               </h3>
               <p className="text-muted-foreground text-sm">
                 {step.description}
               </p>
             </motion.div>
           ))}
         </div>
       </div>
     </section>
   );
 });
 
 HowItWorksSection.displayName = "HowItWorksSection";