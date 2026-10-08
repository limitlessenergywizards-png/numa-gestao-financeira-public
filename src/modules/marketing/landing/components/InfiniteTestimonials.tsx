'use client';

import { motion } from "framer-motion";

const testimonials = [
    {
        quote: "Pela primeira vez tenho clareza total do meu lucro real. Não é apenas um software, é uma aula de gestão.",
        author: "Rafael M.",
        role: "CEO, TechFlow",
    },
    {
        quote: "O DRE automático mudou minha visão estratégica. Consigo antecipar problemas meses antes.",
        author: "Camila S.",
        role: "Diretora Financeira, Varejo Plus",
    },
    {
        quote: "A conciliação bancária que levava dias, agora faço em minutos. Tempo livre para focar no crescimento.",
        author: "Thiago L.",
        role: "Fundador, Agência Bold",
    },
    {
        quote: "Interface incrível, rápida e intuitiva. Finalmente um sistema financeiro que não parece dos anos 90.",
        author: "Ana P.",
        role: "CFO, Startup One",
    },
];

const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
    <div className="w-[400px] flex-shrink-0 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md mx-4 hover:border-brand/30 hover:bg-white/10 transition-colors duration-300 group">
        <div className="mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-brand/50 group-hover:text-brand transition-colors">
                <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91204 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
            </svg>
        </div>
        <p className="font-manrope text-lg text-gray-200 mb-6 leading-relaxed">"{quote}"</p>
        <div>
            <div className="font-syne font-bold text-white text-lg">{author}</div>
            <div className="font-manrope text-sm text-brand">{role}</div>
        </div>
    </div>
);

export const InfiniteTestimonials = () => {
    return (
        <section className="py-24 bg-[#1B3B34] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />

            <div className="mb-16 text-center px-4">
                <h2 className="font-syne font-bold text-3xl sm:text-4xl text-white">
                    A escolha de quem lidera
                </h2>
            </div>

            <div className="relative flex overflow-x-hidden">
                <div className="flex animate-scroll-x">
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <TestimonialCard key={i} {...t} />
                    ))}
                </div>
                <div className="flex animate-scroll-x" aria-hidden="true">
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <TestimonialCard key={`clone-${i}`} {...t} />
                    ))}
                </div>
            </div>

            {/* Gradient Masks for Seamless Edge */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#1B3B34] to-transparent z-10" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#1B3B34] to-transparent z-10" />
        </section>
    );
};
