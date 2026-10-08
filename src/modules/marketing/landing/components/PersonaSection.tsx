'use client';

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, TrendingUp, Building2, User2 } from "lucide-react";
import Link from "next/link";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { GlassmorphismCard } from "./GlassmorphismCard";

const personas = [
  {
    icon: User2,
    title: "Contadores/BPO Financeiro",
    subtitle: "Pare de apagar incêndios",
    description: "Seus clientes te ligam reclamando que não sabiam da inadimplência. Mude isso.",
    benefits: [
      "Relatório de inadimplência automático",
      "Alertas de cobrança para seus clientes",
      "Dashboard de saúde financeira por CNPJ",
    ],
    cta: "Ideal para escritórios",
    color: "from-emerald-400 to-emerald-600",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Building2,
    title: "Empresários",
    subtitle: "Cobre antes de ser cobrado",
    description: "Você não tem tempo para ficar ligando cobrando cliente. O sistema faz isso.",
    benefits: [
      "Lembretes automáticos pré-vencimento",
      "Score de pagamento por cliente",
      "Projeção realista de recebimento",
    ],
    cta: "Para donos de negócio",
    color: "from-[#C5A059] to-[#A98A4A]",
    iconBg: "bg-[#C5A059]/10",
    iconColor: "text-[#C5A059]",
    featured: true,
  },
  {
    icon: TrendingUp,
    title: "Gestores Financeiros",
    subtitle: "De dados para decisões",
    description: "Chega de relatórios bonitos que não dizem nada. Receba recomendações claras.",
    benefits: [
      "Insights de otimização de custos",
      "Análise de margem por cliente/produto",
      "Comparativo com benchmarks do mercado",
    ],
    cta: "Para CFOs e gestores",
    color: "from-sky-400 to-sky-600",
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
  },
];

export function PersonaSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#1B3B34]">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(197,160,89,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(197,160,89,0.1) 0%, transparent 50%)`
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-[#C5A059] font-montserrat font-semibold uppercase tracking-wider text-sm">
            Feito para você
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-montserrat font-bold text-[#E5E5E5] mt-4 mb-4">
            Para quem é a <span className="text-[#C5A059]">Numa</span>?
          </h2>
          <p className="text-[#E5E5E5]/60 text-lg max-w-2xl mx-auto">
            Cada perfil tem suas dores. Temos a solução para cada uma.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {personas.map((persona, index) => {
            const Icon = persona.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={persona.featured ? "md:-mt-4 md:mb-4" : ""}
              >
                <GlassmorphismCard
                  variant={persona.featured ? "elevated" : "default"}
                  className={`h-full p-6 md:p-8 ${persona.featured ? "ring-2 ring-[#C5A059]/30" : ""}`}
                  hoverEffect
                >
                  {/* Featured badge */}
                  {persona.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#C5A059] to-[#D6B879] text-[#1B3B34] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${persona.iconBg} flex items-center justify-center mb-6`}>
                    <Icon className={`h-7 w-7 ${persona.iconColor}`} />
                  </div>

                  {/* Header */}
                  <h3 className="text-xl font-montserrat font-bold text-[#E5E5E5] mb-1">
                    {persona.title}
                  </h3>
                  <p className={`text-sm font-semibold bg-gradient-to-r ${persona.color} bg-clip-text text-transparent mb-3`}>
                    {persona.subtitle}
                  </p>
                  <p className="text-[#E5E5E5]/60 text-sm mb-6">
                    {persona.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-3 mb-8">
                    {persona.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#E5E5E5]/80">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 flex-shrink-0 ${persona.iconColor}`} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={`${PUBLIC_ROUTES.AUTH}?tab=signup`} className="block">
                    <Button
                      variant={persona.featured ? "default" : "outline"}
                      className={`w-full group ${persona.featured
                        ? "bg-gradient-to-r from-[#C5A059] to-[#D6B879] text-[#1B3B34] hover:opacity-90 shadow-lg"
                        : "border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10"
                        }`}
                    >
                      {persona.cta}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </GlassmorphismCard>
              </motion.div>
            );
          })}
        </div>
      </div >
    </section >
  );
}
