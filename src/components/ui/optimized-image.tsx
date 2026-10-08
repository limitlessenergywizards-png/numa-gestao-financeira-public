'use client';

import { useState, ImgHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  showErrorIcon?: boolean;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      className,
      alt,
      src,
      fallback,
      showErrorIcon = true,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoaded(true);
      onLoad?.(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setHasError(true);
      onError?.(e);
    };

    if (hasError) {
      if (fallback) {
        return <>{fallback}</>;
      }

      if (showErrorIcon) {
        return (
          <div
            className={cn(
              "flex items-center justify-center bg-muted rounded",
              className
            )}
            style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
          >
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          </div>
        );
      }

      return null;
    }

    return (
      <div className={cn("relative", className)}>
        {/* Skeleton placeholder */}
        {!isLoaded && (
          <Skeleton
            className={cn("absolute inset-0 rounded", className)}
          />
        )}

        {/* Actual image */}
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

export { OptimizedImage };
