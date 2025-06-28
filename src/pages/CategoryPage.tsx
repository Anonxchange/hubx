
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  
  // Mock data for category videos
  const categoryVideos = [
    {
      id: '1',
      title: `${category} Content Video 1`,
      thumbnail: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=225&fit=crop',
      duration: '12:34',
      tags: [category || 'Category', 'HD', 'Premium'],
      views: 1234567,
      uploadDate: '2024-01-15',
      previewUrl: undefined
    },
    {
      id: '2',
      title: `${category} Content Video 2`,
      thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=225&fit=crop',
      duration: '8:45',
      tags: [category || 'Category', 'Popular', 'Featured'],
      views: 567890,
      uploadDate: '2024-01-14',
      previewUrl: undefined
    },
    // Add more mock videos as needed
  ];

  const videoCount = Math.floor(Math.random() * 100) + 20; // Mock count

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Category Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold capitalize mb-2">
                {category} Videos
              </h1>
              <p className="text-muted-foreground">
                {videoCount} videos in this category
              </p>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <VideoGrid 
          title=""
          videos={categoryVideos}
        />
      </main>
    </div>
  );
};

export default CategoryPage;
