/**
 * Universal download function that uses backend proxy to handle CORS issues
 * @param {string} imageUrl - URL of the image to download
 * @param {string} filename - Desired filename for the download
 */
export const downloadImageWithProxy = async (imageUrl, filename = 'image.png') => {
  try {
    console.log('Downloading image via proxy:', imageUrl);
    
    // Use backend proxy for downloading
    const response = await fetch('/api/images/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: imageUrl
      })
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    // Get the blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('Download completed successfully');
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to opening in new tab
    window.open(imageUrl, '_blank');
  }
};

/**
 * View image in new tab
 * @param {string} imageUrl - URL of the image to view
 */
export const viewImage = (imageUrl) => {
  window.open(imageUrl, '_blank', 'noopener,noreferrer');
};