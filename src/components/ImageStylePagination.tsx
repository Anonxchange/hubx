
import React from 'react';
import { Button } from '@/components/ui/button';

interface ImageStylePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme?: 'purple' | 'yellow';
}

const ImageStylePagination: React.FC<ImageStylePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  theme = 'purple',
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

  // Theme-based colors
  const colors = {
    purple: {
      active: 'bg-purple-500 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/20',
      next: 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20'
    },
    yellow: {
      active: 'bg-yellow-500 text-black border-2 border-yellow-400 shadow-lg shadow-yellow-500/20',
      next: 'bg-yellow-500 text-black hover:bg-yellow-600 shadow-lg shadow-yellow-500/20'
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 my-8 px-4 w-full">
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-bold transition-all flex-shrink-0 text-sm sm:text-base
          ${currentPage === 1 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
            : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}
        `}
      >
        Prev
      </button>
      
      {/* Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`
              w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-sm sm:text-lg transition-all flex-shrink-0
              ${currentPage === page 
                ? colors[theme].active
                : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}
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
          px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-bold transition-all flex-shrink-0 text-sm sm:text-base
          ${currentPage === totalPages 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50' 
            : colors[theme].next}
        `}
      >
        Next
      </button>
    </div>
  );
};

export default ImageStylePagination;
