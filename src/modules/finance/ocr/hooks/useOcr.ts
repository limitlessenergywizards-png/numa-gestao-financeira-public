'use client';

import { useState, useCallback } from 'react';
import type Tesseract from 'tesseract.js';
import {
  detectFileType,
  processPdf,
  processDocx,
  FileType
} from '@/modules/finance/ocr/services/documentProcessors';
import { extractDataFromText, ExtractedOcrData } from '@/modules/finance/ocr/services/ocrExtractors';
import { aiOcr } from '@/modules/finance/ocr/services/aiOcr';

export interface OcrData extends ExtractedOcrData {
  fileType?: FileType;
  pageCount?: number;
}

interface UseOcrReturn {
  processFile: (file: File) => Promise<OcrData>;
  isProcessing: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;
}

export function useOcr(): UseOcrReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateProgress = useCallback((value: number, message: string) => {
    setProgress(value);
    setProgressMessage(message);
  }, []);

  // Process single image with Tesseract (lazy loaded)
  const processImageWithOcr = useCallback(async (imageBlob: Blob): Promise<string> => {
    const TesseractModule = await import('tesseract.js');
    const TesseractLib = TesseractModule.default || TesseractModule;

    const worker = await TesseractLib.createWorker('por', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          const ocrProgress = 50 + (m.progress * 45);
          setProgress(Math.round(ocrProgress));
        }
      },
    });

    const { data: { text } } = await worker.recognize(imageBlob);
    await worker.terminate();

    return text;
  }, []);

  // Process multiple images and combine text (lazy loaded)
  const processMultipleImages = useCallback(async (images: Blob[]): Promise<string> => {
    const TesseractModule = await import('tesseract.js');
    const TesseractLib = TesseractModule.default || TesseractModule;

    const texts: string[] = [];

    for (let i = 0; i < images.length; i++) {
      updateProgress(
        50 + ((i / images.length) * 45),
        `Processando OCR Local - Página ${i + 1} de ${images.length}...`
      );

      const worker = await TesseractLib.createWorker('por', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            const baseProgress = 50 + ((i / images.length) * 45);
            const pageProgress = (m.progress * 45) / images.length;
            setProgress(Math.round(baseProgress + pageProgress));
          }
        },
      });

      const { data: { text } } = await worker.recognize(images[i]);
      await worker.terminate();

      texts.push(text);
    }

    return texts.join('\n\n--- Página ---\n\n');
  }, [updateProgress]);

  const processFile = useCallback(async (file: File): Promise<OcrData> => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Iniciando processamento...');
    setError(null);

    try {
      const fileType = detectFileType(file);

      if (fileType === 'unknown') {
        throw new Error('Tipo de arquivo não suportado. Use PNG, JPG, PDF ou DOCX.');
      }

      let extractedData: ExtractedOcrData | null = null;
      let pageCount = 1;

      if (fileType === 'pdf' || fileType === 'image') {
        let images: Blob[] = [];

        if (fileType === 'pdf') {
          updateProgress(5, 'Convertendo PDF para imagem...');
          images = await processPdf(file, updateProgress);
          pageCount = images.length;
        } else {
          images = [file];
        }

        let aiSuccess = false;

        // 1. Try Gemini Vision
        if (aiOcr.isGeminiConfigured() && images.length > 0) {
          try {
            updateProgress(50, 'Analisando documento com IA (Google Gemini)...');
            extractedData = await aiOcr.extractWithGemini(images);
            aiSuccess = true;
          } catch (e: any) {
            console.error("Gemini failed:", e);
          }
        }

        // 2. Try OpenAI Fallback
        if (!aiSuccess && aiOcr.isOpenAIConfigured() && images.length > 0) {
          try {
            updateProgress(50, 'Fallback: Analisando documento com ChatGPT (OpenAI)...');
            extractedData = await aiOcr.extractWithOpenAI(images);
            aiSuccess = true;
          } catch (e: any) {
            console.error("OpenAI failed:", e);
          }
        }

        // 3. Try Local Tesseract Fallback
        if (!aiSuccess) {
          updateProgress(50, 'Fallback: Iniciando reconhecimento de texto local (Tesseract)...');
          const text = await processMultipleImages(images);
          updateProgress(95, 'Extraindo dados locais...');
          extractedData = extractDataFromText(text);
        }

      } else if (fileType === 'docx') {
        updateProgress(10, 'Extraindo texto do documento...');
        const docResult = await processDocx(file, updateProgress);
        let text = docResult.text;

        // If DOCX has embedded images and no text, process images with AI
        if (!text.trim() && docResult.images.length > 0) {
          let aiSuccess = false;
          let images = docResult.images;

          if (aiOcr.isGeminiConfigured()) {
            try {
              updateProgress(50, 'Analisando imagens do Word com IA...');
              extractedData = await aiOcr.extractWithGemini(images);
              aiSuccess = true;
            } catch (e: any) { console.error(e); }
          }

          if (!aiSuccess && aiOcr.isOpenAIConfigured()) {
            try {
              updateProgress(50, 'Analisando imagens do Word com ChatGPT...');
              extractedData = await aiOcr.extractWithOpenAI(images);
              aiSuccess = true;
            } catch (e: any) { console.error(e); }
          }

          if (!aiSuccess) {
            updateProgress(50, 'Processando imagens locais (Tesseract)...');
            text = await processMultipleImages(images);
            extractedData = extractDataFromText(text);
          }
        } else {
          updateProgress(95, 'Analisando texto estruturado do Word...');
          extractedData = extractDataFromText(text);
        }
      }

      if (!extractedData) {
        throw new Error("Falha ao extrair dados do documento.");
      }

      updateProgress(100, 'Concluído!');

      return {
        ...extractedData,
        fileType,
        pageCount,
      };

    } catch (err: any) {
      let errorMessage = 'Não foi possível ler este documento. A imagem pode estar cortada, embaçada ou não contém dados financeiros.';

      if (err.message && err.message.toLowerCase().includes('api error')) {
        errorMessage = 'Serviço de inteligência indisponível no momento. Tente novamente em alguns instantes.';
      } else if (err.message) {
        // Keep the type invalidation clear, otherwise use the friendly fallback
        if (err.message.includes('Tipo de arquivo')) {
          errorMessage = err.message;
        } else {
          console.error('OCR Error:', err.message);
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProgressMessage('');
    }
  }, [updateProgress, processImageWithOcr, processMultipleImages]);

  return {
    processFile,
    isProcessing,
    progress,
    progressMessage,
    error
  };
}
