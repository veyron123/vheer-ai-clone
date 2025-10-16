# FAL.ai Seedream V4 Image Editing API Documentation

## Overview
This document describes the FAL.ai API integration for Bytedance's SeedDream V4 model - advanced AI-powered image editing with multiple input images support.

## API Information

### Base Information
```
Provider: FAL.ai
Model: bytedance/seedream/v4/edit
Endpoint: fal-ai/bytedance/seedream/v4/edit
Type: Image-to-Image Editing
```

### Authentication
All requests require FAL API Key authentication:
```
FAL_KEY=your_fal_api_key_here
```
> **Note:** Бэкенд читает ключ только из переменной окружения `FAL_KEY`. Пропишите её в `server/.env` или настройках окружения вашего хостинга перед запуском.

## API Usage Patterns

### 1. Direct Synchronous Call
For immediate results with blocking execution:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
  input: {
    prompt: "Dress the model in elegant evening wear",
    image_urls: [
      "https://example.com/input1.png",
      "https://example.com/input2.png"
    ],
    image_size: "landscape_16_9",
    num_images: 1,
    seed: 42
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  }
});

console.log(result.data);
console.log(result.requestId);
```

### 2. Asynchronous Queue Pattern
For long-running tasks with polling:

#### Submit Request
```javascript
import { fal } from "@fal-ai/client";

const { request_id } = await fal.queue.submit("fal-ai/bytedance/seedream/v4/edit", {
  input: {
    prompt: "Transform the clothing style to vintage 1950s fashion",
    image_urls: [
      "https://example.com/model.png",
      "https://example.com/reference.png"
    ],
    image_size: {
      width: 1280,
      height: 1280
    },
    num_images: 2
  },
  webhookUrl: "https://your-app.com/api/seedream/webhook"
});
```

#### Check Status
```javascript
const status = await fal.queue.status("fal-ai/bytedance/seedream/v4/edit", {
  requestId: request_id,
  logs: true
});
```

#### Get Results
```javascript
const result = await fal.queue.result("fal-ai/bytedance/seedream/v4/edit", {
  requestId: request_id
});

console.log(result.data.images);
```

## Request Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `prompt` | string | Text description for image editing | `"Change outfit to business attire"` |
| `image_urls` | array[string] | Input image URLs (max 10 images) | `["https://example.com/img1.png"]` |

### Optional Parameters

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `image_size` | string\|object | `"square"` | Output image dimensions | `"landscape_16_9"` |
| `num_images` | integer | 1 | Number of variations to generate | 2 |
| `seed` | integer | random | Seed for reproducible results | 12345 |
| `sync_mode` | boolean | false | Wait for upload before returning | true |

### Image Size Options

**Predefined Sizes:**
- `"square_hd"` - High definition square
- `"square"` - Standard square  
- `"portrait_4_3"` - 4:3 portrait ratio
- `"portrait_16_9"` - 16:9 portrait ratio
- `"landscape_4_3"` - 4:3 landscape ratio
- `"landscape_16_9"` - 16:9 landscape ratio

**Custom Dimensions:**
```javascript
"image_size": {
  "width": 1280,
  "height": 720
}
```
Note: Width and height must be between 1024 and 4096 pixels.

## Request Examples

### Basic Image Editing
```javascript
{
  "prompt": "Add sunglasses and a baseball cap",
  "image_urls": ["https://example.com/portrait.png"],
  "image_size": "square_hd",
  "num_images": 1
}
```

### Multi-Image Style Transfer
```javascript
{
  "prompt": "Apply the style from the reference images to the main subject",
  "image_urls": [
    "https://example.com/subject.png",
    "https://example.com/style1.png", 
    "https://example.com/style2.png"
  ],
  "image_size": {
    "width": 1280,
    "height": 1280
  },
  "num_images": 3,
  "seed": 999
}
```

### Fashion/Clothing Editing
```javascript
{
  "prompt": "Dress the model in the clothes and shoes from the reference images",
  "image_urls": [
    "https://example.com/model.png",
    "https://example.com/dress.png",
    "https://example.com/shoes.png",
    "https://example.com/accessories.png"
  ],
  "image_size": "portrait_4_3",
  "num_images": 2
}
```

## Response Format

### Success Response
```javascript
{
  "images": [
    {
      "url": "https://storage.googleapis.com/falserverless/result1.png",
      "width": 1280,
      "height": 1280,
      "content_type": "image/png",
      "file_name": "seedream_edit_result.png",
      "file_size": 2048576
    }
  ],
  "seed": 746406749
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `images` | array | List of generated images |
| `images[].url` | string | Direct download URL |
| `images[].width` | integer | Image width in pixels |
| `images[].height` | integer | Image height in pixels |
| `images[].content_type` | string | MIME type (e.g., "image/png") |
| `images[].file_name` | string | Generated filename |
| `images[].file_size` | integer | File size in bytes |
| `seed` | integer | Seed used for generation |

## File Handling

### Supported Input Types

1. **Public URLs**: Direct links to publicly accessible images
2. **Base64 Data URIs**: Inline base64 encoded images
3. **FAL Storage**: Upload files using FAL storage service

### File Upload Example
```javascript
import { fal } from "@fal-ai/client";

// Upload file to FAL storage
const file = new File([imageBlob], "input.png", { type: "image/png" });
const url = await fal.storage.upload(file);

// Use uploaded file URL
const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
  input: {
    prompt: "Edit this image",
    image_urls: [url]
  }
});
```

### Auto-Upload Feature
The client automatically uploads binary objects (File, Blob, Buffer) to FAL storage:

```javascript
// Auto-upload binary data
const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
  input: {
    prompt: "Transform this image",
    image_urls: [fileObject] // Will be auto-uploaded
  }
});
```

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Invalid input parameters | Check parameter types and values |
| 401 | Authentication failed | Verify FAL_KEY is correct |
| 413 | Image file too large | Reduce image file size |
| 429 | Rate limit exceeded | Implement retry with backoff |
| 500 | Server error | Retry request or contact support |

### Error Response Format
```javascript
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Image URL is not accessible",
    "details": {
      "field": "image_urls[0]",
      "value": "https://invalid-url.com/image.png"
    }
  }
}
```

## Best Practices

### Image Input Guidelines
- **Resolution**: Use high-quality images for better editing results
- **Format**: PNG, JPG, WebP are supported
- **Size**: Keep individual files under 10MB
- **Count**: Maximum 10 input images per request
- **Accessibility**: Ensure URLs are publicly accessible

### Performance Optimization
- Use `sync_mode: false` for better user experience
- Implement proper loading states for queue operations
- Cache results when possible using the seed parameter
- Use webhooks for long-running operations

### Prompt Engineering
- Be specific about desired changes
- Include style, color, and detail preferences
- Reference relationships between input images
- Use clear, descriptive language

## Integration Examples

### React Component
```javascript
import React, { useState } from 'react';
import { fal } from "@fal-ai/client";

function SeedreamEditor() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const editImage = async (imageUrls, prompt) => {
    setLoading(true);
    try {
      const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
        input: {
          prompt,
          image_urls: imageUrls,
          image_size: "landscape_16_9",
          num_images: 1
        }
      });
      setResult(result.data);
    } catch (error) {
      console.error('Seedream editing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* UI components */}
    </div>
  );
}
```

### Node.js Backend
```javascript
const { fal } = require("@fal-ai/client");

// Configure API key
fal.config({
  credentials: process.env.FAL_KEY
});

async function processSeedreamEdit(req, res) {
  try {
    const { prompt, imageUrls, options = {} } = req.body;
    
    const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
      input: {
        prompt,
        image_urls: imageUrls,
        ...options
      }
    });
    
    res.json({
      success: true,
      images: result.data.images,
      seed: result.data.seed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

## Security Considerations

### API Key Protection
- Never expose FAL_KEY in client-side code
- Use server-side proxy for browser applications
- Implement proper authentication for your API endpoints
- Rotate API keys regularly

### Input Validation
- Validate image URLs before sending to API
- Check file sizes and formats
- Sanitize user-provided prompts
- Implement rate limiting on your endpoints

## Limitations

### Technical Limits
- Maximum 10 input images per request
- Image dimensions: 1024-4096 pixels
- File size: Recommended under 10MB per image
- Queue timeout: Varies based on complexity

### Usage Limits
- Rate limits depend on your FAL.ai plan
- Concurrent request limits may apply
- Monthly usage quotas may be enforced

## Integration Notes

This API is designed for integration in applications requiring advanced image editing capabilities. Key integration considerations:

1. **Async Processing**: Use queue pattern for better UX
2. **File Management**: Implement proper image storage and caching
3. **Error Handling**: Provide fallbacks for failed requests
4. **Progress Tracking**: Show editing progress to users
5. **Result Storage**: Save generated images to your storage system

For implementation in the Colibrrri application, this would complement existing image generation models by providing advanced multi-image editing capabilities.

## Support and Resources

- **FAL.ai Documentation**: https://docs.fal.ai/
- **Model Page**: https://www.fal.ai/models/fal-ai/bytedance/seedream/v4/edit
- **Client SDK**: https://github.com/fal-ai/fal-js
- **Community**: FAL.ai Discord server
- **Support**: support@fal.ai
