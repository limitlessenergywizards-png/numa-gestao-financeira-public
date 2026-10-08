'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeadlineVariant {
  text: string;
  highlight: string;
  persona: string;
}

const headlines: HeadlineVariant[] = [
  {
    text: "Reduza inadimplência em até 40%.",
    highlight: "Cobrança inteligente e automática",
    persona: "alertas antes do vencimento, não depois",
  },
  {
    text: "Saiba quem vai pagar e quem não vai.",
    highlight: "Previsão de recebimento por cliente",
    persona: "dados reais, não achismo",
  },
  {
    text: "Caixa negativo nunca mais.",
    highlight: "Projeção de 90 dias + alertas automáticos",
    persona: "antecipe crises antes que aconteçam",
  },
  {
    text: "Onde cortar custos sem perder qualidade?",
    highlight: "IA analisa e recomenda otimizações",
    persona: "insights acionáveis, não gráficos bonitos",
  },
];

interface AnimatedHeadlineProps {
  className?: string;
  interval?: number;
}

export function AnimatedHeadline({ className, interval = 4000 }: AnimatedHeadlineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const variants = {
    enter: {
      opacity: 0,
      y: 40,
      filter: "blur(10px)",
    },
    center: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      y: -40,
      filter: "blur(10px)",
    },
  };

  return (
    <div className={cn("relative pb-6", className)}>
      <div className="grid grid-cols-1 items-center">
        {headlines.map((headline, index) => (
          <div
            key={index}
            className={cn(
              "col-start-1 row-start-1 transition-[transform,opacity] duration-500 ease-in-out",
              index === currentIndex
                ? "opacity-100 transform translate-y-0 z-10"
                : "opacity-0 transform translate-y-4 pointer-events-none z-0"
            )}
            aria-hidden={index !== currentIndex}
          >
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-montserrat font-bold tracking-tight text-[#E5E5E5] leading-snug sm:leading-tight">
              {headline.text}
              <br />
              <span className="text-[#C5A059]">{headline.highlight}</span>
              <br />
              <span className="text-[#E5E5E5]/70 text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium">
                {headline.persona}
              </span>
            </h1>
          </div>
        ))}
      </div>

      {/* Progress indicators */}
      <div className="absolute bottom-0 left-0 flex gap-2">
        {headlines.map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-1 rounded-full transition-[width,background-color] duration-300",
              index === currentIndex ? "w-8 bg-[#C5A059]" : "w-2 bg-[#C5A059]/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
