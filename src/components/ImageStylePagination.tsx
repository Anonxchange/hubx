
import React from 'react';
import { Button } from '@/components/ui/button';

interface ImageStylePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ImageStylePagination: React.FC<ImageStylePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getVisiblePages = () => {
    // Show 5 visible pages on both mobile and desktop
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 my-8 px-4 max-w-full overflow-x-auto">
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-bold text-white transition-all flex-shrink-0 text-sm sm:text-base
          ${currentPage === 1 
            ? 'bg-muted cursor-not-allowed opacity-50' 
            : 'bg-card hover:bg-muted border border-border'}
        `}
      >
        Prev
      </button>
      
      {/* Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full">
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-sm sm:text-lg transition-all flex-shrink-0
              ${currentPage === page 
                ? 'bg-primary text-primary-foreground border-2 border-primary shadow-lg shadow-primary/20' 
                : 'bg-card text-foreground hover:bg-muted border border-border'}
            `}
          >
            {page}
          </button>
        ))}
      </div>
      
      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-bold text-white transition-all flex-shrink-0 text-sm sm:text-base
          ${currentPage === totalPages 
            ? 'bg-muted cursor-not-allowed opacity-50' 
            : 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'}
        `}
      >
        Next
      </button>
    </div>
  );
};

export default ImageStylePagination;
