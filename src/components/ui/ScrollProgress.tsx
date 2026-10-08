'use client';

import { useEffect, useState } from "react";
import { m, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export const ScrollProgress = ({ className }: { className?: string }) => {
    const scaleX = useSpring(0, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        const container = document.getElementById("main-scroll-container");
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const scrollRange = scrollHeight - clientHeight;
            const progress = scrollRange > 0 ? scrollTop / scrollRange : 0;
            scaleX.set(progress);
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Init

        return () => container.removeEventListener("scroll", handleScroll);
    }, [scaleX]);

    return (
        <m.div
            className={cn("fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left", className)}
            style={{ scaleX }}
        />
    );
};
