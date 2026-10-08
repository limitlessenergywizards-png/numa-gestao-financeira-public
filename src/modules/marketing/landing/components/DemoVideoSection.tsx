'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import { Play, Monitor } from "lucide-react";

export function DemoVideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Placeholder video URL - replace with actual demo video
  const videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#0D1233]">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-chess-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-chess-teal/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-numa-gold font-montserrat font-semibold uppercase tracking-wider text-sm">
            Demonstração
          </span>
          <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-numa-light mt-4 mb-4">
            Veja a Numa em ação
          </h2>
          <p className="text-numa-light/60 text-lg max-w-2xl mx-auto">
            Descubra como dominar suas finanças com inteligência estratégica
          </p>
        </motion.div>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Browser-like frame */}
          <div className="bg-numa-deep/50 border border-numa-gold/20 rounded-2xl p-2 shadow-2xl shadow-numa-gold/10">
            {/* Browser chrome */}
            <div className="bg-numa-deep/80 rounded-t-xl px-4 py-3 flex items-center gap-3 border-b border-numa-gold/10">
              {/* Traffic lights */}
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              {/* URL bar */}
              <div className="flex-1 flex justify-center">
                <div className="bg-numa-deep/60 rounded-lg px-4 py-1.5 flex items-center gap-2 text-xs text-numa-light/50">
                  <Monitor className="h-3 w-3" />
                  <span>app.numa.finance/dashboard</span>
                </div>
              </div>
            </div>

            {/* Video area */}
            <div className="relative aspect-video rounded-b-xl overflow-hidden bg-numa-deep">
              {isPlaying ? (
                <iframe
                  src={`${videoUrl}?autoplay=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  {/* Placeholder/Thumbnail */}
                  <div className="absolute inset-0 bg-gradient-to-br from-numa-deep via-[#0D1233] to-numa-deep">
                    {/* Simulated dashboard preview */}
                    <div className="absolute inset-4 md:inset-8 rounded-lg border border-numa-gold/10 bg-numa-deep/50 overflow-hidden">
                      {/* Dashboard mockup elements */}
                      <div className="p-4 space-y-4">
                        {/* Header bar */}
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-numa-gold/20" />
                          <div className="flex-1 h-3 bg-numa-light/10 rounded" />
                          <div className="w-20 h-3 bg-numa-gold/30 rounded" />
                        </div>
                        
                        {/* KPI cards */}
                        <div className="grid grid-cols-4 gap-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 md:h-20 rounded-lg bg-numa-light/5 border border-numa-gold/10" />
                          ))}
                        </div>
                        
                        {/* Chart area */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 h-32 md:h-40 rounded-lg bg-numa-light/5 border border-numa-gold/10" />
                          <div className="h-32 md:h-40 rounded-lg bg-numa-light/5 border border-numa-gold/10" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Play button overlay */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                    onClick={() => setIsPlaying(true)}
                    whileHover="hover"
                  >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-numa-deep/40 group-hover:bg-numa-deep/30 transition-colors" />
                    
                    {/* Play button */}
                    <motion.div
                      className="relative"
                      variants={{
                        hover: { scale: 1.1 }
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Glow ring */}
                      <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-numa-gold/30 blur-xl animate-pulse" />
                      
                      {/* Button */}
                      <div className="relative w-20 h-20 md:w-24 md:h-24 bg-numa-gold rounded-full flex items-center justify-center shadow-lg shadow-numa-gold/40">
                        <Play className="h-8 w-8 md:h-10 md:w-10 text-numa-deep ml-1" fill="currentColor" />
                      </div>
                    </motion.div>

                    {/* Text */}
                    <motion.p
                      className="absolute bottom-8 text-numa-light/80 text-sm font-medium"
                      initial={{ opacity: 0.7 }}
                      whileHover={{ opacity: 1 }}
                    >
                      Clique para assistir
                    </motion.p>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
