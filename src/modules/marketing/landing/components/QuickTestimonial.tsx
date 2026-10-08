'use client';

import { motion } from "framer-motion";
import { Star, BadgeCheck, Quote } from "lucide-react";

export function QuickTestimonial() {
  return (
    <section className="py-10 md:py-14 bg-dark-surface relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-base/50 to-transparent pointer-events-none" />
      
      {/* Glass orb background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-metallic-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto pt-4"
        >
          {/* Outer glass frame (moldura) */}
          <div className="relative pt-6 p-1.5 rounded-3xl bg-gradient-to-br from-metallic-600/20 via-metallic-500/10 to-metallic-600/20">
            {/* Verified badge - glass pill - MOVED OUTSIDE inner card */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="flex items-center gap-1.5 bg-dark-surface/90 backdrop-blur-xl border border-emerald-500/30 rounded-full px-4 py-1.5 shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Resultado em 30 dias</span>
              </div>
            </div>
            
            {/* Inner glass card */}
            <div className="relative bg-dark-elevated/90 backdrop-blur-2xl rounded-[22px] p-6 md:p-8 text-center border border-metallic-600/20">
              {/* Specular reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-metallic-300/10 via-transparent to-transparent pointer-events-none rounded-[22px]" />
              
              {/* Decorative glass quote marks */}
              <div className="absolute top-4 left-6 opacity-20">
                <Quote className="h-12 w-12 text-metallic-400" />
              </div>
              <div className="absolute bottom-4 right-6 opacity-20 rotate-180">
                <Quote className="h-12 w-12 text-metallic-400" />
              </div>

              {/* Quote content */}
              <blockquote className="text-lg md:text-xl text-metallic-50 font-medium mb-6 mt-4 relative z-10">
                "Minha inadimplência caiu de <span className="text-metallic-300 font-bold">12% para 5%</span>. Os alertas automáticos fazem o trabalho sujo."
              </blockquote>

              {/* Author info with glass avatar ring */}
              <div className="flex items-center justify-center gap-4 relative z-10">
                {/* Avatar with glass ring */}
                <div className="relative">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-metallic-400/40 to-metallic-600/20 blur-sm" />
                  {/* Glass ring */}
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-metallic-400/30 to-metallic-600/10 backdrop-blur-sm" />
                  {/* Avatar */}
                  <div className="relative w-12 h-12 rounded-full bg-metallic-shine flex items-center justify-center text-dark-base font-bold text-sm ring-2 ring-metallic-400/30">
                    JM
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-metallic-50 font-semibold text-sm">João Mendes</p>
                  <p className="text-metallic-100/60 text-xs">CEO • Distribuidora Mendes</p>
                </div>

                {/* Rating stars with glass container */}
                <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-dark-surface/50 backdrop-blur-lg border border-metallic-600/20">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-metallic-300 text-metallic-300" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
