'use client';

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Building2, TrendingDown, Bell, Eye } from "lucide-react";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";
import { useParallax } from "@/hooks/useParallax";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

function AnimatedCounter({ value, prefix = "", suffix = "", duration = 2000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(eased * value);
        
        setDisplayValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isInView, value, duration]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return num.toLocaleString("pt-BR");
    }
    return num.toString();
  };

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
}

const stats = [
  { 
    value: 40, 
    suffix: "%", 
    label: "redução média em inadimplência", 
    icon: TrendingDown,
    delay: 0,
    smallerFont: false
  },
  { 
    value: 2400, 
    prefix: "R$ ", 
    suffix: "/mês", 
    label: "economia média por empresa", 
    icon: Building2,
    delay: 0.1,
    smallerFont: true
  },
  { 
    value: 7, 
    suffix: " dias", 
    label: "antecedência nos alertas de cobrança", 
    icon: Bell,
    delay: 0.2,
    smallerFont: false
  },
  { 
    value: 90, 
    suffix: " dias", 
    label: "de visibilidade no fluxo de caixa", 
    icon: Eye,
    delay: 0.3,
    smallerFont: false
  },
];

const companyLogos = [
  "Contabilidade Moderna",
  "Escritório Premium", 
  "Finanças Pro",
  "Gestão Total",
  "Business Solutions",
  "Capital Experts",
  "Pragma Finance",
  "Growth Partners",
];

export function SocialProofSection() {
  const parallaxOffset = useParallax(0.05);

  return (
    <section className="py-16 md:py-20 lg:py-28 relative overflow-hidden bg-dark-surface">
      {/* Background glass effects */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-metallic-500/5 rounded-full blur-[150px] pointer-events-none animate-breathe" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-metallic-400/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Stats grid with individual glass cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: stat.delay }}
                >
                  <EnhancedGlassmorphismCard
                    variant="elevated"
                    specularReflection={true}
                    glowOnHover={true}
                    className="p-6 md:p-8 h-full group flex flex-col items-center justify-center text-center"
                    whileHover={{ y: -4 }}
                  >
                    {/* Icon with glass background */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        {/* Pulsing glow behind icon */}
                        <div className="absolute inset-0 w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-metallic-400/20 blur-lg opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
                        <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-dark-surface/80 backdrop-blur-lg border border-metallic-600/30 flex items-center justify-center group-hover:border-metallic-400/50 group-hover:scale-110 transition-[transform,border-color] duration-300">
                          <Icon className="h-7 w-7 lg:h-8 lg:w-8 text-metallic-400 group-hover:text-metallic-300 transition-colors" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Counter with glow effect */}
                    <div className={`font-montserrat font-bold text-metallic-300 mb-2 group-hover:drop-shadow-[0_0_12px_rgba(107,166,115,0.5)] transition-[filter] whitespace-nowrap ${stat.smallerFont ? 'text-lg md:text-xl lg:text-2xl' : 'text-2xl md:text-3xl lg:text-4xl'}`}>
                      <AnimatedCounter 
                        value={stat.value} 
                        prefix={stat.prefix} 
                        suffix={stat.suffix}
                        duration={2000}
                      />
                    </div>
                    
                    {/* Label */}
                    <p className="text-metallic-100/60 text-xs md:text-sm leading-tight">
                      {stat.label}
                    </p>

                    {/* Bottom glow line */}
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-metallic-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </EnhancedGlassmorphismCard>
                </motion.div>
              );
            })}
          </div>

          {/* Glass connectors between cards - visible on large screens */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-0">
            <div className="max-w-6xl mx-auto px-12">
              <div className="flex justify-between">
                {[0, 1, 2].map((i) => (
                  <div 
                    key={i}
                    className="flex-1 h-px bg-gradient-to-r from-metallic-500/20 via-metallic-400/30 to-metallic-500/20"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Infinite Logo Scroll */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 overflow-hidden"
          >
            <p className="text-center text-metallic-100/40 text-sm mb-6">
              Empresas que confiam na Numa
            </p>
            
            <div className="relative">
              {/* Gradient masks with glass effect */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-dark-surface via-dark-surface/80 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-dark-surface via-dark-surface/80 to-transparent z-10" />
              
              {/* Scrolling logos */}
              <div className="flex animate-scroll-x">
                {[...companyLogos, ...companyLogos].map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 mx-8 px-4 py-2 rounded-lg bg-dark-elevated/30 backdrop-blur-sm border border-metallic-600/10 text-metallic-100/30 hover:text-metallic-100/60 hover:border-metallic-600/30 transition-colors whitespace-nowrap"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
