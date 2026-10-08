'use client';

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";
import { GlassRing } from "./GlassRing";
import { GlassOrb } from "./GlassOrb";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-dark-base">
      {/* Aurora glass orbs background */}
      <div className="absolute inset-0 pointer-events-none">
        <GlassOrb size="2xl" color="metallic" blur="xl" className="top-0 left-1/4 opacity-30" animate delay={0} />
        <GlassOrb size="xl" color="metallic" blur="lg" className="bottom-0 right-1/4 opacity-25" animate delay={0.5} />
        <GlassOrb size="lg" color="metallic" blur="md" className="top-1/3 right-[10%] opacity-20" animate delay={1} />
      </div>

      {/* Central intense glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-metallic-500/15 rounded-full blur-[180px] pointer-events-none animate-breathe" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto relative"
        >
          {/* Orbital Glass Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            <GlassRing size={550} thickness={1} duration={30} className="opacity-30" />
            <GlassRing size={650} thickness={1} reverse duration={40} className="opacity-20" delay={0.5} />
            <GlassRing size={750} thickness={1} duration={50} className="opacity-10" delay={1} />
          </div>

          <EnhancedGlassmorphismCard
            variant="deep"
            layers={3}
            specularReflection={true}
            glowOnHover={false}
            className="p-8 md:p-12 text-center"
          >
            {/* Decorative top line */}
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-300/40 to-transparent" />

            {/* Crown icon with glass container */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative w-20 h-20 mx-auto mb-6"
            >
              {/* Pulsing glow behind */}
              <div className="absolute inset-0 bg-metallic-400/30 rounded-full blur-xl animate-pulse" />
              {/* Glass container */}
              <div className="relative w-full h-full rounded-full bg-dark-surface/80 backdrop-blur-xl border border-metallic-400/30 flex items-center justify-center shadow-metallic-lg">
                <Crown className="h-10 w-10 text-metallic-300" />
              </div>
            </motion.div>

            {/* Badge with glass effect */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-full px-5 py-2.5 mb-6 shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-300 font-medium">
                Enquanto você lê isso, alguém está te devendo
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mb-4 text-metallic-50"
            >
              Quanto você perdeu com{" "}
              <span className="text-red-400 relative">
                inadimplência
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="hsl(0 84% 60%)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              {" "}esse mês?
            </motion.h2>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl text-metallic-100/70 mb-8 max-w-2xl mx-auto"
            >
              A cada dia sem controle, dinheiro escapa. Comece hoje. Veja resultados em 7 dias.
              <br className="hidden md:block" />
              <span className="text-metallic-300 font-semibold">3 dias grátis. Sem cartão.</span>
            </motion.p>

            {/* CTA Button with intense glass effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Link href={`${PUBLIC_ROUTES.AUTH}?tab=signup`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg h-12 px-8 bg-brand-gradient hover:opacity-90 transition-opacity"
                >
                  {/* Multi-layer glass shimmer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 delay-100" />

                  <span className="relative z-10 flex items-center">
                    Começar a Recuperar Dinheiro
                    <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </motion.div>

            {/* Trust Text in glass container */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <div className="inline-flex flex-wrap justify-center gap-x-4 gap-y-2 px-6 py-3 rounded-full bg-dark-surface/40 backdrop-blur-lg border border-metallic-600/15 text-sm text-metallic-100/50">
                <span>✓ Setup em 5 minutos</span>
                <span>✓ Importação automática</span>
                <span>✓ Alertas funcionando no dia 1</span>
              </div>
            </motion.div>

            {/* Bottom decorative line */}
            <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-300/30 to-transparent" />
          </EnhancedGlassmorphismCard>
        </motion.div>
      </div>
    </section>
  );
}
