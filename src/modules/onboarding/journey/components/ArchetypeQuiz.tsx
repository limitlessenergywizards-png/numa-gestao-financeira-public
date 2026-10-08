'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QUIZ_QUESTIONS, calculateArchetype, ARCHETYPES } from '@/modules/onboarding/services/personalityAnalyzer';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArchetypeQuizProps {
  onComplete: (
    archetypeId: string,
    scores: Record<string, number>,
    answers: { questionId: string; optionIndex: number }[]
  ) => void;
  onCancel?: () => void;
}

export function ArchetypeQuiz({ onComplete, onCancel }: ArchetypeQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; optionIndex: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedArchetype, setRevealedArchetype] = useState<string | null>(null);

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const newAnswers = [
      ...answers,
      { questionId: question.id, optionIndex: selectedOption }
    ];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz complete - reveal archetype
      const result = calculateArchetype(newAnswers);
      setRevealedArchetype(result.primary);
      setIsRevealing(true);

      // Wait for reveal animation then complete
      setTimeout(() => {
        onComplete(result.primary, result.scores, newAnswers);
      }, 3000);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      const prevAnswer = answers[currentQuestion - 1];
      setSelectedOption(prevAnswer?.optionIndex ?? null);
      setAnswers(answers.slice(0, -1));
    }
  };

  if (isRevealing && revealedArchetype) {
    const archetype = ARCHETYPES[revealedArchetype];
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[500px] flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
          className="text-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-8xl mb-6"
          >
            {archetype.icon}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className={cn(
              "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
              archetype.gradient
            )}>
              {archetype.name}
            </h2>
            <p className="text-muted-foreground mt-2 italic">
              "{archetype.phrase}"
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Preparando sua jornada...</span>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Pergunta {currentQuestion + 1} de {QUIZ_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-6">
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <Card
                key={index}
                className={cn(
                  "cursor-pointer transition-[border-color,box-shadow,background-color] duration-200",
                  selectedOption === index
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => handleOptionSelect(index)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    selectedOption === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option.text}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="ghost"
          onClick={currentQuestion === 0 ? onCancel : handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentQuestion === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={selectedOption === null}
          className="gap-2"
        >
          {currentQuestion === QUIZ_QUESTIONS.length - 1 ? 'Descobrir' : 'Próxima'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
