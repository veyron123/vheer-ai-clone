import React from 'react';
import BaseImageUploader from '../common/BaseImageUploader';

// KISS: Simple wrapper using unified BaseImageUploader
const ImageUploader = (props) => {
  return (
    <BaseImageUploader 
      {...props}
      layout="single"
      uploadText="Upload your images"
      dropText="Or drop image here, paste image or URL" 
      allowedFormats="jpeg, png, webp images allowed."
      generatedLabel="Generated"
      showPasteSupport={false}
    />
  );
};

export default ImageUploader;