import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface CategoryData {
  name: string;
  count: number;
  slug: string;
  thumbnail?: string;
}

const AllCategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Sample categories data - you can replace this with actual API call
  const sampleCategories: CategoryData[] = [
    { name: '18-25', count: 216799, slug: '18-25', thumbnail: '/18-25-thumbnail.jpeg' },
    { name: '60FPS', count: 126219, slug: '60fps' },
    { name: 'Amateur', count: 389865, slug: 'amateur' },
    { name: 'Anal', count: 110348, slug: 'anal' },
    { name: 'Arab', count: 20917, slug: 'arab' },
    { name: 'Asian', count: 54773, slug: 'asian', thumbnail: '/asian-thumbnail.jpeg' },
    { name: 'Babe', count: 235985, slug: 'babe' },
    { name: 'Babysitter (18+)', count: 14559, slug: 'babysitter' },
    { name: 'BBW', count: 43799, slug: 'bbw' },
    { name: 'Behind The Scenes', count: 6904, slug: 'behind-the-scenes' },
    { name: 'Big Ass', count: 205560, slug: 'big-ass', thumbnail: '/big-ass-thumbnail.jpeg' },
    { name: 'Big Dick', count: 138800, slug: 'big-dick' },
    { name: 'Big Tits', count: 243680, slug: 'big-tits', thumbnail: '/big-tits-thumbnail.jpeg' },
    { name: 'Blonde', count: 121631, slug: 'blonde' },
    { name: 'Blowjob', count: 182890, slug: 'blowjob' },
    { name: 'Bondage', count: 18942, slug: 'bondage' },
    { name: 'Brazilian', count: 17585, slug: 'brazilian' },
    { name: 'British', count: 18058, slug: 'british' },
    { name: 'Brunette', count: 162967, slug: 'brunette' },
    { name: 'Cartoon', count: 42117, slug: 'cartoon' },
    { name: 'Casting', count: 11172, slug: 'casting' },
    { name: 'College (18+)', count: 32984, slug: 'college' },
    { name: 'Compilation', count: 22668, slug: 'compilation' },
    { name: 'Cosplay', count: 21260, slug: 'cosplay' },
    { name: 'Creampie', count: 92037, slug: 'creampie' },
    { name: 'Cumshot', count: 138509, slug: 'cumshot', thumbnail: '/cumshot-thumbnail.jpeg' },
    { name: 'Czech', count: 9626, slug: 'czech' },
    { name: 'Double Penetration', count: 16068, slug: 'double-penetration' },
    { name: 'Ebony', count: 35386, slug: 'ebony', thumbnail: '/ebony-thumbnail.jpeg' },
    { name: 'Euro', count: 3747, slug: 'euro' },
    { name: 'Exclusive', count: 318551, slug: 'exclusive' },
    { name: 'Feet', count: 28704, slug: 'feet' },
    { name: 'Female Orgasm', count: 135043, slug: 'female-orgasm' },
    { name: 'Fetish', count: 122539, slug: 'fetish' },
    { name: 'Fingering', count: 9365, slug: 'fingering' },
    { name: 'Fisting', count: 11586, slug: 'fisting' },
    { name: 'French', count: 14398, slug: 'french' },
    { name: 'Funny', count: 769, slug: 'funny' },
    { name: 'Gaming', count: 5826, slug: 'gaming' },
    { name: 'Gangbang', count: 8743, slug: 'gangbang', thumbnail: '/gangbang-thumbnail.jpeg' },
    { name: 'German', count: 15338, slug: 'german' },
    { name: 'Handjob', count: 56927, slug: 'handjob' },
    { name: 'Hardcore', count: 179073, slug: 'hardcore', thumbnail: '/hardcore-thumbnail.jpeg' },
    { name: 'HD Porn', count: 826013, slug: 'hd' },
    { name: 'Hentai', count: 18659, slug: 'hentai' },
    { name: 'Indian', count: 13143, slug: 'indian' },
    { name: 'Interactive', count: 252, slug: 'interactive' },
    { name: 'Interracial', count: 31129, slug: 'interracial' },
    { name: 'Italian', count: 12990, slug: 'italian' },
    { name: 'Japanese', count: 30425, slug: 'japanese' },
    { name: 'Korean', count: 4156, slug: 'korean' },
    { name: 'Latina', count: 91869, slug: 'latina', thumbnail: '/latina-thumbnail.jpeg' },
    { name: 'Lesbian', count: 38408, slug: 'lesbian' },
    { name: 'Massage', count: 35134, slug: 'massage' },
    { name: 'Masturbation', count: 151411, slug: 'masturbation' },
    { name: 'Mature', count: 33108, slug: 'mature' },
    { name: 'MILF', count: 154267, slug: 'milf', thumbnail: '/milf-thumbnail.jpeg' },
    { name: 'Music', count: 9123, slug: 'music' },
    { name: 'Muscular Men', count: 12818, slug: 'muscular-men' },
    { name: 'Old/Young (18+)', count: 35731, slug: 'old-young', thumbnail: '/old-young-thumbnail.jpeg' },
    { name: 'Orgy', count: 10076, slug: 'orgy' },
    { name: 'Parody', count: 10315, slug: 'parody' },
    { name: 'Party', count: 6516, slug: 'party' },
    { name: 'Pissing', count: 17815, slug: 'pissing' },
    { name: 'Podcast', count: 656, slug: 'podcast' },
    { name: 'Popular With Women', count: 41110, slug: 'popular-with-women' },
    { name: 'Pornstar', count: 174991, slug: 'pornstar' },
    { name: 'POV', count: 127714, slug: 'pov' },
    { name: 'Public', count: 39702, slug: 'public' },
    { name: 'Pussy Licking', count: 53543, slug: 'pussy-licking' },
    { name: 'Reality', count: 73567, slug: 'reality' },
    { name: 'Red Head', count: 35134, slug: 'redhead' },
    { name: 'Role Play', count: 43266, slug: 'role-play' },
    { name: 'Romantic', count: 30674, slug: 'romantic' },
    { name: 'Rough Sex', count: 68257, slug: 'rough-sex' },
    { name: 'Russian', count: 29842, slug: 'russian' },
    { name: 'School (18+)', count: 19777, slug: 'school' },
    { name: 'SFW', count: 1464, slug: 'sfw' },
    { name: 'Small Tits', count: 108302, slug: 'small-tits' },
    { name: 'Smoking', count: 10655, slug: 'smoking' },
    { name: 'Solo Female', count: 216769, slug: 'solo-female' },
    { name: 'Solo Male', count: 6881, slug: 'solo-male' },
    { name: 'Squirt', count: 45828, slug: 'squirt' },
    { name: 'Step Fantasy', count: 72348, slug: 'step-fantasy' },
    { name: 'Strap On', count: 4457, slug: 'strap-on' },
    { name: 'Striptease', count: 3568, slug: 'striptease' },
    { name: 'Tattooed Women', count: 49445, slug: 'tattooed-women' },
    { name: 'Threesome', count: 36443, slug: 'threesome' },
    { name: 'Toys', count: 100695, slug: 'toys' },
    { name: 'Transgender', count: 29405, slug: 'transgender' },
    { name: 'Verified Amateurs', count: 545713, slug: 'verified-amateurs' },
    { name: 'Verified Couples', count: 54026, slug: 'verified-couples' },
    { name: 'Verified Models', count: 41110, slug: 'verified-models' },
    { name: 'Vintage', count: 2698, slug: 'vintage' },
    { name: 'Virtual Reality', count: 3939, slug: 'virtual-reality' },
    { name: 'Webcam', count: 18664, slug: 'webcam' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCategories(sampleCategories);
      setFilteredCategories(sampleCategories);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const formatCount = (count: number) => {
    return count.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="text-xl">Loading categories...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Ad Component */}
        <AdComponent zoneId="5660534" />

        {/* Header and Search */}
        <div className="space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold">All Categories</h1>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search Categories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          <div className="flex gap-2 items-center">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold">
              All
            </button>
            <button className="px-4 py-2 bg-card text-muted-foreground rounded-lg font-bold hover:bg-muted transition-colors">
              Gay
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredCategories.map((category) => (
            <Link
              key={category.slug}
              to={`/category/${category.slug}`}
              className="group"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-card border border-border hover:border-primary transition-all duration-300">
                {/* Category thumbnail or placeholder background */}
                {category.thumbnail ? (
                  <img
                    src={category.thumbnail}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-muted/40 to-muted/60" />
                )}

                {/* Category Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary-foreground transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-300">
                    {formatCount(category.count)} Videos
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No categories found for "{searchQuery}"
            </p>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default AllCategoriesPage;