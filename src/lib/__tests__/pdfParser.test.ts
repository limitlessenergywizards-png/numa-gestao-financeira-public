import { describe, it, expect, vi } from 'vitest';

// Mock pdfjs-dist to avoid bundling issues
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  version: '0.0.0',
  getDocument: vi.fn(),
}));

vi.mock('../ofxParser', () => ({
  cleanDescription: (desc: string) => desc.trim(),
}));

import { isValidPDFFile } from '../pdfParser';

// ================================================================
// isValidPDFFile()
// ================================================================
describe('isValidPDFFile()', () => {
  it('.pdf → true', () => {
    expect(isValidPDFFile(new File([''], 'doc.pdf'))).toBe(true);
  });

  it('.PDF uppercase → true', () => {
    expect(isValidPDFFile(new File([''], 'DOC.PDF'))).toBe(true);
  });

  it('.Pdf mixed case → true', () => {
    expect(isValidPDFFile(new File([''], 'Doc.Pdf'))).toBe(true);
  });

  it('.txt → false', () => {
    expect(isValidPDFFile(new File([''], 'doc.txt'))).toBe(false);
  });

  it('.docx → false', () => {
    expect(isValidPDFFile(new File([''], 'doc.docx'))).toBe(false);
  });

  it('.csv → false', () => {
    expect(isValidPDFFile(new File([''], 'data.csv'))).toBe(false);
  });

  it('no extension → false', () => {
    expect(isValidPDFFile(new File([''], 'document'))).toBe(false);
  });

  it('filename with multiple dots → checks last extension', () => {
    expect(isValidPDFFile(new File([''], 'my.doc.v2.pdf'))).toBe(true);
  });
});
