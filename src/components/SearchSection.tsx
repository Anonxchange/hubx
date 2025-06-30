
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface SearchSectionProps {
  tempSearch: string;
  setTempSearch: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({ 
  tempSearch, 
  setTempSearch, 
  onSearch 
}) => {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-4">
        <form onSubmit={onSearch} className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search videos..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchSection;
