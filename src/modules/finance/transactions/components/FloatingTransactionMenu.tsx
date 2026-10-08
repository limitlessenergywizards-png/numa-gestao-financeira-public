'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FloatingTransactionMenuProps {
  onNewEntry: () => void;
  onNewExit: () => void;
  disabled?: boolean;
}

export function FloatingTransactionMenu({
  onNewEntry,
  onNewExit,
  disabled = false,
}: FloatingTransactionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNewEntry = () => {
    setIsOpen(false);
    onNewEntry();
  };

  const handleNewExit = () => {
    setIsOpen(false);
    onNewExit();
  };

  if (disabled) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed bottom-20 right-4 sm:bottom-6 sm:right-6",
        "z-[100] flex flex-col items-end gap-3",
        "md:hidden" // Hide completely on desktop
      )}
    >
      {/* Menu Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-2"
          >
            {/* Nova Entrada */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Button
                onClick={handleNewEntry}
                variant="success"
                size="lg"
                className="shadow-lg shadow-success/30 hover:shadow-xl hover:shadow-success/40 transition-[transform,box-shadow] group"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Nova Entrada</span>
                <span className="sm:hidden">Entrada</span>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white/20 text-white border-0 text-[10px] px-1.5 hidden md:inline-flex"
                >
                  ⌘D
                </Badge>
              </Button>
            </motion.div>

            {/* Nova Saída */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Button
                onClick={handleNewExit}
                variant="destructive"
                size="lg"
                className="shadow-lg shadow-destructive/30 hover:shadow-xl hover:shadow-destructive/40 transition-[transform,box-shadow] group"
              >
                <TrendingDown className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Nova Saída</span>
                <span className="sm:hidden">Saída</span>
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white/20 text-white border-0 text-[10px] px-1.5 hidden md:inline-flex"
                >
                  ⌘S
                </Badge>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          aria-label={isOpen ? "Fechar menu" : "Adicionar transação"}
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-[transform,box-shadow] duration-300",
            "bg-numa-gold hover:bg-gold-300 text-numa-deep",
            "hover:shadow-2xl hover:shadow-numa-gold/40",
            isOpen && "rotate-45 bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Glow effect */}
      {!isOpen && (
        <motion.div
          className="absolute bottom-0 right-0 h-14 w-14 rounded-full bg-numa-gold/30 blur-xl -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </div>
  );
}
