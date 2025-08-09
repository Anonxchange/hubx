import React from "react";
import { useOptimizedVideos } from "@/hooks/useOptimizedVideos";
import CategoryFilter from "@/components/CategoryFilter";
import OptimizedVideoGrid from "@/components/OptimizedVideoGrid";
import AdComponent from "@/components/AdComponent";
import { ImageStylePagination } from "@/components/ImageStylePagination";
import { Loader2, AlertCircle, LayoutGrid, List } from "lucide-react";

export default function RecommendedPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("recommended");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  const { data, isLoading, error } = useOptimizedVideos(
    currentPage,
    60,
    selectedCategory
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with category title */}
      <header className="border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold capitalize">
              {selectedCategory === "recommended" ? "Recommended Videos" : selectedCategory}
            </h1>
            <p className="text-muted-foreground">
              Discover the best picks tailored for you
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid" ? "bg-primary text-white" : "bg-muted"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${
                viewMode === "list" ? "bg-primary text-white" : "bg-muted"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="container mx-auto px-4 py-4">
        <CategoryFilter
          activeFilter={selectedCategory}
          onFilterChange={handleCategoryChange}
        />
      </div>

      {/* Ads */}
      <div className="container mx-auto px-4">
        <AdComponent zoneId="5660536" />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex justify-center items-center py-20 text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          Failed to load videos.
        </div>
      )}

      {/* Videos */}
      {data && data.videos && (
        <div className="container mx-auto px-4 py-6">
          <OptimizedVideoGrid
            videos={data.videos}
            viewMode={viewMode}
            showAds={true}
          />

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="mt-8">
              <ImageStylePagination
                currentPage={currentPage}
                totalPages={data.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecommendedPage;