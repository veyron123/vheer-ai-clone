import React from 'react';
import BaseImageUploader from '../common/BaseImageUploader';

// KISS: Simple wrapper using unified BaseImageUploader
const ImageToImageUploader = (props) => {
  return (
    <BaseImageUploader 
      {...props}
      layout="grid"
      uploadText="Upload your images"
      dropText="Drag & Drop your image(s) here"
      allowedFormats="jpeg, png, webp images allowed."
      generatedLabel="Generated"
      showPasteSupport={true}
    />
  );
};

export default ImageToImageUploader;