'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Play, Star, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { AnimatedHeadline } from "./AnimatedHeadline";
import { ParallaxBackground } from "./ParallaxBackground";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";
import { GlassTrustBadge, GlassTrustBadgeConnector } from "./GlassTrustBadge";
import { GlassRing } from "./GlassRing";
import { GlassOrb } from "./GlassOrb";

export function HeroSection() {
  const trustBadges = [
    "Sem cartão de crédito",
    "3 dias grátis",
    "Cancele quando quiser",
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 xs:pt-20 lg:pt-24 pb-24 lg:pb-32 xl:pb-40 bg-dark-base">
      {/* Multi-layer Parallax Background with Metallic Green */}
      <ParallaxBackground />

      {/* Hero gradient overlay */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      {/* Additional glass orbs for depth */}
      <GlassOrb size="xl" color="metallic" blur="xl" className="top-[10%] right-[5%] opacity-40" delay={0.5} />
      <GlassOrb size="lg" color="metallic" blur="lg" className="bottom-[20%] left-[10%] opacity-30" delay={0.8} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 xl:gap-24 items-center max-w-7xl mx-auto">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left pt-4 sm:pt-0">
            {/* Badge with glass effect */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge
                variant="outline"
                className="mb-4 sm:mb-6 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm border-metallic-400/30 bg-dark-surface/60 backdrop-blur-xl text-metallic-200 font-montserrat relative overflow-hidden group"
              >
                {/* Glass shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-metallic-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10">✓ Usado por +1.500 empresas</span>
              </Badge>
            </motion.div>

            {/* Animated Rotating Headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <AnimatedHeadline className="mb-2 sm:mb-4 md:mb-6" />
            </motion.div>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-sm xs:text-base sm:text-lg md:text-xl text-metallic-100/70 mb-4 sm:mb-6 max-w-xl mx-auto lg:mx-0 font-opensans leading-relaxed"
            >
              Visibilidade total sobre inadimplência, otimização de custos e projeção de caixa em tempo real.
              <br className="hidden sm:block" />
              <span className="text-metallic-300 font-medium">Do caos financeiro ao controle absoluto em 3 dias.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300 mb-6 lg:mb-8"
            >
              <Link href={`${PUBLIC_ROUTES.AUTH}?tab=signup`} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-sm xs:text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-metallic-shine text-dark-base hover:opacity-90 transition-opacity shadow-metallic-lg group font-montserrat font-semibold animate-glow-pulse border border-metallic-300/30 relative overflow-hidden"
                >
                  {/* Shimmer overlay */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10 flex items-center">
                    Testar Grátis por 3 Dias
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-sm xs:text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-metallic-400/50 text-metallic-200 hover:bg-metallic-600/20 font-montserrat font-semibold backdrop-blur-lg bg-dark-surface/30 hover:border-metallic-400/70 transition-colors"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver Como Funciona
              </Button>
            </motion.div>

            {/* Trust Badges with Glass Effect */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap md:flex-nowrap lg:flex-wrap xl:flex-nowrap justify-center lg:justify-start items-center gap-2 xs:gap-3"
            >
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GlassTrustBadge index={index}>{badge}</GlassTrustBadge>
                  {index < trustBadges.length - 1 && <GlassTrustBadgeConnector />}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - Dashboard Preview with Multi-Layer Glass */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative hidden lg:block"
          >
            {/* Orbital Glass Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <GlassRing size={520} thickness={1} duration={25} className="opacity-40" />
              <GlassRing size={600} thickness={1} reverse duration={35} className="opacity-25" delay={0.5} />
            </div>

            {/* Pulsing Glow Effect */}
            <div className="absolute -inset-8 xl:-inset-12 bg-gradient-to-r from-metallic-500/20 via-metallic-400/10 to-metallic-500/20 rounded-3xl blur-3xl opacity-40 animate-breathe" />

            {/* Layer 3 - Furthest back */}
            <div className="absolute -inset-12 bg-metallic-700/10 rounded-[2rem] backdrop-blur-sm border border-metallic-600/10" />

            {/* Layer 2 - Middle */}
            <div className="absolute -inset-6 bg-metallic-600/10 rounded-3xl backdrop-blur-md border border-metallic-500/15" />

            {/* Main Dashboard Frame with Enhanced Glassmorphism */}
            <EnhancedGlassmorphismCard
              variant="deep"
              layers={1}
              specularReflection={true}
              mouseTracking={true}
              glowOnHover={true}
              className="p-2 xl:p-3"
            >
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 xl:px-6 py-3 xl:py-4 border-b border-metallic-600/20 bg-dark-surface/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-dark-base/60 backdrop-blur-sm rounded-md px-4 py-1.5 text-xs text-metallic-100/50 text-center border border-metallic-600/20">
                    app.numa.com.br/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Preview Content */}
              <div className="aspect-[16/10] bg-gradient-to-br from-dark-base to-dark-surface rounded-b-xl p-4 lg:p-6 xl:p-8">
                {/* KPI Cards with glass effect */}
                <div className="grid grid-cols-3 gap-3 lg:gap-4 xl:gap-5 mb-4 lg:mb-6">
                  {[
                    { label: "Receitas", value: "R$ 45.230", trend: "+12%", color: "from-metallic-400 to-metallic-300" },
                    { label: "Despesas", value: "R$ 28.150", trend: "-5%", color: "from-red-400 to-red-500" },
                    { label: "Saldo", value: "R$ 17.080", trend: "+18%", color: "from-metallic-300 to-metallic-200" },
                  ].map((kpi, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.15 }}
                      className="relative bg-dark-surface/60 backdrop-blur-lg border border-metallic-600/20 rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 hover:border-metallic-400/40 transition-[border-color] group overflow-hidden"
                    >
                      {/* Glass specular */}
                      <div className="absolute inset-0 bg-gradient-to-br from-metallic-300/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="text-[10px] lg:text-xs xl:text-sm text-metallic-100/50 mb-1 lg:mb-2">{kpi.label}</div>
                      <div className={`text-sm lg:text-base xl:text-lg font-bold bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>
                        {kpi.value}
                      </div>
                      <div className={`text-[9px] lg:text-[10px] xl:text-xs ${kpi.trend.startsWith('+') ? 'text-metallic-300' : 'text-red-400'}`}>
                        {kpi.trend}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-5">
                  {/* Animated Bar Chart */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="relative bg-dark-surface/60 backdrop-blur-lg border border-metallic-600/20 rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-metallic-400/5 to-transparent pointer-events-none" />
                    <div className="text-[10px] lg:text-xs xl:text-sm text-metallic-100/50 mb-2 lg:mb-3 relative z-10">Fluxo Mensal</div>
                    <div className="flex items-end justify-around gap-1 lg:gap-2 h-16 lg:h-20 xl:h-24 relative z-10">
                      {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 1.7 + i * 0.1, duration: 0.5 }}
                          className="w-3 lg:w-4 xl:w-5 bg-gradient-to-t from-metallic-500 to-metallic-300 rounded-t hover:from-metallic-400 hover:to-metallic-200 transition-colors cursor-pointer shadow-[0_0_10px_rgba(107,166,115,0.3)]"
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Donut Chart */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8 }}
                    className="relative bg-dark-surface/60 backdrop-blur-lg border border-metallic-600/20 rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-metallic-400/5 to-transparent pointer-events-none" />
                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 z-10">
                      <div className="absolute inset-0 rounded-full border-[5px] lg:border-[6px] xl:border-[8px] border-metallic-600/30" />
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute inset-0 rounded-full border-[5px] lg:border-[6px] xl:border-[8px] border-metallic-400 border-t-transparent border-l-transparent origin-center shadow-[0_0_20px_rgba(107,166,115,0.4)]"
                        style={{ transform: 'rotate(45deg)' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs lg:text-sm xl:text-base font-bold text-metallic-300">62%</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </EnhancedGlassmorphismCard>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator with Glass Effect */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
        className="absolute bottom-4 sm:bottom-8 inset-x-0 hidden sm:flex justify-center pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 pointer-events-auto"
        >
          <span className="text-xs uppercase tracking-wider text-metallic-100/40 backdrop-blur-sm px-3 py-1 rounded-full bg-dark-surface/30 border border-metallic-600/20">
            Rolar para Baixo
          </span>
          <div className="w-8 h-8 rounded-full bg-dark-surface/40 backdrop-blur-lg border border-metallic-600/20 flex items-center justify-center">
            <ChevronDown className="h-4 w-4 text-metallic-300/60" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
