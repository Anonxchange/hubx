import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface CategoryFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  'Featured Recently',
  'Most Viewed',
  'Top Rated',
  'Hottest',
  'Longest',
  'Newest'
];

const CategoryFilter = ({ activeFilter, onFilterChange }: CategoryFilterProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-2 p-1">
        {filters.map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            className="flex-shrink-0 whitespace-nowrap"
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default CategoryFilter;