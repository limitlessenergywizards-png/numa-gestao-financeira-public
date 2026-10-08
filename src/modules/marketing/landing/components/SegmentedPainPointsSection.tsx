'use client';

 import { memo } from "react";
 import { motion } from "framer-motion";
 import type { PainPoint } from "@/data/landingVariants";
 
 interface SegmentedPainPointsSectionProps {
   painPoints: PainPoint[];
 }
 
 export const SegmentedPainPointsSection = memo(function SegmentedPainPointsSection({
   painPoints,
 }: SegmentedPainPointsSectionProps) {
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
             Você se identifica?
           </h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
             Esses são os problemas mais comuns que vemos todos os dias.
           </p>
         </motion.div>
 
         <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
           {painPoints.map((point, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
               className="group"
             >
               <div className="h-full bg-card border border-border/50 rounded-2xl p-6 lg:p-8 hover:border-destructive/30 hover:shadow-lg hover:shadow-destructive/5 transition-[border-color,box-shadow] duration-300">
                 <div className="text-4xl mb-4">{point.icon}</div>
                 <h3 className="text-lg font-semibold text-foreground mb-3 leading-tight">
                   {point.title}
                 </h3>
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   {point.description}
                 </p>
               </div>
             </motion.div>
           ))}
         </div>
       </div>
     </section>
   );
 });
 
 SegmentedPainPointsSection.displayName = "SegmentedPainPointsSection";