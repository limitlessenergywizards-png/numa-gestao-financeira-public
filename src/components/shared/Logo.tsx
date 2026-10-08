import Link from "next/link";
import numaIconImport from "@/assets/numa-icon.png";
import { cn } from "@/lib/utils";

// Next.js image imports return { src, width, height }, Vite returns a string
const numaIconSrc = typeof numaIconImport === 'string' ? numaIconImport : numaIconImport.src;

interface LogoProps {
  size?: "small" | "default" | "large" | "xlarge" | "hero";
  showText?: boolean;
  variant?: "full" | "icon";
  linkTo?: string | null;
  className?: string;
}

const sizes = {
  small: {
    icon: "h-10 w-10",
    title: "text-lg",
    subtitle: "text-[10px]"
  },
  default: {
    icon: "h-14 w-14",
    title: "text-xl",
    subtitle: "text-xs"
  },
  large: {
    icon: "h-20 w-20",
    title: "text-3xl",
    subtitle: "text-sm"
  },
  xlarge: {
    icon: "h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-22 lg:w-22 xl:h-24 xl:w-24",
    title: "text-2xl sm:text-3xl md:text-4xl lg:text-4xl",
    subtitle: "text-xs sm:text-sm md:text-base lg:text-base"
  },
  hero: {
    icon: "h-32 w-32",
    title: "text-5xl",
    subtitle: "text-base"
  },
};

export function Logo({
  size = "default",
  showText = true,
  variant = "full",
  linkTo = "/",
  className
}: LogoProps) {
  const sizeConfig = sizes[size];

  const content = (
    <div className={cn("flex items-center gap-3 group", className)}>
      {/* Chess pieces icon */}
      <div className="relative">
        <img
          src={numaIconSrc}
          alt="Numa"
          className={cn(
            sizeConfig.icon,
            "rounded-lg object-contain transition-transform duration-200 group-hover:scale-105"
          )}
        />
        {/* Gold glow on hover */}
        <div className="absolute inset-0 rounded-lg bg-[#C5A059]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
      </div>

      {showText && variant === "full" && (
        <div className="flex flex-col">
          <span className={cn(
            "font-heading font-bold text-numa-light tracking-tight",
            sizeConfig.title
          )}>
            Numa
          </span>
          <span className={cn(
            "text-brand font-medium tracking-wider uppercase",
            sizeConfig.subtitle
          )}>
            Gestão Financeira
          </span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
