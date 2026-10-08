'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoCardProps {
    className?: string;
    children: React.ReactNode;
    title: string;
    subtitle: string;
    delay?: number;
}

const BentoCard = ({ className, children, title, subtitle, delay = 0 }: BentoCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className={cn(
            "relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between group hover:border-brand/30 hover:bg-white/10 transition-colors duration-500",
            className
        )}
    >
        <div className="relative z-10 mb-4 sm:mb-0 order-2 sm:order-1">
            <h3 className="font-syne font-bold text-2xl text-white mb-2">{title}</h3>
            <p className="font-manrope text-sm sm:text-base text-gray-400 max-w-[90%]">{subtitle}</p>
        </div>
        <div className="relative z-0 order-1 sm:order-2 flex-grow min-h-[150px] mb-4 sm:mb-0">
            {children}
            {/* Hover Glow */}
            <div className="absolute -inset-full rounded-full bg-brand/20 opacity-0 blur-3xl group-hover:opacity-30 transition-opacity duration-700 pointer-events-none mix-blend-screen" />
        </div>
    </motion.div>
);

export const BentoFeatures = () => {
    return (
        <section className="py-24 sm:py-32 relative bg-[#132925] overflow-hidden">
            {/* Background Mesh */}
            <div className="absolute top-[20%] right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-24">
                    <span className="font-manrope text-brand text-sm tracking-widest uppercase font-semibold mb-3 block">
                        Por que Numa?
                    </span>
                    <h2 className="font-syne font-bold text-4xl sm:text-5xl text-white leading-tight">
                        Ferramentas executivas, não apenas operacionais.
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[800px]">
                    {/* Card 1: Main DRE Feature (Large) */}
                    <BentoCard
                        title="DRE em Tempo Real"
                        subtitle="Demonstrativo de Resultados gerado instantaneamente a cada transação."
                        className="md:col-span-2 md:row-span-2"
                        delay={0.1}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                            {/* Abstract Graph Representation */}
                            <div className="w-[80%] h-[60%] flex items-end justify-between gap-2 opacity-50">
                                {[40, 70, 50, 90, 60, 80].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ delay: 0.5 + (i * 0.1), duration: 1, type: "spring" }}
                                        className="w-full bg-gradient-to-t from-brand/20 to-brand rounded-t-sm"
                                    />
                                ))}
                            </div>
                        </div>
                    </BentoCard>

                    {/* Card 2: Conciliation (Tall) */}
                    <BentoCard
                        title="Conciliação Inteligente"
                        subtitle="Importe OFX e deixe o sistema identificar padrões."
                        className="md:col-span-1 md:row-span-2"
                        delay={0.2}
                    >
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-brand/30 animate-spin-slow flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-brand/20 backdrop-blur-md" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#132925] to-transparent h-1/3 bottom-0" />
                        </div>
                    </BentoCard>

                    {/* Card 3: Cash Flow (Wide) */}
                    <BentoCard
                        title="Fluxo de Caixa Projetado"
                        subtitle="Visualize o futuro da sua empresa com previsibilidade."
                        className="md:col-span-3 md:row-span-1 min-h-[300px]"
                        delay={0.3}
                    >
                        <div className="w-full h-full relative overflow-hidden rounded-xl border border-white/5 bg-black/20 p-6">
                            {/* Curved Line Graph */}
                            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <path
                                    d="M0,100 C150,80 300,120 450,50 S700,80 900,20"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    className="drop-shadow-[0_0_10px_rgba(197,160,89,0.5)]"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#C5A059" stopOpacity="0.2" />
                                        <stop offset="50%" stopColor="#C5A059" />
                                        <stop offset="100%" stopColor="#C5A059" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </BentoCard>
                </div>
            </div>
        </section>
    );
};
