'use client';

import { useEffect, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const container = document.getElementById("main-scroll-container");
        if (!container) return;

        const handleScroll = () => {
            // Show after 2 screens (approx 200vh) or just 500px for better UX
            if (container.scrollTop > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        const lenis = (window as any).lenis;
        if (lenis) {
            lenis.scrollTo(0);
        } else {
            const container = document.getElementById("main-scroll-container");
            container?.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <m.div
                    className="fixed bottom-8 right-8 z-50 md:hidden"
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Button
                        size="icon"
                        className="rounded-full shadow-lg bg-primary/90 hover:bg-primary backdrop-blur-sm h-12 w-12"
                        onClick={scrollToTop}
                    >
                        <ArrowUp className="h-6 w-6" />
                    </Button>
                </m.div>
            )}
        </AnimatePresence>
    );
};
