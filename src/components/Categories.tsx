import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Layers, Image, User, Heart } from 'lucide-react';

const Categories = () => {
  const categories = [
    {
      name: 'Videos',
      icon: Video,
      path: '/',
      color: 'text-blue-400'
    },
    {
      name: 'Categories',
      icon: Layers,
      path: '/categories',
      color: 'text-green-400'
    },
    {
      name: 'GIFs',
      icon: Image,
      path: '/gifs',
      color: 'text-purple-400'
    },
    {
      name: 'Pornstars',
      icon: User,
      path: '/pornstars',
      color: 'text-pink-400'
    },
    {
      name: 'Gay',
      icon: Heart,
      path: '/gay',
      color: 'text-red-400'
    }
  ];

  return (
    <div className="bg-card/50 py-6 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-4 sm:space-x-8 md:space-x-16 overflow-x-auto px-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.name}
                to={category.path}
                className="flex flex-col items-center space-y-2 group transition-all hover:scale-105 flex-shrink-0"
              >
                <div className={`p-3 sm:p-4 rounded-lg bg-card group-hover:bg-muted transition-colors border border-border ${category.color}`}>
                  <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <span className="text-muted-foreground text-xs sm:text-sm font-medium group-hover:text-foreground transition-colors whitespace-nowrap">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Categories;