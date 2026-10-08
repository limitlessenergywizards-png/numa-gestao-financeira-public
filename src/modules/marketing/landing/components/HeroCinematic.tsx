'use client';

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MetallicButton } from "./MetallicButton";
import { GlassOrb } from "./GlassOrb";

export const HeroCinematic = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax effects
    const yText = useTransform(scrollY, [0, 500], [0, 200]);
    const yOrb = useTransform(scrollY, [0, 500], [0, -100]);
    const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#1B3B34] to-[#132925]">
            {/* Background Texture - Noise */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

            {/* Animated Orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] opacity-30 pointer-events-none">
                <GlassOrb className="w-full h-full animate-float" />
            </div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] opacity-20 pointer-events-none delay-1000">
                <GlassOrb className="w-full h-full animate-float delay-700" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 container px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">

                {/* Magnetic Heading */}
                <motion.div
                    style={{ y: yText, opacity: opacityHero }}
                    className="flex flex-col items-center"
                >
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="font-manrope text-brand font-bold tracking-widest uppercase text-sm mb-6 border border-brand/30 px-4 py-1.5 rounded-full bg-brand/5 backdrop-blur-sm"
                    >
                        Inteligência Financeira Premium
                    </motion.span>

                    <h1 className="font-syne font-extrabold text-5xl sm:text-7xl lg:text-9xl tracking-tighter text-white leading-[0.9] mb-8 relative">
                        <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/70 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                            DOMINE
                        </span>
                        <motion.span
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 1 }}
                            className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-light via-brand to-brand-dark drop-shadow-[0_0_40px_rgba(197,160,89,0.3)] animate-magnetic-float"
                        >
                            SUA ESTRATÉGIA
                        </motion.span>
                    </h1>

                    <p className="font-manrope text-lg sm:text-xl text-gray-300 max-w-2xl mb-10 leading-relaxed font-light">
                        Transforme dados financeiros em <span className="text-brand font-semibold">poder de decisão</span>.
                        O dashboard executivo feito para quem lidera o futuro.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <MetallicButton size="lg" className="px-12 py-6 text-lg group">
                            Começar Agora
                            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </MetallicButton>

                        <button className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white font-manrope font-medium hover:bg-white/10 transition-[background-color] duration-150 flex items-center justify-center gap-2 group">
                            <span className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center group-hover:bg-brand/30 transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-brand ml-0.5">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </span>
                            Ver Demo (1:30)
                        </button>
                    </div>
                </motion.div>

                {/* Floating Glass Panels (Mockup Abstract) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ delay: 0.5, duration: 1.2, type: "spring" }}
                    className="mt-20 relative w-full max-w-5xl aspect-[16/9] perspective-1000"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1B3B34] via-transparent to-transparent z-20 pointer-events-none h-full w-full bottom-0"></div>

                    <div className="relative z-10 w-full h-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden group hover:border-brand/30 transition-colors duration-500">
                        {/* Mockup Header */}
                        <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>

                        {/* Inner Content Placeholder - Replace with actual dashboard screenshot later */}
                        <div className="p-8 grid grid-cols-3 gap-6 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="col-span-2 h-64 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 animate-pulse"></div>
                            <div className="col-span-1 h-64 rounded-xl bg-gradient-to-bl from-brand/10 to-transparent border border-brand/10"></div>
                            <div className="col-span-1 h-40 rounded-xl bg-white/5"></div>
                            <div className="col-span-2 h-40 rounded-xl bg-white/5"></div>
                        </div>

                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-brand/50 shadow-[0_0_20px_rgba(197,160,89,0.5)] animate-scan"></div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
