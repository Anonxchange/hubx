
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
    <div className="flex items-center justify-center space-x-2 mt-8 mb-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      >
        Prev
      </Button>
      
      {/* Page Numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          onClick={() => handlePageChange(page)}
          className={`w-12 h-12 text-lg font-semibold rounded-lg ${
            currentPage === page
              ? 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600'
              : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {page}
        </Button>
      ))}
      
      {/* Next Button */}
      <Button
        variant="outline"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-orange-500 border-orange-400 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
      >
        Next
      </Button>
    </div>
  );
};

export default ImageStylePagination;
