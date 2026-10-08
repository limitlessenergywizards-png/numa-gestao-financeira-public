'use client';

import { useParams, useRouter } from "next/navigation";
import { LANDING_VARIANTS, isValidSegment, LandingSegment } from "@/data/landingVariants";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { LandingHeader, FeaturesSection, TestimonialsSection, FAQSection, PricingSection, CTASection, LandingFooter } from "@/modules/marketing/landing/components";
import { PUBLIC_ROUTES } from "@/lib/routes";

export default function SegmentedLandingPage() {
  const { segment } = useParams<{ segment: string }>();
  const router = useRouter();

  // Validate segment or fallback to default
  const activeSegment: LandingSegment = (segment && isValidSegment(segment))
    ? (segment as LandingSegment)
    : 'default';

  // Determine content based on the active segment
  // LANDING_VARIANTS.segments is the record
  const content = LANDING_VARIANTS.segments[activeSegment];
  const Icon = content.icon;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand/20">
      <LandingHeader />

      {/* Dynamic Hero */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-medium text-sm mb-6"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {content.hero.badge}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                {content.hero.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0"
              >
                {content.hero.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Button
                  className="bg-brand hover:bg-brand-dark text-white rounded-full px-8 h-12 w-full sm:w-auto shadow-lg shadow-brand/20"
                  onClick={() => router.push(PUBLIC_ROUTES.AUTH)}
                >
                  {content.hero.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </div>

            {/* Visual Representation (Abstract or Mockup) */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-full">
              <div className="relative z-10 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
                {/* Pain Points Card */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-4">
                    Desafios que resolvemos para você:
                  </h3>
                  {content.painPoints?.map((point, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                      className="flex items-start gap-3 text-slate-600"
                    >
                      <div className="mt-1 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      </div>
                      <span>{point}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Solution Teaser */}
                <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 -mx-8 -mb-8 p-8 rounded-b-3xl">
                  <div className="flex items-center gap-3 text-brand font-medium">
                    <Check className="w-5 h-5" />
                    <span>Solução automatizada pelo Numa</span>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/10 rounded-full blur-3xl z-0" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Features Section */}
      {content.features && (
        <FeaturesSection
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features={content.features as any}
          title="Funcionalidades Especializadas"
          subtitle="Tudo que você precisa para gerenciar suas finanças com tranquilidade."
        />
      )}

      {/* Dynamic Testimonials Section */}
      {content.testimonials && (
        <TestimonialsSection
          testimonials={content.testimonials.map(t => ({
            quote: t.content,
            author: t.name,
            role: t.role,
            avatar: t.avatar,
            company: t.company,
            rating: t.rating || 5, // Default to 5 if not provided
            metric: t.metric
          }))}
          title="Quem usa, recomenda"
          subtitle="Veja como transformamos a gestão financeira de outros profissionais."
        />
      )}

      {/* Pricing Section - Standard */}
      <PricingSection />

      {/* Dynamic FAQ Section */}
      {content.faqs && (
        <FAQSection faqs={content.faqs} />
      )}

      {/* CTA Section */}
      <CTASection />

      <LandingFooter />
    </div>
  );
}