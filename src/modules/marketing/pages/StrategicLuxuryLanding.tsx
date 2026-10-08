'use client';

import { motion } from "framer-motion";
import { LANDING_VARIANTS } from "@/data/landingVariants";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/routes";

export default function StrategicLuxuryLanding() {
    const router = useRouter();
    const { hero, features, testimonials } = LANDING_VARIANTS.luxury;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-amber-500/30">
            {/* Navbar Minimalista */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-slate-950">N</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">Numa <span className="text-amber-500">Gold</span></span>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-slate-300 hover:text-white hover:bg-white/5"
                        onClick={() => router.push(PUBLIC_ROUTES.AUTH)}
                    >
                        Entrar
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-50 mix-blend-screen" />
                    <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl opacity-30 mix-blend-screen" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium tracking-wider uppercase mb-6">
                            {hero.badge}
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
                            {hero.title}
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            {hero.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                size="lg"
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-amber-900/20 w-full sm:w-auto"
                                onClick={() => router.push(PUBLIC_ROUTES.AUTH)}
                            >
                                {hero.cta} <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8 h-14 text-lg w-full sm:w-auto"
                            >
                                Conhecer Detalhes
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-900/50 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12">
                        {features?.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="text-center group"
                            >
                                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:border-amber-500/30">
                                    <feature.icon className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">A escolha de quem lidera</h2>
                        <p className="text-slate-400">Junte-se a um grupo seleto de profissionais.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {testimonials?.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative"
                            >
                                <Quote className="absolute top-8 right-8 w-8 h-8 text-slate-800" />
                                <div className="flex items-center gap-1 mb-6 text-amber-500">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-lg text-slate-300 mb-6 italic relative z-10">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-800"
                                    />
                                    <div>
                                        <div className="font-semibold text-white">{testimonial.name}</div>
                                        <div className="text-sm text-slate-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Simple */}
            <footer className="py-12 border-t border-white/5 text-center text-slate-600 text-sm">
                <p>&copy; {new Date().getFullYear()} Numa Gestão Financeira. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
