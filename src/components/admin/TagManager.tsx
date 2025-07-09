import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TagManagerProps {
  customTags: string[];
  newTag: string;
  onNewTagChange: (value: string) => void;
  onAddCustomTag: () => void;
  onRemoveCustomTag: (tag: string) => void;
  onAddPresetTag: (tag: string) => void;
}

const TagManager = ({
  customTags,
  newTag,
  onNewTagChange,
  onAddCustomTag,
  onRemoveCustomTag,
  onAddPresetTag
}: TagManagerProps) => {
  const presetTags = [
    'ebony', 'big-ass', 'cumshot', 'anal', 'lesbian', 'milf', 
    'japanese', 'hentai', 'amateur', 'hardcore', 'threesome', 
    'blonde', 'brunette', 'redhead', 'big-tits', 'petite'
  ];

  return (
    <div>
      <Label>Tags</Label>
      
      {/* Custom Tag Input */}
      <div className="flex items-center space-x-2 mt-2">
        <Input
          value={newTag}
          onChange={(e) => onNewTagChange(e.target.value)}
          placeholder="Add custom tag"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddCustomTag();
            }
          }}
        />
        <Button type="button" onClick={onAddCustomTag} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Preset Tags */}
      <div className="mt-3">
        <p className="text-sm text-muted-foreground mb-2">Quick add preset tags:</p>
        <div className="flex flex-wrap gap-2">
          {presetTags.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddPresetTag(tag)}
              disabled={customTags.includes(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Tags */}
      {customTags.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium mb-2">Selected tags:</p>
          <div className="flex flex-wrap gap-2">
            {customTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                <span>{tag}</span>
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onRemoveCustomTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;