'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared";
import { PUBLIC_ROUTES } from "@/lib/routes";


export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);

  // Use requestAnimationFrame for smooth, jank-free scroll updates
  // This approach avoids React state updates entirely for the visual transition
  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const progress = Math.min(window.scrollY / 50, 1);
      if (bgRef.current) {
        bgRef.current.style.opacity = String(progress);
      }
      if (borderRef.current) {
        borderRef.current.style.opacity = String(progress);
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Set initial state
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Funcionalidades", id: "features" },
    { label: "Planos", id: "pricing" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
          >
      {/* 
        Glass background layer — always present in DOM, visibility controlled by opacity.
        backdrop-filter is NOT being toggled, just the opacity of this layer.
        This avoids layout recalculations and expensive CSS class swaps.
      */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          opacity: 0,
          background: "rgba(17, 25, 22, 0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(107, 166, 115, 0.15)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(143, 191, 122, 0.1)",
          willChange: "opacity",
        }}
      >
        {/* Inner gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(143, 191, 122, 0.08) 0%, transparent 50%, rgba(61, 122, 82, 0.05) 100%)",
          }}
        />
      </div>

      {/* Top specular highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-metallic-300/20 to-transparent z-10" />

      {/* Bottom gradient border — fades in on scroll */}
      <div
        ref={borderRef}
        className="absolute inset-x-0 bottom-0 h-px pointer-events-none z-10"
        style={{ opacity: 0, willChange: "opacity" }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-metallic-400/30 to-transparent animate-spotlight"
          style={{ backgroundSize: "200% 100%" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Logo size="xlarge" showText={true} variant="full" linkTo={PUBLIC_ROUTES.LANDING} />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="relative px-4 py-2 text-sm font-medium text-metallic-100/70 hover:text-metallic-200 transition-colors group"
              >
                <span className="relative z-10">{link.label}</span>
                {/* Hover glass background */}
                <span className="absolute inset-0 rounded-lg bg-metallic-600/0 group-hover:bg-metallic-600/20 opacity-0 group-hover:opacity-100 transition-[background-color,opacity] duration-300" />
                {/* Hover bottom glow */}
                <span className="absolute bottom-0 left-1/4 right-1/4 h-px bg-metallic-400/0 group-hover:bg-metallic-400/50 transition-[background-color] duration-300" />
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">




            <Link href={PUBLIC_ROUTES.AUTH}>
              <Button
                variant="ghost"
                className="relative text-sm text-metallic-100/80 hover:text-metallic-200 hover:bg-metallic-600/20 border border-transparent hover:border-metallic-600/30 transition-colors duration-150"
              >
                Entrar
              </Button>
            </Link>
            <Link href={`${PUBLIC_ROUTES.AUTH}?tab=signup`}>
              <Button className="relative overflow-hidden bg-metallic-shine text-dark-base hover:opacity-90 transition-[color,background-color,opacity] shadow-metallic-md font-montserrat font-semibold border border-metallic-300/30 group">
                {/* Shimmer effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Começar Agora</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative p-2 text-metallic-100 rounded-lg hover:bg-metallic-600/20 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu with Glass Effect */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="bg-dark-surface/95 backdrop-blur-2xl border-t border-metallic-600/20">
              {/* Inner glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-b from-metallic-500/5 to-transparent pointer-events-none" />

              <nav className="container mx-auto px-4 py-4 flex flex-col gap-2 relative z-10">
                {navLinks.map((link, index) => (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => scrollToSection(link.id)}
                    className="text-left py-3 px-4 text-metallic-100/80 hover:text-metallic-200 hover:bg-metallic-600/20 rounded-lg transition-colors"
                  >
                    {link.label}
                  </motion.button>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-metallic-600/20">
                  <Link href={PUBLIC_ROUTES.AUTH} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-metallic-500/50 text-metallic-200 hover:bg-metallic-600/20">
                      Entrar
                    </Button>
                  </Link>
                  <Link href={`${PUBLIC_ROUTES.AUTH}?tab=signup`} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-metallic-shine text-dark-base hover:opacity-90 font-montserrat font-semibold shadow-metallic-md">
                      Começar Agora
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
