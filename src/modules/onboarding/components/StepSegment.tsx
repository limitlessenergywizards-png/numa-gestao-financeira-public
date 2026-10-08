'use client';

 import { memo } from "react";
 import { motion } from "framer-motion";
 import { 
   GraduationCap, 
   Briefcase, 
   Building2, 
   Folder,
   Check
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { SEGMENT_TEMPLATES } from "@/data/categoryTemplates";
 
 interface StepSegmentProps {
   value: string;
   onChange: (segment: string) => void;
 }
 
 const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
   "graduation-cap": GraduationCap,
   "briefcase": Briefcase,
   "building-2": Building2,
   "folder": Folder,
 };
 
 export const StepSegment = memo(function StepSegment({ value, onChange }: StepSegmentProps) {
   return (
     <motion.div
       initial={{ opacity: 0, x: 20 }}
       animate={{ opacity: 1, x: 0 }}
       exit={{ opacity: 0, x: -20 }}
       className="space-y-6"
     >
       <div className="text-center mb-6">
         <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-3">
           <Building2 className="w-6 h-6 text-primary" />
         </div>
         <h2 className="text-xl font-semibold">Qual é o seu segmento?</h2>
         <p className="text-sm text-muted-foreground">
           Vamos configurar categorias ideais para o seu negócio
         </p>
       </div>
 
       <div className="grid gap-3">
         {SEGMENT_TEMPLATES.map((segment) => {
           const Icon = iconMap[segment.icon] || Folder;
           const isSelected = value === segment.id;
 
           return (
             <button
               key={segment.id}
               type="button"
               onClick={() => onChange(segment.id)}
               className={cn(
                 "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-[border-color,box-shadow,background-color] duration-200 text-left w-full",
                 isSelected
                   ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                   : "border-border hover:border-primary/50 hover:bg-muted/50"
               )}
             >
               <div
                 className={cn(
                   "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
                   isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                 )}
               >
                 <Icon className="w-6 h-6" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="font-medium">{segment.title}</p>
                 <p className="text-sm text-muted-foreground truncate">
                   {segment.description}
                 </p>
               </div>
               {isSelected && (
                 <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                   <Check className="w-4 h-4" />
                 </div>
               )}
             </button>
           );
         })}
       </div>
 
       <p className="text-xs text-muted-foreground text-center mt-4">
         Você poderá personalizar as categorias depois
       </p>
     </motion.div>
   );
 });
 
 StepSegment.displayName = "StepSegment";