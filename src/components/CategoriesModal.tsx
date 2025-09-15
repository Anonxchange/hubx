
import React from 'react';
import { Link } from 'react-router-dom';
import { X, Crown } from 'lucide-react';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Use the same categories data from AllCategoriesPage
  const categories = [
    { name: '18-25', count: 216799, slug: '18-25', thumbnail: '/IMG_0089.jpeg' },
    { name: '60FPS', count: 126219, slug: '60fps', thumbnail: '/IMG_0196.jpeg' },
    { name: 'Amateur', count: 389865, slug: 'amateur', thumbnail: '/IMG_0112.jpeg' },
    { name: 'Anal', count: 110348, slug: 'anal', thumbnail: '/IMG_0111.jpeg' },
    { name: 'Arab', count: 20917, slug: 'arab', thumbnail: '/IMG_0113.jpeg' },
    { name: 'Asian', count: 54773, slug: 'asian', thumbnail: '/IMG_0090.jpeg' },
    { name: 'Babe', count: 235985, slug: 'babe', thumbnail: '/IMG_0114.jpeg' },
    { name: 'Babysitter (18+)', count: 14559, slug: 'babysitter', thumbnail: '/IMG_0115.jpeg' },
    { name: 'BBW', count: 43799, slug: 'bbw', thumbnail: '/IMG_0107.jpeg'},
    { name: 'Behind The Scenes', count: 6904, slug: 'behind-the-scenes', thumbnail: '/IMG_0116.jpeg'},
    { name: 'Big Ass', count: 205560, slug: 'big-ass', thumbnail: '/IMG_0117.jpeg' },
    { name: 'Big Dick', count: 138800, slug: 'big-dick', thumbnail: '/IMG_0118.jpeg' },
    { name: 'Big Tits', count: 243680, slug: 'big-tits', thumbnail: '/IMG_0092.jpeg' },
    { name: 'Blonde', count: 121631, slug: 'blonde', thumbnail: '/IMG_0119.jpeg' },
    { name: 'Blowjob', count: 182890, slug: 'blowjob', thumbnail: '/IMG_0120.jpeg' },
    { name: 'Bondage', count: 18942, slug: 'bondage', thumbnail: '/IMG_0122.jpeg' },
    { name: 'Brazilian', count: 17585, slug: 'brazilian', thumbnail: '/IMG_0123.jpeg' },
    { name: 'British', count: 18058, slug: 'british', thumbnail: '/IMG_0124.jpeg' },
    { name: 'Brunette', count: 162967, slug: 'brunette', thumbnail: '/IMG_0125.jpeg' },
    { name: 'Cartoon', count: 42117, slug: 'cartoon', thumbnail: '/IMG_0126.jpeg' },
    { name: 'Casting', count: 11172, slug: 'casting', thumbnail: '/IMG_0127.jpeg' },
    { name: 'College (18+)', count: 32984, slug: 'college', thumbnail: '/IMG_0128.jpeg' },
    { name: 'Compilation', count: 22668, slug: 'compilation', thumbnail: '/IMG_0130.jpeg' },
    { name: 'Cosplay', count: 21260, slug: 'cosplay', thumbnail: '/IMG_0131.jpeg' },
    { name: 'Creampie', count: 92037, slug: 'creampie', thumbnail: '/IMG_0099.jpeg' },
    { name: 'Cumshot', count: 138509, slug: 'cumshot', thumbnail: '/IMG_0133.jpeg' },
    { name: 'Czech', count: 9626, slug: 'czech', thumbnail: '/IMG_0134.jpeg' },
    { name: 'Double Penetration', count: 16068, slug: 'double-penetration', thumbnail: '/IMG_0135.jpeg' },
    { name: 'Ebony', count: 35386, slug: 'ebony', thumbnail: '/IMG_0098.jpeg' },
    { name: 'Euro', count: 3747, slug: 'euro', thumbnail: '/IMG_0136.jpeg' },
    { name: 'Exclusive', count: 318551, slug: 'exclusive', thumbnail: '/IMG_0138.jpeg' },
    { name: 'Feet', count: 28704, slug: 'feet', thumbnail: '/IMG_0137.jpeg' },
    { name: 'Female Orgasm', count: 135043, slug: 'female-orgasm', thumbnail: '/IMG_0103.jpeg' },
    { name: 'Fetish', count: 122539, slug: 'fetish', thumbnail: '/IMG_0139.jpeg' },
    { name: 'Fingering', count: 9365, slug: 'fingering', thumbnail: '/IMG_0140.jpeg' },
    { name: 'Fisting', count: 11586, slug: 'fisting', thumbnail: '/IMG_0141.jpeg' },
    { name: 'French', count: 14398, slug: 'french', thumbnail: '/IMG_0142.jpeg' },
    { name: 'Funny', count: 769, slug: 'funny', thumbnail: '/IMG_0143.jpeg' },
    { name: 'Gaming', count: 5826, slug: 'gaming', thumbnail: '/IMG_0144.jpeg' },
    { name: 'Gangbang', count: 8743, slug: 'gangbang', thumbnail: '/IMG_0145.jpeg' },
    { name: 'German', count: 15338, slug: 'german', thumbnail: '/IMG_0146.jpeg' },
    { name: 'Handjob', count: 56927, slug: 'handjob', thumbnail: '/IMG_0147.jpeg' },
    { name: 'Hardcore', count: 179073, slug: 'hardcore', thumbnail: '/IMG_0095.jpeg' },
    { name: 'HD Porn', count: 826013, slug: 'hd', thumbnail: '/IMG_0109.jpeg' },
    { name: 'Hentai', count: 18659, slug: 'hentai', thumbnail: '/IMG_0100.jpeg' },
    { name: 'Indian', count: 13143, slug: 'indian', thumbnail: '/IMG_0149.jpeg'},
    { name: 'Interactive', count: 252, slug: 'interactive', thumbnail: '/IMG_0150.jpeg' },
    { name: 'Interracial', count: 31129, slug: 'interracial', thumbnail: '/IMG_0194.jpeg'},
    { name: 'Italian', count: 12990, slug: 'italian', thumbnail: '/IMG_0151.jpeg'},
    { name: 'Japanese', count: 30425, slug: 'japanese', thumbnail: '/IMG_0152.jpeg'},
    { name: 'Korean', count: 4156, slug: 'korean', thumbnail: '/IMG_0153.jpeg'},
    { name: 'Latina', count: 91869, slug: 'latina', thumbnail: '/IMG_0154.jpeg' },
    { name: 'Lesbian', count: 38408, slug: 'lesbian', thumbnail: '/IMG_0106.jpeg'},
    { name: 'Massage', count: 35134, slug: 'massage',thumbnail: '/IMG_0155.jpeg'},
    { name: 'Masturbation', count: 151411, slug: 'masturbation', thumbnail: '/IMG_0102.jpeg' },
    { name: 'Mature', count: 33108, slug: 'mature', thumbnail: '/IMG_0156.jpeg'},
    { name: 'MILF', count: 154267, slug: 'milf', thumbnail: '/IMG_0096.jpeg' },
    { name: 'Music', count: 9123, slug: 'music', thumbnail: '/IMG_0157.jpeg' },
    { name: 'Muscular Men', count: 12818, slug: 'muscular-men', thumbnail: '/IMG_0158.jpeg' },
    { name: 'Old/Young (18+)', count: 35731, slug: 'old-young', thumbnail: '/IMG_0093.jpeg' },
    { name: 'Orgy', count: 10076, slug: 'orgy', thumbnail: '/IMG_0159.jpeg' },
    { name: 'Parody', count: 10315, slug: 'parody', thumbnail: '/IMG_0161.jpeg' },
    { name: 'Party', count: 6516, slug: 'party', thumbnail: '/IMG_0110.jpeg' },
    { name: 'Pissing', count: 17815, slug: 'pissing', thumbnail: '/IMG_0162.jpeg'},
    { name: 'Podcast', count: 656, slug: 'podcast', thumbnail: '/IMG_0163.jpeg' },
    { name: 'Popular With Women', count: 41110, slug: 'popular-with-women', thumbnail: '/IMG_0164.jpeg' },
    { name: 'Pornstar', count: 174991, slug: 'pornstar', thumbnail: '/IMG_0165.jpeg' },
    { name: 'POV', count: 127714, slug: 'pov', thumbnail: '/IMG_0166.jpeg'},
    { name: 'Public', count: 39702, slug: 'public', thumbnail: '/IMG_0101.jpeg' },
    { name: 'Pussy Licking', count: 53543, slug: 'pussy-licking', thumbnail: '/IMG_0167.jpeg' },
    { name: 'Reality', count: 73567, slug: 'reality', thumbnail: '/IMG_0168.jpeg' },
    { name: 'Red Head', count: 35134, slug: 'redhead', thumbnail: '/IMG_0169.jpeg'},
    { name: 'Role Play', count: 43266, slug: 'role-play', thumbnail: '/IMG_0170.jpeg'},
    { name: 'Romantic', count: 30674, slug: 'romantic', thumbnail: '/IMG_0171.jpeg' },
    { name: 'Rough Sex', count: 68257, slug: 'rough-sex', thumbnail: '/IMG_0172.jpeg'},
    { name: 'Russian', count: 29842, slug: 'russian', thumbnail: '/IMG_0173.jpeg' },
    { name: 'School (18+)', count: 19777, slug: 'school', thumbnail: '/IMG_0104.jpeg' },
    { name: 'SFW', count: 1464, slug: 'sfw', thumbnail: '/IMG_0174.jpeg'},
    { name: 'Small Tits', count: 108302, slug: 'small-tits', thumbnail: '/IMG_0175.jpeg'},
    { name: 'Smoking', count: 10655, slug: 'smoking', thumbnail: '/IMG_0176.jpeg'},
    { name: 'Solo Female', count: 216769, slug: 'solo-female', thumbnail: '/IMG_0177.jpeg'},
    { name: 'Solo Male', count: 6881, slug: 'solo-male', thumbnail: '/IMG_0178.jpeg'},
    { name: 'Squirt', count: 45828, slug: 'squirt', thumbnail: '/IMG_0179.jpeg'},
    { name: 'Step Fantasy', count: 72348, slug: 'step-fantasy', thumbnail: '/IMG_0180.jpeg'},
    { name: 'Strap On', count: 4457, slug: 'strap-on', thumbnail: '/IMG_0181.jpeg'},
    { name: 'Striptease', count: 3568, slug: 'striptease', thumbnail: '/IMG_0182.jpeg'},
    { name: 'Tattooed Women', count: 49445, slug: 'tattooed-women', thumbnail: '/IMG_0195.jpeg' },
    { name: 'Threesome', count: 36443, slug: 'threesome', thumbnail: '/IMG_0183.jpeg'},
    { name: 'Toys', count: 100695, slug: 'toys', thumbnail: '/IMG_0184.jpeg'},
    { name: 'Transgender', count: 29405, slug: 'transgender', thumbnail: '/IMG_0185.jpeg'},
    { name: 'Verified Amateurs', count: 545713, slug: 'verified-amateurs', thumbnail: '/IMG_0188.jpeg'},
    { name: 'Verified Couples', count: 54026, slug: 'verified-couples', thumbnail: '/IMG_0187.jpeg'},
    { name: 'Verified Models', count: 41110, slug: 'verified-models', thumbnail: '/IMG_0186.jpeg' },
    { name: 'Vintage', count: 2698, slug: 'vintage', thumbnail: '/IMG_0190.jpeg'},
    { name: 'Virtual Reality', count: 3939, slug: 'virtual-reality', thumbnail: '/IMG_0191.jpeg'},
    { name: 'Webcam', count: 18664, slug: 'webcam', thumbnail: '/IMG_0192.jpeg'}
  ];

  const formatCount = (count: number) => {
    return count.toLocaleString();
  };

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/premium/category/${category.slug}`}
                onClick={onClose}
                className="group"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-800 border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                  {/* Category thumbnail */}
                  {category.thumbnail ? (
                    <img
                      src={category.thumbnail}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 via-gray-600/40 to-gray-800/60" />
                  )}

                  {/* Category Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-yellow-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-300">
                      {formatCount(category.count)} Videos
                    </p>
                  </div>

                  {/* Premium Crown Badge */}
                  <div className="absolute top-2 right-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            ))}
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
