'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function UpdatePrompt() {
  const { isUpdateAvailable, skipWaiting } = useServiceWorker();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) {
      // Show prompt after a short delay to not interrupt initial load
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isUpdateAvailable]);

  const handleUpdate = () => {
    setIsUpdating(true);
    skipWaiting();
    // The page will reload automatically when the new SW takes control
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-[100]"
        >
          <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            {/* Gradient accent */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">
                    Nova versão disponível
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uma nova versão do aplicativo está pronta. Atualize para ter acesso às últimas melhorias.
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  disabled={isUpdating}
                >
                  Depois
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Atualizar agora
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
