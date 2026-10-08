'use client';

import { useRef } from "react";
import { type MotionProps, m, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollRevealProps extends Omit<MotionProps, "children"> {
    children: React.ReactNode;
    className?: string;
    direction?: "up" | "down" | "left" | "right" | "none";
    distance?: number;
    delay?: number;
    duration?: number;
    blur?: boolean;
    viewportMargin?: string;
    once?: boolean;
    staggerChildren?: number;
}

export const ScrollReveal = ({
    children,
    className,
    direction = "up",
    distance = 30,
    delay = 0,
    duration = 0.5,
    blur = false,
    viewportMargin = "-10%",
    once = true,
    staggerChildren = 0,
    ...props
}: ScrollRevealProps) => {
    const ref = useRef(null);

    const getInitialPosition = () => {
        switch (direction) {
            case "up": return { y: distance };
            case "down": return { y: -distance };
            case "left": return { x: distance };
            case "right": return { x: -distance };
            case "none": return {};
            default: return { y: distance };
        }
    };

    const initial = {
        opacity: 0,
        filter: blur ? "blur(10px)" : "blur(0px)",
        ...getInitialPosition(),
    };

    const animate = {
        opacity: 1,
        y: 0,
        x: 0,
        filter: "blur(0px)",
        transition: {
            duration,
            delay,
            ease: [0.21, 0.47, 0.32, 0.98] as any, // "Liquid" ease
            staggerChildren,
        },
    };

    return (
        <m.div
            ref={ref}
            initial={initial}
            whileInView={animate}
            viewport={{ once, margin: viewportMargin as any }}
            className={cn(className)}
            {...props}
        >
            {children}
        </m.div>
    );
};
