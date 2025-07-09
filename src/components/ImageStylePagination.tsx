
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
    <div className="flex flex-col items-center space-y-4 mt-12 mb-12 p-6 bg-card/50 rounded-lg border">
      {/* Page Info */}
      <div className="text-center text-sm text-muted-foreground">
        Showing page {currentPage} of {totalPages}
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-center space-x-2">
        {/* First Page Button */}
        {currentPage > 2 && (
          <>
            <Button
              variant="outline"
              onClick={() => handlePageChange(1)}
              className="px-3 py-2"
            >
              1
            </Button>
            {currentPage > 3 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}
        
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>
        
        {/* Page Numbers */}
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            onClick={() => handlePageChange(page)}
            className={`w-12 h-12 text-lg font-semibold ${
              currentPage === page 
                ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20' 
                : 'hover:bg-muted'
            }`}
          >
            {page}
          </Button>
        ))}
        
        {/* Next Button */}
        <Button
          variant="default"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary hover:bg-primary/90"
        >
          Next
        </Button>
        
        {/* Last Page Button */}
        {currentPage < totalPages - 1 && (
          <>
            {currentPage < totalPages - 2 && <span className="px-2 text-muted-foreground">...</span>}
            <Button
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>
      
      {/* Quick Navigation */}
      <div className="flex items-center space-x-4 text-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          ← First
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          Last →
        </Button>
      </div>
    </div>
  );
};

export default ImageStylePagination;
