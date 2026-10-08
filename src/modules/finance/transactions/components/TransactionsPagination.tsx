'use client';

/**
 * TransactionsPagination Component
 * 
 * Componente de paginação otimizado.
 */

import { memo, useMemo, useCallback } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface TransactionsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const TransactionsPagination = memo(function TransactionsPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: TransactionsPaginationProps) {
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let startPage = 1;
    if (totalPages > maxVisible) {
      if (currentPage > 3) {
        startPage = currentPage - 2;
      }
      if (startPage + maxVisible - 1 > totalPages) {
        startPage = totalPages - maxVisible + 1;
      }
    }
    
    for (let i = 0; i < Math.min(maxVisible, totalPages); i++) {
      pages.push(startPage + i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const handlePrevious = useCallback(() => {
    onPageChange(Math.max(1, currentPage - 1));
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  }, [currentPage, totalPages, onPageChange]);

  const handlePageClick = useCallback((page: number) => {
    onPageChange(page);
  }, [onPageChange]);

  return (
    <div className="flex items-center justify-between p-4 border-t">
      <p className="text-sm text-muted-foreground">
        Mostrando {startItem}-{endItem} de {totalItems} movimentações
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={handlePrevious}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          {pageNumbers.map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                onClick={() => handlePageClick(pageNum)}
                isActive={currentPage === pageNum}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext 
              onClick={handleNext}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
});

export default TransactionsPagination;
