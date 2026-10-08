'use client';

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface SmartHeaderProps {
    children: React.ReactNode;
    className?: string;
    scrollContainerId?: string;
}

export const SmartHeader = ({
    children,
    className,
    scrollContainerId = "main-scroll-container"
}: SmartHeaderProps) => {
    const [isHidden, setIsHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const container = document.getElementById(scrollContainerId);

        if (!container) return;

        const handleScroll = () => {
            const currentScrollY = container.scrollTop;
            const direction = currentScrollY > lastScrollY.current ? "down" : "up";

            // Only hide if we've scrolled past a threshold (e.g., 100px)
            if (currentScrollY > 100) {
                if (direction === "down" && !isHidden) {
                    setIsHidden(true);
                } else if (direction === "up" && isHidden) {
                    setIsHidden(false);
                }
            } else {
                // Always show if near top
                setIsHidden(false);
            }

            lastScrollY.current = currentScrollY;
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [isHidden, scrollContainerId]);

    return (
        <header
            className={cn(
                "sticky top-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                className
            )}
            style={{ transform: isHidden ? 'translateY(-100%)' : 'translateY(0)' }}
        >
            {children}
        </header>
    );
};
