import React from 'react';
import BaseImageUploader from '../common/BaseImageUploader';

// Halloween-themed ImageUploader with gothic frame styling
const ImageUploader = (props) => {
  return (
    <BaseImageUploader 
      {...props}
      layout="single"
      uploadText="Upload your soul's image"
      dropText="Or drop image here, paste image or URL" 
      allowedFormats="jpeg, png, webp images allowed."
      generatedLabel="Transformed"
      showPasteSupport={false}
      gothicFrame={true}
    />
  );
};

export default ImageUploader;