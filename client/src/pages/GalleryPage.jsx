import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Grid3x3, 
  Heart, 
  Download, 
  Eye, 
  Filter,
  Search,
  Loader2
} from 'lucide-react';
import api from '../services/api';

const GalleryPage = () => {
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false
  });

  // Fetch gallery images
  const { data, isLoading, isFetchingNextPage } = useQuery(
    ['gallery', page, selectedStyle, selectedModel],
    () => api.get('/images/gallery', {
      params: {
        page,
        limit: 20,
        style: selectedStyle,
        model: selectedModel
      }
    }).then(res => res.data),
    {
      keepPreviousData: true
    }
  );

  // Fetch available styles
  const { data: styles } = useQuery('styles', () =>
    api.get('/generate/styles').then(res => res.data)
  );

  // Fetch available models
  const { data: models } = useQuery('models', () =>
    api.get('/generate/models').then(res => res.data)
  );

  const ImageCard = ({ image, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.05 }}
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative rounded-xl overflow-hidden bg-gray-100">
          <img
            src={image.thumbnailUrl || image.url}
            alt={image.prompt}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            {/* User Info */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-medium">
                {image.user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-white text-sm font-medium">
                {image.user?.username || 'Anonymous'}
              </span>
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition">
                <Heart className="w-4 h-4 text-white" />
              </button>
              <button className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition">
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Prompt */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm line-clamp-2">
                {image.prompt}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-white/70 text-xs">
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {image.views || 0}
                </span>
                <span className="flex items-center">
                  <Heart className="w-3 h-3 mr-1" />
                  {image.likes || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Gallery</h1>
          <p className="text-gray-600">Discover amazing AI-generated artwork from our community</p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images..."
                className="input pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Style Filter */}
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="input"
            >
              <option value="">All Styles</option>
              {styles?.map(style => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>

            {/* Model Filter */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input"
            >
              <option value="">All Models</option>
              {models?.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSelectedStyle('');
                setSelectedModel('');
                setSearchQuery('');
              }}
              className="btn btn-outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.images?.map((image, index) => (
                <ImageCard key={image.id} image={image} index={index} />
              ))}
            </div>

            {/* Load More */}
            {data?.pagination?.page < data?.pagination?.pages && (
              <div ref={ref} className="flex justify-center mt-12">
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={isFetchingNextPage}
                  className="btn btn-outline"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}

            {/* No Results */}
            {data?.images?.length === 0 && (
              <div className="text-center py-20">
                <Grid3x3 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No images found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;