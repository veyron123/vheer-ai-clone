import React from 'react';
import { EXAMPLE_IMAGES } from '../../constants/anime.constants';

const ExampleGallery = ({ examples }) => {
  // Use passed examples prop or fall back to default EXAMPLE_IMAGES
  const imagesToShow = examples || EXAMPLE_IMAGES;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Example Results</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {imagesToShow.map((example) => (
          <div key={example.id} className="relative group">
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={example.generated} 
                alt="Example result"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExampleGallery;