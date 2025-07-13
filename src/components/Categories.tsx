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
    <div className="bg-gray-800 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-8 md:space-x-16">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.name}
                to={category.path}
                className="flex flex-col items-center space-y-2 group transition-all hover:scale-105"
              >
                <div className={`p-4 rounded-lg bg-gray-700 group-hover:bg-gray-600 transition-colors ${category.color}`}>
                  <IconComponent className="w-8 h-8" />
                </div>
                <span className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors">
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