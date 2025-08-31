import React, { useState, useCallback, memo } from 'react';
import { useMemoizedImages, useMemoizedSearch } from '../hooks/useMemoizedCalculations';
import OptimizedImage from './OptimizedImage';

/**
 * Memoized image card component
 * Re-renders only when props actually change
 */
const ImageCard = memo(({ image, onLike, onView }) => {
  return (
    <div className="relative group overflow-hidden rounded-lg shadow-lg">
      <OptimizedImage
        src={image.url}
        alt={image.prompt}
        className="w-full h-64 object-cover transition-transform group-hover:scale-105"
        width={400}
        height={256}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white text-sm truncate">{image.prompt}</p>
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => onLike(image.id)}
              className="flex items-center space-x-1 text-white hover:text-pink-400 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              <span>{image.likes}</span>
            </button>
            
            <button
              onClick={() => onView(image.id)}
              className="flex items-center space-x-1 text-white hover:text-blue-400 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span>{image.views}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.image.id === nextProps.image.id &&
    prevProps.image.likes === nextProps.image.likes &&
    prevProps.image.views === nextProps.image.views
  );
});

ImageCard.displayName = 'ImageCard';

/**
 * Optimized Image Gallery with memoization
 */
const OptimizedImageGallery = ({ images = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    model: '',
    style: '',
    dateRange: null
  });
  const [sortBy, setSortBy] = useState('date_desc');

  // Memoized search results
  const searchResults = useMemoizedSearch(images, searchQuery, ['prompt', 'model', 'style']);
  
  // Memoized filtered and sorted images
  const processedImages = useMemoizedImages(searchResults, filters, sortBy);

  // Memoized callbacks to prevent unnecessary re-renders
  const handleLike = useCallback((imageId) => {
    console.log('Like image:', imageId);
    // Implementation for liking an image
  }, []);

  const handleView = useCallback((imageId) => {
    console.log('View image:', imageId);
    // Implementation for viewing an image
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search images..."
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4">
          {/* Model Filter */}
          <select
            value={filters.model}
            onChange={(e) => handleFilterChange('model', e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">All Models</option>
            <option value="flux-pro">Flux Pro</option>
            <option value="flux-max">Flux Max</option>
            <option value="gpt-image">GPT Image</option>
            <option value="qwen">Qwen</option>
            <option value="midjourney">Midjourney</option>
          </select>

          {/* Style Filter */}
          <select
            value={filters.style}
            onChange={(e) => handleFilterChange('style', e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="">All Styles</option>
            <option value="anime">Anime</option>
            <option value="realistic">Realistic</option>
            <option value="cartoon">Cartoon</option>
            <option value="abstract">Abstract</option>
            <option value="3d">3D</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="likes">Most Liked</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600">
        {processedImages.length} {processedImages.length === 1 ? 'image' : 'images'} found
      </div>

      {/* Image Grid */}
      {processedImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {processedImages.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              onLike={handleLike}
              onView={handleView}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">No images found</p>
        </div>
      )}
    </div>
  );
};

export default memo(OptimizedImageGallery);