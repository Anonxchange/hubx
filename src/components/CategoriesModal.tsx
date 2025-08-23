
import React from 'react';
import { Link } from 'react-router-dom';
import { X, Video, Heart, Users, Gamepad2, Book, Music, Sparkles, Crown, Zap, Camera, Globe, Star } from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [
    { name: 'Amateur', icon: Video, color: 'text-blue-400', path: '/premium/category/amateur' },
    { name: 'Anal', icon: Heart, color: 'text-red-400', path: '/premium/category/anal' },
    { name: 'Asian', icon: Globe, color: 'text-green-400', path: '/premium/category/asian' },
    { name: 'BBW', icon: Users, color: 'text-purple-400', path: '/premium/category/bbw' },
    { name: 'Big Ass', icon: Sparkles, color: 'text-pink-400', path: '/premium/category/big-ass' },
    { name: 'Big Tits', icon: Crown, color: 'text-yellow-400', path: '/premium/category/big-tits' },
    { name: 'Blonde', icon: Star, color: 'text-amber-400', path: '/premium/category/blonde' },
    { name: 'Blowjob', icon: Zap, color: 'text-cyan-400', path: '/premium/category/blowjob' },
    { name: 'Brunette', icon: Music, color: 'text-orange-400', path: '/premium/category/brunette' },
    { name: 'Creampie', icon: Camera, color: 'text-indigo-400', path: '/premium/category/creampie' },
    { name: 'Ebony', icon: Book, color: 'text-teal-400', path: '/premium/category/ebony' },
    { name: 'Hardcore', icon: Gamepad2, color: 'text-red-500', path: '/premium/category/hardcore' },
    { name: 'Latina', icon: Heart, color: 'text-rose-400', path: '/premium/category/latina' },
    { name: 'MILF', icon: Crown, color: 'text-violet-400', path: '/premium/category/milf' },
    { name: 'POV', icon: Camera, color: 'text-emerald-400', path: '/premium/category/pov' },
    { name: 'Teen', icon: Sparkles, color: 'text-lime-400', path: '/premium/category/teen' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Premium Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={category.name}
                  to={category.path}
                  onClick={onClose}
                  className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200 hover:scale-105 group"
                >
                  <div className={`p-3 rounded-lg bg-gray-900 group-hover:bg-gray-800 transition-colors ${category.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-white text-center whitespace-nowrap">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-400">
            Explore premium content in your favorite categories
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoriesModal;
