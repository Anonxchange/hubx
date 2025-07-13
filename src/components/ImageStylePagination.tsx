
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
    // Reduce visible pages on mobile to prevent overflow
    const maxVisible = window.innerWidth < 640 ? 3 : 5;
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
    <div className="flex items-center justify-center gap-2 my-8">
      {/* Previous Button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-4 py-3 rounded-lg font-bold text-white transition-all
          ${currentPage === 1 
            ? 'bg-gray-600 cursor-not-allowed opacity-50' 
            : 'bg-gray-700 hover:bg-gray-600'}
        `}
      >
        Prev
      </button>
      
      {/* Page Numbers */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={`
            w-12 h-12 rounded-lg font-bold text-lg transition-all
            ${currentPage === page 
              ? 'bg-orange-500 text-white border-2 border-orange-400 shadow-lg' 
              : 'bg-gray-700 text-white hover:bg-gray-600'}
          `}
        >
          {page}
        </button>
      ))}
      
      {/* Next Button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-4 py-3 rounded-lg font-bold text-white transition-all
          ${currentPage === totalPages 
            ? 'bg-gray-600 cursor-not-allowed opacity-50' 
            : 'bg-orange-500 hover:bg-orange-600'}
        `}
      >
        Next
      </button>
    </div>
  );
};

export default ImageStylePagination;
