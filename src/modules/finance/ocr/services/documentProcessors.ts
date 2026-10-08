// Document processors for PDF and DOCX files
// Libraries are dynamically imported for code splitting

const MAX_PDF_PAGES = 10;
const PDF_SCALE = 2; // 2x scale for better OCR quality

// Lazy load PDF.js only when needed
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

export interface ProcessedDocument {
  text: string;
  images: Blob[];
  pageCount?: number;
  fileType: 'pdf' | 'docx' | 'image';
}

export type FileType = 'pdf' | 'docx' | 'image' | 'unknown';

// Detect file type from File object
export const detectFileType = (file: File): FileType => {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return 'pdf';
  }
  
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return 'docx';
  }
  
  if (
    mimeType.startsWith('image/') ||
    /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(fileName)
  ) {
    return 'image';
  }
  
  return 'unknown';
};

// Process PDF file - render pages as images for OCR
export const processPdf = async (
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<Blob[]> => {
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress?.(5, 'Carregando PDF...');
  
  // Dynamic import of PDF.js
  const pdfjs = await getPdfLib();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
  
  const images: Blob[] = [];
  
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: PDF_SCALE });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png', 0.95);
    });
    
    images.push(blob);
    
    const progress = 5 + ((i / pageCount) * 45);
    onProgress?.(progress, `Processando página ${i} de ${pageCount}...`);
  }
  
  return images;
};

// Process DOCX file - extract text and images
export const processDocx = async (
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<ProcessedDocument> => {
  onProgress?.(10, 'Extraindo conteúdo do documento...');
  
  const arrayBuffer = await file.arrayBuffer();
  
  const images: Blob[] = [];
  
  // Dynamic import of mammoth
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  onProgress?.(50, 'Texto extraído com sucesso');
  
  return {
    text: result.value,
    images,
    fileType: 'docx',
  };
};

// Convert image File to Blob for consistent processing
export const processImage = async (
  file: File,
  onProgress?: (progress: number, message: string) => void
): Promise<Blob[]> => {
  onProgress?.(10, 'Preparando imagem...');
  
  // Return the file as-is since it's already an image
  return [file];
};

// Get file type icon based on type
export const getFileTypeIcon = (fileType: FileType): string => {
  switch (fileType) {
    case 'pdf':
      return 'file-text';
    case 'docx':
      return 'file-type';
    case 'image':
      return 'image';
    default:
      return 'file';
  }
};

// Get accepted file types string for input
export const getAcceptedFileTypes = (): string => {
  return [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].join(',');
};

// Get human-readable file types
export const getHumanReadableFileTypes = (): string[] => {
  return [
    'Imagens (PNG, JPG, JPEG, WebP)',
    'PDFs',
    'Documentos Word (DOCX)',
  ];
};
