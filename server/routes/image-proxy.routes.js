import express from 'express';
import axios from 'axios';
const router = express.Router();

// Image proxy route to bypass CORS issues
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('🖼️ Proxying image:', url);

    // Fetch the image from the external URL
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000 // 30 second timeout
    });

    // Set appropriate headers
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    // Pipe the image data to the response
    response.data.pipe(res);

  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'Failed to fetch image',
        details: error.message
      });
    }

    return res.status(500).json({ 
      error: 'Image proxy server error',
      details: error.message
    });
  }
});

export default router;