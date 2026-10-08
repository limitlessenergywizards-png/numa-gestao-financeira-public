'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { EnhancedGlassmorphismCard } from "./EnhancedGlassmorphismCard";

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  company?: string;
  rating?: number;
  avatar?: string | React.ReactNode;
  metric?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultTestimonials: TestimonialItem[] = [
  {
    quote: "Nossa inadimplência caiu de 15% para 6% em 3 meses. Os alertas automáticos fazem a cobrança por mim.",
    author: "Carlos Mendes",
    role: "Dono de Distribuidora",
    company: "Mendes Distribuição",
    rating: 5,
    avatar: "CM",
    metric: "Inadimplência: 15% → 6%",
  },
  {
    quote: "Descobri que 2 clientes me davam prejuízo. Ajustei os preços e minha margem subiu 8%.",
    author: "Patricia Lima",
    role: "Empresária",
    company: "Lima Serviços",
    rating: 5,
    avatar: "PL",
    metric: "+8% de margem líquida",
  },
  {
    quote: "Antes eu só sabia que ia faltar dinheiro quando já tinha faltado. Agora antecipo 90 dias.",
    author: "Roberto Andrade",
    role: "CFO",
    company: "Grupo Andrade",
    rating: 5,
    avatar: "RA",
    metric: "0 surpresas de caixa em 12 meses",
  },
  {
    quote: "A IA me mostrou que meu custo com frete estava 30% acima do mercado. Renegociei e economizo R$4.500/mês.",
    author: "Fernanda Costa",
    role: "Gestora Financeira",
    company: "Costa Comércio",
    rating: 5,
    avatar: "FC",
    metric: "R$4.500/mês de economia",
  },
  {
    quote: "O score de pagamento por cliente mudou minha vida. Sei exatamente quem vai atrasar antes de acontecer.",
    author: "João Santos",
    role: "Empresário",
    company: "JS Distribuição",
    rating: 5,
    avatar: "JS",
    metric: "-35% em atrasos",
  },
];

const trustedLogos = [
  "Contabilidade Moderna",
  "Escritório Premium",
  "Finanças Pro",
  "Gestão Total",
  "Business Solutions",
];

interface TestimonialsSectionProps {
  testimonials?: TestimonialItem[];
  title?: React.ReactNode;
  subtitle?: string;
}

export function TestimonialsSection({
  testimonials = defaultTestimonials,
  title,
  subtitle
}: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const getPrevIndex = () => (currentIndex - 1 + testimonials.length) % testimonials.length;
  const getNextIndex = () => (currentIndex + 1) % testimonials.length;

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-dark-base">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-metallic-500/5 rounded-full blur-[180px] pointer-events-none animate-breathe" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-metallic-300 font-montserrat font-semibold uppercase tracking-wider text-sm">
            Depoimentos
          </span>
          {title || (
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold mt-4 mb-4 text-metallic-50">
              Usado por <span className="text-metallic-300">empresas</span> em todo Brasil
            </h2>
          )}
          <p className="text-metallic-100/60 text-lg max-w-2xl mx-auto">
            {subtitle || "Veja o que nossos clientes estão dizendo"}
          </p>
        </motion.div>

        {/* 3D Carousel with visible side cards */}
        <div className="max-w-5xl mx-auto mb-16 relative">
          {/* Navigation Buttons with glass effect */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-8 z-20 w-12 h-12 rounded-full bg-dark-surface/80 backdrop-blur-xl border border-metallic-600/30 flex items-center justify-center text-metallic-300 hover:bg-metallic-600/20 hover:border-metallic-400/50 transition-colors shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-8 z-20 w-12 h-12 rounded-full bg-dark-surface/80 backdrop-blur-xl border border-metallic-600/30 flex items-center justify-center text-metallic-300 hover:bg-metallic-600/20 hover:border-metallic-400/50 transition-colors shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* 3D Carousel Container */}
          <div className="relative h-[380px] md:h-[340px] flex items-center justify-center perspective-2000">
            {/* Previous card (blurred, scaled down) */}
            <motion.div
              className="absolute left-0 md:left-8 w-[280px] hidden md:block opacity-40 blur-sm scale-90 -z-10"
              animate={{ x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <TestimonialCard testimonial={testimonials[getPrevIndex()]} isActive={false} />
            </motion.div>

            {/* Active card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-full max-w-3xl z-10"
              >
                <TestimonialCard testimonial={testimonials[currentIndex]} isActive={true} />
              </motion.div>
            </AnimatePresence>

            {/* Next card (blurred, scaled down) */}
            <motion.div
              className="absolute right-0 md:right-8 w-[280px] hidden md:block opacity-40 blur-sm scale-90 -z-10"
              animate={{ x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <TestimonialCard testimonial={testimonials[getNextIndex()]} isActive={false} />
            </motion.div>
          </div>

          {/* Dots with glass effect */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="flex gap-2 px-4 py-2 rounded-full bg-dark-surface/50 backdrop-blur-lg border border-metallic-600/20">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-300 ${index === currentIndex
                    ? "w-8 bg-metallic-400 shadow-[0_0_10px_rgba(107,166,115,0.5)]"
                    : "w-2 bg-metallic-600/50 hover:bg-metallic-500/50"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trusted By with glass pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-metallic-100/40 text-sm mb-6">
            Empresas que confiam na Numa
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {trustedLogos.map((name, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-surface/40 backdrop-blur-lg border border-metallic-600/15 text-metallic-100/30 hover:text-metallic-100/60 hover:border-metallic-600/30 transition-colors"
              >
                <Building2 className="h-4 w-4" />
                <span className="font-medium text-sm">{name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: TestimonialItem;
  isActive: boolean;
}

function TestimonialCard({ testimonial, isActive }: TestimonialCardProps) {
  return (
    <EnhancedGlassmorphismCard
      variant={isActive ? "deep" : "floating"}
      layers={isActive ? 2 : 1}
      specularReflection={isActive}
      glowOnHover={isActive}
      className={`h-full p-8 md:p-10 ${isActive ? "" : "pointer-events-none"}`}
    >
      {/* Decorative floating glass quote */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-4 -left-2 md:left-4"
        >
          <div className="w-12 h-12 rounded-xl bg-dark-surface/80 backdrop-blur-xl border border-metallic-600/30 flex items-center justify-center shadow-lg">
            <Quote className="h-6 w-6 text-metallic-400" />
          </div>
        </motion.div>
      )}

      {/* Rating Stars in glass container */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex gap-1 px-4 py-2 rounded-full bg-dark-surface/50 backdrop-blur-lg border border-metallic-600/20">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <motion.div
              key={i}
              initial={isActive ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Star className="h-4 w-4 fill-metallic-300 text-metallic-300" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metric Badge */}
      {testimonial.metric && (
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full">
            ✓ {testimonial.metric}
          </span>
        </div>
      )}

      {/* Quote */}
      <blockquote className="text-metallic-50 text-lg md:text-xl leading-relaxed mb-8 text-center max-w-2xl mx-auto">
        "{testimonial.quote}"
      </blockquote>

      {/* Author with glass avatar */}
      <div className="flex items-center justify-center gap-4">
        {/* Avatar with layered glass effect */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-metallic-400/30 to-metallic-600/10 blur-sm" />
          <div className="relative w-14 h-14 rounded-full bg-metallic-shine flex items-center justify-center text-dark-base font-bold text-sm ring-2 ring-metallic-400/30 ring-offset-2 ring-offset-dark-base shadow-lg">
            {testimonial.avatar}
          </div>
        </div>
        <div className="text-left">
          <p className="font-semibold text-metallic-50">{testimonial.author}</p>
          <p className="text-metallic-100/60 text-sm">
            {testimonial.role} • {testimonial.company}
          </p>
        </div>
      </div>
    </EnhancedGlassmorphismCard>
  );
}
