import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationControlProps {
  currentPage: number;        // 1-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;         // Disable during loading
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false
}: PaginationControlProps) {
  // Generate page numbers with smart ellipsis logic
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For more than 7 pages, show smart ellipsis
    const pages: (number | 'ellipsis')[] = [];
    
    if (currentPage <= 4) {
      // Current page in first 4: 1 2 3 4 5 ... 10
      pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Current page in last 4: 1 ... 6 7 8 9 10
      pages.push(
        1,
        'ellipsis',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      // Current page in middle: 1 ... 4 5 6 ... 10
      pages.push(
        1,
        'ellipsis',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        'ellipsis',
        totalPages
      );
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (!disabled && page !== currentPage) {
      onPageChange(page);
    }
  };

  const isPreviousDisabled = currentPage === 1 || disabled;
  const isNextDisabled = currentPage === totalPages || disabled;

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={isPreviousDisabled}
        className={cn(
          'inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium',
          'border border-input bg-background',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isPreviousDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-muted hover:text-accent-foreground'
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>

      {/* Page Number Buttons */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex items-center justify-center h-9 w-9 text-sm text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={disabled}
              className={cn(
                'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-input bg-background hover:bg-muted hover:text-accent-foreground',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={`Page ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={isNextDisabled}
        className={cn(
          'inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium',
          'border border-input bg-background',
          'transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isNextDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-muted hover:text-accent-foreground'
        )}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
