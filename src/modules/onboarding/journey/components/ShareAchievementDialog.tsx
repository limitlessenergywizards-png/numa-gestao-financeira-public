'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Achievement } from '@/modules/onboarding/services/achievementDefinitions';
import { Twitter, Linkedin, MessageCircle, Copy, Check, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { REPORT_ROUTES } from '@/lib/routes';

interface ShareAchievementDialogProps {
  achievement: Achievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareAchievementDialog({
  achievement,
  open,
  onOpenChange,
}: ShareAchievementDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!achievement) return null;

  const appUrl = window.location.origin;
  const shareText = `🏆 Conquista Desbloqueada!\n\nEu acabei de desbloquear "${achievement.name}" no Guardião Financeiro!\n\n${achievement.description}\n\n+${achievement.xpReward} XP ganhos!\n\n#GuardiaoFinanceiro #GamificacaoFinanceira`;
  const shareUrl = `${appUrl}${REPORT_ROUTES.JOURNEY}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = [
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'bg-black hover:bg-black/80 text-white',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0A66C2] hover:bg-[#0A66C2]/80 text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#25D366]/80 text-white',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success('Copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const handleShare = async (url: string) => {
    // Try native share first on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Conquista: ${achievement.name}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to link if share was cancelled
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discipline': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'growth': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'consistency': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'mastery': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'special': return 'bg-pink-500/10 text-pink-600 border-pink-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Conquista
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Achievement Preview Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <motion.div
                  className="text-6xl mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    delay: 0.1,
                  }}
                >
                  {achievement.icon}
                </motion.div>
                <h3 className="font-bold text-lg mb-2">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {achievement.description}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Badge
                    variant="outline"
                    className={getCategoryColor(achievement.category)}
                  >
                    {achievement.category}
                  </Badge>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                    +{achievement.xpReward} XP
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Compartilhar em:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {shareLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      className={`w-full flex flex-col h-auto py-3 gap-1 ${link.color}`}
                      onClick={() => handleShare(link.url)}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="text-xs">{link.name}</span>
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Copy Link Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Texto
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
