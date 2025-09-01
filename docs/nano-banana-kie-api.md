# Nano-Banana KIE API Integration Documentation

## Overview
Nano-Banana model has been integrated with KIE API using the `google/nano-banana-edit` model for advanced image editing capabilities.

## Configuration

### Environment Variables
```env
# Nano-Banana (KIE API - Google Nano Banana Edit)
NANO_BANANA_API_KEY="your-kie-api-key"
NANO_BANANA_API_URL="https://api.kie.ai/api/v1/playground"
```

## API Endpoints

### 1. Image-to-Image Generation
**Endpoint:** `POST /api/nano-banana/image-to-image`

**Request Body:**
```json
{
  "prompt": "string - transformation description",
  "input_image": "string - base64 encoded image or URL",
  "aspectRatio": "string - optional, default: 1:1"
}
```

**Response:**
```json
{
  "success": true,
  "image": "URL of generated image",
  "thumbnailUrl": "URL of thumbnail",
  "credits": {
    "used": 20,
    "remaining": 980
  },
  "model": "nano-banana",
  "metadata": {
    "provider": "KIE API",
    "model": "google/nano-banana-edit"
  }
}
```

### 2. Text-to-Image Generation
**Endpoint:** `POST /api/nano-banana/generate`

**Request Body:**
```json
{
  "prompt": "string - image description",
  "aspectRatio": "string - optional, default: 1:1"
}
```

**Response:**
```json
{
  "success": true,
  "image": "URL of generated image",
  "thumbnailUrl": "URL of thumbnail",
  "credits": {
    "used": 20,
    "remaining": 980
  },
  "model": "nano-banana",
  "metadata": {
    "provider": "KIE API",
    "model": "google/nano-banana-edit",
    "mode": "text-to-image"
  }
}
```

## KIE API Integration Details

### API Workflow

1. **Task Creation**
   - Send POST request to `/createTask` with model and input parameters
   - Receive `taskId` for tracking

2. **Task Polling**
   - Query `/recordInfo?taskId={taskId}` to check task status
   - Poll every 2 seconds, maximum 60 attempts (2 minutes timeout)
   - Task states: `waiting`, `queuing`, `generating`, `success`, `fail`

3. **Result Retrieval**
   - On success, extract image URL from `resultJson.resultUrls[0]`
   - Save generated image to user gallery
   - Return formatted response to client

### Error Handling

- **Authentication Errors (401)**: User not logged in
- **Insufficient Credits (402)**: User doesn't have enough credits
- **API Quota Exceeded (429)**: KIE API rate limit reached
- **Task Timeout**: Generation exceeds 2 minutes
- **Task Failed**: KIE API returns fail state

### Image Handling

#### Base64 Images
- Automatically detected and uploaded to Cloudinary
- Converted to URL format for KIE API compatibility

#### Text-to-Image Mode
- Creates a neutral base image using placeholder service
- Sends enhanced prompt to transform base into desired image

### Polling Configuration

```javascript
const pollTaskStatus = async (taskId, maxAttempts = 60, delayMs = 2000) => {
  // Poll every 2 seconds for up to 2 minutes
}
```

## Credit System

- **Cost per generation**: 20 credits
- **Credit deduction**: Before task creation
- **Credit refund**: On task failure
- **Credit tracking**: Updated in user profile

## Security Features

- Bearer token authentication required
- API key stored in environment variables
- Input validation for all parameters
- Secure image URL handling

## Client Integration

### JavaScript Example
```javascript
import { generateWithNanoBanana, generateWithNanoBananaImageToImage } from './services/nanoBananaGeneration';

// Text-to-Image
const result = await generateWithNanoBanana(
  "A beautiful sunset over mountains",
  "realistic",
  "16:9"
);

// Image-to-Image
const result = await generateWithNanoBananaImageToImage(
  base64Image,
  "Transform into anime style",
  "anime",
  "1:1"
);
```

## Monitoring & Logging

- Task creation logged with taskId
- Polling attempts tracked
- Error details captured for debugging
- Credit transactions logged

## Performance Optimization

- Efficient polling with exponential backoff option
- Image caching via Cloudinary CDN
- Parallel task processing support
- Automatic retry on transient failures

## Limitations

- Maximum prompt length: 5000 characters
- Maximum input images: 5 (currently using 1)
- Maximum file size: 10MB
- Supported formats: JPEG, PNG, WebP
- Task timeout: 2 minutes

## Troubleshooting

### Common Issues

1. **Task Timeout**
   - Increase `maxAttempts` in `pollTaskStatus`
   - Check KIE API status

2. **Invalid Image URL**
   - Ensure base64 images are properly uploaded
   - Verify URL accessibility

3. **Authentication Failed**
   - Check API key in environment variables
   - Verify Bearer token format

4. **Credit Issues**
   - Ensure user has sufficient credits
   - Check refund logic on failures

## Future Enhancements

- [ ] Webhook support for async notifications
- [ ] Batch processing for multiple images
- [ ] Custom callback URLs
- [ ] Advanced prompt engineering
- [ ] Multiple aspect ratio presets
- [ ] Style transfer options