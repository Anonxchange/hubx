import React, { useState, useEffect } from "react";
import { Brain, Target, TrendingUp, MapPin, Clock, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OptimizedVideoGrid from "@/components/OptimizedVideoGrid";
import AdComponent from "@/components/AdComponent";
import ImageStylePagination from "@/components/ImageStylePagination";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecommendedVideos } from "@/services/videosService";
import type { Video } from "@/services/videosService";

const RecommendedPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videosPerPage = 60;

  // Check if user is logged in (you can implement actual auth check)
  const userId = localStorage.getItem('user_id') || undefined;
  const isLoggedIn = !!userId;

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getRecommendedVideos(currentPage, videosPerPage, userId);
      setVideos(result.videos);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentPage, userId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll up on page change
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Ad Banner */}
        <AdComponent zoneId="5660534" />

        {/* Page Title and Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold">
              {isLoggedIn ? 'Recommended For You' : 'Discover Videos'}
            </h1>
          </div>
          
          {totalCount > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span>{totalCount.toLocaleString()} personalized recommendations</span>
              <div className="flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Based on your activity</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span>Popular in your region</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recommendation Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isLoggedIn ? (
              <>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Heart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Your Preferences</p>
                      <p className="text-sm text-muted-foreground">Based on your likes & views</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Brain className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Smart Discovery</p>
                      <p className="text-sm text-muted-foreground">New content you'll love</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Fresh Content</p>
                      <p className="text-sm text-muted-foreground">Recent uploads prioritized</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Trending Now</p>
                      <p className="text-sm text-muted-foreground">Popular worldwide</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Local Favorites</p>
                      <p className="text-sm text-muted-foreground">Popular in your area</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-medium">Smart Mix</p>
                      <p className="text-sm text-muted-foreground">Curated variety</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              {isLoggedIn ? 'Personalizing your recommendations...' : 'Finding great videos for you...'}
            </span>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive font-medium">Error loading recommendations</p>
                <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Videos Grid */}
        {videos.length > 0 ? (
          <OptimizedVideoGrid videos={videos} />
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <Card>
                <CardContent className="p-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No recommendations available</p>
                  <p className="text-muted-foreground mt-2">
                    {isLoggedIn 
                      ? 'Try watching some videos to help us learn your preferences'
                      : 'Check back later for personalized recommendations'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <ImageStylePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RecommendedPage;