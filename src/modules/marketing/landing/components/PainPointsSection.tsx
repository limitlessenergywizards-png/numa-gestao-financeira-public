'use client';

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { AlertTriangle, TrendingDown, Eye, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrefersReducedMotion } from "@/hooks/useLazyVisible";
import { cn } from "@/lib/utils";

const PAIN_POINTS = [
  {
    icon: AlertTriangle,
    solutionIcon: CheckCircle2,
    title: "Descobre inadimplência tarde demais?",
    pain: "Enquanto você espera o cliente pagar, seu caixa sangra. Cada dia de atraso é dinheiro parado.",
    solution: "Alertas 7 dias antes do vencimento. Score de pagamento por cliente. Aging automático.",
    stat: "-40% inadimplência",
  },
  {
    icon: TrendingDown,
    solutionIcon: CheckCircle2,
    title: "Não sabe onde cortar custos?",
    pain: "Gastos aumentam mas você não sabe o que é desperdício e o que é investimento essencial.",
    solution: "IA compara seus gastos com benchmarks e sugere onde otimizar sem perder qualidade.",
    stat: "R$2.400/mês economizados",
  },
  {
    icon: Eye,
    solutionIcon: CheckCircle2,
    title: "Caixa negativo surpresa?",
    pain: "Você só descobre que vai faltar dinheiro quando já faltou. Aí é tarde demais.",
    solution: "Projeção de 90 dias com cenário otimista, realista e pessimista. Alertas automáticos.",
    stat: "0 surpresas em 12 meses",
  },
];

const SLIDE_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

export function PainPointsSection() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % PAIN_POINTS.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + PAIN_POINTS.length) % PAIN_POINTS.length);
  }, []);

  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = setInterval(goNext, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, goNext]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) * velocity.x;
    if (offset.x < -SWIPE_THRESHOLD || swipe < -1000) {
      goNext();
    } else if (offset.x > SWIPE_THRESHOLD || swipe > 1000) {
      goPrev();
    }
  };

  const currentPoint = PAIN_POINTS[currentSlide];

  return (
    <section id="pain-points" className="py-20 md:py-28 relative overflow-hidden bg-dark-base">
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-surface/50 via-transparent to-dark-surface/50 pointer-events-none" />
      
      {/* Reddish glow for "pain" theme */}
      {!isMobile && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[180px] pointer-events-none" />
      )}
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-red-400 font-montserrat font-semibold uppercase tracking-wider text-sm">
            O problema
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mb-4 text-metallic-50 mt-4">
            Isso está te <span className="text-red-400">custando dinheiro</span>
          </h2>
          <p className="text-metallic-100/60 text-lg max-w-2xl mx-auto">
            Problemas que parecem pequenos custam horas, dinheiro e oportunidades.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div 
          className="relative max-w-2xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Navigation Arrows - Desktop */}
          {!isMobile && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-16 z-20 p-3 rounded-full bg-dark-surface/80 backdrop-blur-sm border border-metallic-100/10 text-metallic-100/60 hover:text-metallic-50 hover:border-metallic-100/30 transition-colors duration-300"
                aria-label="Slide anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-16 z-20 p-3 rounded-full bg-dark-surface/80 backdrop-blur-sm border border-metallic-100/10 text-metallic-100/60 hover:text-metallic-50 hover:border-metallic-100/30 transition-colors duration-300"
                aria-label="Próximo slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Slide Container */}
          <div className="overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={shouldReduceMotion ? undefined : slideVariants}
                initial={shouldReduceMotion ? { opacity: 0 } : "enter"}
                animate={shouldReduceMotion ? { opacity: 1 } : "center"}
                exit={shouldReduceMotion ? { opacity: 0 } : "exit"}
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                }}
                drag={isMobile ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="cursor-grab active:cursor-grabbing"
              >
                <PainPointCard 
                  point={currentPoint} 
                  reduceMotion={shouldReduceMotion}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Indicators */}
          <div className="mt-8 flex flex-col items-center gap-4">
            {/* Dots */}
            <div className="flex gap-3 justify-center">
              {PAIN_POINTS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-2 rounded-full transition-[width,background-color] duration-300",
                    index === currentSlide 
                      ? "w-8 bg-red-400" 
                      : "w-2 bg-metallic-100/30 hover:bg-metallic-100/50"
                  )}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs h-1 bg-metallic-100/10 rounded-full overflow-hidden">
              <motion.div
                key={currentSlide}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isPaused ? undefined : 1 }}
                transition={{ 
                  duration: SLIDE_INTERVAL / 1000, 
                  ease: "linear" 
                }}
                className="h-full bg-red-400/50 origin-left"
              />
            </div>

            {/* Hint text */}
            <p className="text-metallic-100/40 text-sm">
              {isMobile ? "Deslize ou toque no card" : "Passe o mouse no card para ver a solução"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface PainPointCardProps {
  point: typeof PAIN_POINTS[0];
  reduceMotion?: boolean;
}

function PainPointCard({ point, reduceMotion = false }: PainPointCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)}
      className="group cursor-pointer select-none"
    >
      {/* Outer glass frame with red/green tint transition */}
      <div className={`relative p-0.5 rounded-2xl transition-[background] duration-500 ${
        isHovered 
          ? "bg-gradient-to-br from-metallic-500/30 via-metallic-400/20 to-metallic-500/30" 
          : "bg-gradient-to-br from-red-500/20 via-red-400/10 to-red-500/20"
      }`}>
        <EnhancedGlassmorphismCard
          variant="deep"
          specularReflection={true}
          glowOnHover={false}
          className={`h-full p-6 md:p-8 transition-[border-color] duration-500 ${
            isHovered 
              ? "border-metallic-400/30" 
              : "border-red-500/20"
          }`}
        >
          {/* Fracture lines overlay for "broken glass" effect when showing pain */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-30'}`}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="40" y2="50" stroke="rgba(239,68,68,0.2)" strokeWidth="0.3" />
              <line x1="40" y1="50" x2="60" y2="40" stroke="rgba(239,68,68,0.15)" strokeWidth="0.2" />
              <line x1="60" y1="40" x2="100" y2="60" stroke="rgba(239,68,68,0.1)" strokeWidth="0.2" />
            </svg>
          </div>

          {/* Icon transition */}
          <div className="relative w-16 h-16 rounded-xl mb-6 overflow-hidden">
            {/* Pain icon */}
            <motion.div
              animate={{ 
                opacity: isHovered ? 0 : 1,
                scale: isHovered ? 0.8 : 1,
                y: isHovered ? -10 : 0
              }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="absolute inset-0 bg-red-500/10 backdrop-blur-sm border border-red-500/20 flex items-center justify-center rounded-xl"
            >
              <point.icon className="h-8 w-8 text-red-400" />
            </motion.div>
            
            {/* Solution icon */}
            <motion.div
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.8,
                y: isHovered ? 0 : 10
              }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="absolute inset-0 bg-metallic-500/10 backdrop-blur-sm border border-metallic-400/30 flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(107,166,115,0.2)]"
            >
              <point.solutionIcon className="h-8 w-8 text-metallic-300" />
            </motion.div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-montserrat font-semibold mb-3 text-metallic-50">
            {point.title}
          </h3>

          {/* Content transition */}
          <div className="relative min-h-[120px]">
            {/* Pain content */}
            <motion.p
              animate={{ 
                opacity: isHovered ? 0 : 1,
                y: isHovered ? -10 : 0
              }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="text-metallic-100/60 text-base leading-relaxed absolute inset-0"
            >
              {point.pain}
            </motion.p>
            
            {/* Solution content */}
            <motion.div
              animate={{ 
                opacity: isHovered ? 1 : 0,
                y: isHovered ? 0 : 10
              }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="absolute inset-0"
            >
              <p className="text-metallic-100/80 text-base leading-relaxed mb-4">
                {point.solution}
              </p>
              {/* Stat badge with glass effect */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-metallic-500/10 backdrop-blur-sm border border-metallic-400/30 text-metallic-300 font-semibold text-sm">
                <span>{point.stat}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </motion.div>
          </div>

          {/* Bottom gradient bar transition */}
          <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl">
            <motion.div
              animate={{ scaleX: isHovered ? 1 : 0 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="h-full bg-metallic-gradient origin-left"
            />
            <motion.div
              animate={{ scaleX: isHovered ? 0 : 1 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="absolute inset-0 h-full bg-gradient-to-r from-red-500/50 via-red-400/30 to-red-500/50 origin-right"
            />
          </div>
        </EnhancedGlassmorphismCard>
      </div>
    </div>
  );
}
