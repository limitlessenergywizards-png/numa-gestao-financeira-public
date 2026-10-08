'use client';

import { motion, Variants } from "framer-motion";

export type ChessPiece = "queen" | "king" | "rook" | "knight" | "bishop" | "pawn";

interface ChessPieceSVGProps {
  piece: ChessPiece;
  className?: string;
  gradientColors?: [string, string];
  showLabel?: boolean;
}

// Nomes das peças em português
const pieceNames: Record<ChessPiece, string> = {
  queen: "Rainha",
  king: "Rei",
  rook: "Torre",
  knight: "Cavalo",
  bishop: "Bispo",
  pawn: "Peão"
};

// SVG paths baseados no padrão Staunton - peças clássicas de xadrez
const chessPiecePaths: Record<ChessPiece, { path: string; viewBox: string; fillRule?: "evenodd" | "nonzero" }> = {
  queen: {
    // Rainha com coroa de múltiplas pontas
    path: "M9 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm16 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-8-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-12 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm24 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM9 26c0-2 1.5-2 2.5-4 1 1.5 2.5 2.5 5.5 2.5s4.5-1 5.5-2.5c1 2 2.5 2 2.5 4H9zm7.5-19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM15 9.5c0 2-3.5 4-3.5 7.5l-.5 4h10l-.5-4c0-3.5-3.5-5.5-3.5-7.5 0 0-1-1-1-2.5s1-2.5 1-2.5h-2s1 1 1 2.5-1 2.5-1 2.5zM9 26c0 2 1.5 3 4 3.5V32h6v-2.5c2.5-.5 4-1.5 4-3.5H9zm6.5 6.5v3h1v-3h-1zM7 40c0 .5 1 1 3 1h12c2 0 3-.5 3-1v-2c0-.5-1-1-3-1H10c-2 0-3 .5-3 1v2z",
    viewBox: "0 0 32 45"
  },
  king: {
    // Rei com cruz no topo
    path: "M16 4v3M14.5 5.5h3M16 10c-2 0-3 2-3 3.5 0 2 1.5 3 3 4.5s3 2.5 3 4.5c0-2-1.5-2.5-3-4.5s-3-2.5-3-4.5c0-1.5 1-3.5 3-3.5zM9 26c0-2 1.5-2 2.5-4 1 1.5 2.5 2.5 5.5 2.5s4.5-1 5.5-2.5c1 2 2.5 2 2.5 4H9zM9 26c0 2 1.5 3 4 3.5V32h6v-2.5c2.5-.5 4-1.5 4-3.5H9zM7 40c0 .5 1 1 3 1h12c2 0 3-.5 3-1v-2c0-.5-1-1-3-1H10c-2 0-3 .5-3 1v2zm8.5-6.5v3h1v-3h-1z",
    viewBox: "0 0 32 45"
  },
  rook: {
    // Torre com ameias clássicas no topo
    path: "M7 7v3h3v3h-2v17h2v2h12v-2h2V13h-2v-3h3V7h-4v3h-2V7h-4v3h-2V7H7zm2 25v2h14v-2H9zm0 4v3h14v-3H9z",
    viewBox: "0 0 32 45"
  },
  knight: {
    // Cavalo em perfil - silhueta clássica
    path: "M22 10c-2-2-4-3-7-3-3 0-5 2-6 4l-2 3c-1 1-1 3 0 4l1 2c-.5.5-1.5 1-2 2-1 2-1 4 0 5l4 1v5h12v-5l2-3c1-2 1-4 0-6l-2-3V10zM10 17c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1zm-1 20v2h14v-2H9zm0 4v3h14v-3H9z",
    viewBox: "0 0 32 45"
  },
  bishop: {
    // Bispo com mitra e corte diagonal
    path: "M16 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 4c-2 0-3.5 2-3.5 4 0 1 .5 2 1.5 3l-4 9 1 1 3.5-2.5c.5.5 1 .5 1.5.5s1 0 1.5-.5L20 26l1-1-4-9c1-1 1.5-2 1.5-3 0-2-1.5-4-3.5-4zm-6 22h12s.5 2 .5 3-1 2-6.5 2-6.5-1-6.5-2 .5-3 .5-3zM9 37v2h14v-2H9zm0 4v3h14v-3H9z",
    viewBox: "0 0 32 45"
  },
  pawn: {
    // Peão simples com esfera no topo
    path: "M16 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-3 8c0-1 1-2 3-2s3 1 3 2v2c2 1 3 3 3 5h-12c0-2 1-4 3-5v-2zm-2 9h10s.5 2 .5 3-.5 2-5.5 2-5.5-1-5.5-2 .5-3 .5-3zM9 37v2h14v-2H9zm0 4v3h14v-3H9z",
    viewBox: "0 0 32 45"
  }
};

// Animation variants for each piece
const pieceAnimations: Record<ChessPiece, Variants> = {
  queen: {
    hover: { 
      rotate: [0, -8, 8, -4, 4, 0],
      scale: 1.15,
      transition: { duration: 0.6 }
    }
  },
  king: {
    hover: { 
      scale: 1.2,
      y: -2,
      transition: { duration: 0.3 }
    }
  },
  rook: {
    hover: { 
      y: [-2, 2, -2],
      scale: 1.1,
      transition: { duration: 0.4 }
    }
  },
  knight: {
    hover: { 
      rotate: [0, 15, -15, 0],
      x: [0, 2, -2, 0],
      scale: 1.15,
      transition: { duration: 0.5 }
    }
  },
  bishop: {
    hover: { 
      rotate: [0, 10, -10, 0],
      scale: 1.1,
      transition: { duration: 0.4 }
    }
  },
  pawn: {
    hover: { 
      y: -4,
      scale: 1.15,
      transition: { duration: 0.3 }
    }
  }
};

export function ChessPieceSVG({ 
  piece, 
  className = "w-8 h-8",
  gradientColors = ["#C8AA6E", "#B49659"],
  showLabel = false
}: ChessPieceSVGProps) {
  const { path, viewBox } = chessPiecePaths[piece];
  const animation = pieceAnimations[piece];
  const gradientId = `chess-gradient-${piece}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.svg
        viewBox={viewBox}
        className={className}
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        whileHover="hover"
        variants={animation}
        transition={{ duration: 0.3 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Shadow for depth */}
          <filter id={`shadow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor={gradientColors[1]} floodOpacity="0.3"/>
          </filter>
        </defs>
        
        <path
          d={path}
          fill={`url(#${gradientId})`}
          filter={`url(#glow-${gradientId})`}
          stroke={gradientColors[1]}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </motion.svg>
      
      {showLabel && (
        <span className="text-xs text-metallic-400 font-montserrat font-semibold uppercase tracking-[0.2em]">
          {pieceNames[piece]}
        </span>
      )}
    </div>
  );
}

// Preset gradient combinations for easy use
export const chessGradients: Record<string, [string, string]> = {
  greenTeal: ["#4A9D7C", "#2D8B9A"],
  tealBlue: ["#2D8B9A", "#1E5F8A"],
  goldBronze: ["#C8AA6E", "#B49659"],
  blueGreen: ["#1E5F8A", "#4A9D7C"],
};
