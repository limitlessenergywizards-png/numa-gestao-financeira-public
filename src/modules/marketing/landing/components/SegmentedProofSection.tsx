'use client';

 import { memo } from "react";
 import { motion } from "framer-motion";
 import { Quote } from "lucide-react";
 import type { Argument } from "@/data/landingVariants";
 
 interface SegmentedProofSectionProps {
   arguments: Argument[];
   testimonial: {
     quote: string;
     author: string;
     role: string;
   };
 }
 
 export const SegmentedProofSection = memo(function SegmentedProofSection({
   arguments: args,
   testimonial,
 }: SegmentedProofSectionProps) {
   return (
     <section className="py-20 lg:py-28 bg-background">
       <div className="container mx-auto px-4">
         {/* Stats */}
         <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-16">
           {args.map((arg, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
               className="text-center p-8 rounded-2xl bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20"
             >
               <p className="text-4xl lg:text-5xl font-bold text-brand mb-3">
                 {arg.stat}
               </p>
               <p className="text-muted-foreground">
                 {arg.description}
               </p>
             </motion.div>
           ))}
         </div>
 
         {/* Testimonial */}
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="max-w-3xl mx-auto"
         >
           <div className="relative bg-card border border-border/50 rounded-2xl p-8 lg:p-12">
             <Quote className="absolute top-6 left-6 h-8 w-8 text-brand/30" />
             
             <blockquote className="text-lg lg:text-xl text-foreground italic mb-6 pl-8">
               "{testimonial.quote}"
             </blockquote>
             
             <div className="flex items-center gap-4 pl-8">
               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand/60 flex items-center justify-center text-brand-foreground font-bold">
                 {testimonial.author.charAt(0)}
               </div>
               <div>
                 <p className="font-semibold text-foreground">{testimonial.author}</p>
                 <p className="text-sm text-muted-foreground">{testimonial.role}</p>
               </div>
             </div>
           </div>
         </motion.div>
       </div>
     </section>
   );
 });
 
 SegmentedProofSection.displayName = "SegmentedProofSection";