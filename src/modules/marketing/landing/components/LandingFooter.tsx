'use client';

import Link from "next/link";
import { Logo } from "@/components/shared";
import { PUBLIC_ROUTES, LEGAL_ROUTES } from "@/lib/routes";

export function LandingFooter() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#132925] border-t border-[#C5A059]/10">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <Logo size="default" showText={false} variant="icon" linkTo={PUBLIC_ROUTES.LANDING} />
            </div>
            <p className="text-numa-light/50 text-sm mb-4">
              Antecipe. Proteja. Conduza.
            </p>
            <p className="text-numa-light/40 text-xs">
              Inteligência estratégica para suas finanças empresariais.
            </p>
          </div>

          {/* Produto */}
          <div>
            <h4 className="font-montserrat font-bold text-numa-light mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  Funcionalidades
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  Planos
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("faq")}
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-montserrat font-bold text-numa-light mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:suporte@numa.com.br"
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@numa.com.br"
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  Contato
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-montserrat font-bold text-numa-light mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={LEGAL_ROUTES.TERMS}
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  href={LEGAL_ROUTES.PRIVACY}
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href={LEGAL_ROUTES.LGPD}
                  className="text-numa-light/60 hover:text-numa-gold transition-colors"
                >
                  LGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-numa-gold/10 mt-12 pt-8 text-center text-sm text-numa-light/40">
          <p>
            © {new Date().getFullYear()} Numa Gestão Financeira. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
