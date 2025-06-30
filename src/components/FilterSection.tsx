
import React from 'react';
import { Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterSectionProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  viewMode,
  setViewMode
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Category:</span>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Sort:</span>
          <Badge variant="secondary">Newest</Badge>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">View:</span>
        <div className="flex items-center space-x-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
