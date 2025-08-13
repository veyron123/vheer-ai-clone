import React from 'react';
import { EXAMPLE_IMAGES } from '../../constants/anime.constants';

const ExampleGallery = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Example Results</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {EXAMPLE_IMAGES.map((example) => (
          <div key={example.id} className="relative group">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={example.generated} 
                alt={`${example.style} style`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
              {example.style}
            </div>
            <div className="absolute top-2 right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <img 
                src={example.original} 
                alt="Original"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExampleGallery;