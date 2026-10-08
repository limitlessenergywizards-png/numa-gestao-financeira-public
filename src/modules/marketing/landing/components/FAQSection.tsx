'use client';

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
  question: string;
  answer: string;
}

export const defaultFaqs: FAQItem[] = [
  {
    question: "Como a Numa ajuda a reduzir inadimplência?",
    answer:
      "O sistema envia alertas automáticos 7 dias antes do vencimento, mostra o histórico de pagamento de cada cliente (score), e te avisa quando um cliente com histórico de atraso está próximo de vencer. Assim você cobra antes, não depois.",
  },
  {
    question: "O sistema envia cobranças automáticas?",
    answer:
      "Sim! Você configura lembretes por email/WhatsApp que são enviados automaticamente antes e após o vencimento. Personalize a mensagem e a frequência.",
  },
  {
    question: "Como funcionam as recomendações de otimização?",
    answer:
      "Nossa IA analisa seus gastos, compara com benchmarks do mercado, identifica tendências e sugere ações concretas. Por exemplo: 'Seu custo com frete aumentou 23% enquanto a média do mercado é 8%'.",
  },
  {
    question: "Consigo ver a inadimplência por cliente?",
    answer:
      "Sim! O painel mostra aging (0-30, 31-60, 61-90, 90+ dias), valor devendo, histórico de atrasos e score de pagamento de cada cliente.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim! Você pode cancelar sua assinatura a qualquer momento, sem multa ou taxa de cancelamento. Sua conta permanecerá ativa até o fim do período já pago.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Absolutamente! Utilizamos criptografia de ponta a ponta, backups automáticos e infraestrutura de nuvem de alta disponibilidade. Seus dados estão protegidos.",
  },
  {
    question: "Quantas empresas posso cadastrar?",
    answer:
      "Depende do seu plano: Iniciante permite 1 empresa, Estrategista permite 3 empresas, e Mestre não tem limite de empresas.",
  },
  {
    question: "Vocês oferecem período de teste?",
    answer:
      "Oferecemos 3 dias grátis para testar todas as funcionalidades. Se não ficar satisfeito, devolvemos 100% do seu dinheiro sem perguntas.",
  },
];

interface FAQSectionProps {
  faqs?: FAQItem[];
  title?: React.ReactNode;
  subtitle?: string;
}

export function FAQSection({
  faqs = defaultFaqs,
  title,
  subtitle
}: FAQSectionProps) {
  return (
    <section id="faq" className="py-20 md:py-24 relative overflow-hidden bg-[#17322C]">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-numa-gold font-montserrat font-semibold uppercase tracking-wider text-sm">
            Dúvidas
          </span>
          {title || (
            <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-numa-light mt-4 mb-4">
              Perguntas Frequentes
            </h2>
          )}
          <p className="text-numa-light/60 text-lg max-w-2xl mx-auto">
            {subtitle || "Tire suas dúvidas sobre o Numa"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-[#C5A059]/20 rounded-xl px-6 bg-[#1B3B34]/50 backdrop-blur data-[state=open]:border-[#C5A059]/40"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 text-numa-light">
                  <span className="font-montserrat font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-numa-light/60 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
