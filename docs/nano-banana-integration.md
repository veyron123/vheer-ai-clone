# Nano-Banana (Gemini 2.5 Flash) Integration Documentation

## Overview
Nano-Banana is a creative AI image generation model powered by Google's Gemini 2.5 Flash. It has been integrated into the Vheer platform for both text-to-image and image-to-image generation.

## Features
- **Text-to-Image Generation**: Create images from text descriptions
- **Image-to-Image Generation**: Transform existing images with text prompts
- **Fast Processing**: Powered by Gemini 2.5 Flash for quick generation
- **Creative Output**: Optimized for creative and artistic generations
- **Cost-Effective**: 20 credits per generation

## Technical Details

### API Configuration
- **Model Name**: `gemini-2.5-flash-image-preview`
- **API Key**: Configured in environment variable `NANO_BANANA_API_KEY`
- **Credit Cost**: 20 credits per generation

### Backend Implementation

#### Service File
- **Location**: `/server/services/NanoBananaService.js`
- **Key Features**:
  - Extends BaseAIService for standard functionality
  - Supports both text-to-image and image-to-image
  - Integrated with queue system for async processing
  - Caching support for repeated requests
  - Image upload to ImgBB for storage

#### Controller
- **Location**: `/server/controllers/nanobanana.controller.js`
- **Endpoints**:
  - `POST /api/nano-banana/generate` - Text-to-image generation
  - `POST /api/nano-banana/image-to-image` - Image-to-image generation

#### Routes
- **Location**: `/server/routes/nanobanana.routes.js`
- **Authentication**: Required for credit tracking

### Frontend Implementation

#### Service Files
- **Text-to-Image**: `/client/src/services/nanoBananaGeneration.js`
  - Function: `generateWithNanoBanana(prompt, style, aspectRatio, abortSignal)`
  
- **Image-to-Image**: `/client/src/services/nanoBananaGeneration.js`
  - Function: `generateWithNanoBananaImageToImage(imageBase64, prompt, style, aspectRatio, abortSignal)`

#### Model Configuration
- **Text-to-Image Models**: `/client/src/constants/textToImage.constants.js`
- **Image-to-Image Models**: `/client/src/constants/image-to-image.constants.js`

### Model Selection

#### Text-to-Image
```javascript
{
  id: 'nano-banana',
  name: 'Nano-Banana',
  description: 'Fast & creative AI generation',
  credits: 20,
  premium: false
}
```

#### Image-to-Image
```javascript
NANO_BANANA: {
  id: 'nano-banana',
  name: 'Nano-Banana',
  badge: { text: '🍌', color: 'bg-yellow-400 text-black' }
}
```

## Usage

### Text-to-Image Generation

1. Navigate to the Text-to-Image generator page
2. Select "Nano-Banana" from the AI Model selector
3. Enter your prompt
4. Select aspect ratio
5. Click Generate (costs 20 credits)

### Image-to-Image Generation

1. Navigate to the Image-to-Image generator page  
2. Upload your base image
3. Select "Nano-Banana" from the AI Model selector
4. Enter your transformation prompt
5. Click Generate (costs 20 credits)

## API Request Format

### Text-to-Image Request
```json
{
  "prompt": "A beautiful sunset over mountains",
  "style": "realistic",
  "aspectRatio": "16:9"
}
```

### Image-to-Image Request
```json
{
  "prompt": "Transform into watercolor painting",
  "input_image": "base64_image_data",
  "style": "artistic",
  "aspectRatio": "1:1"
}
```

## Response Format
```json
{
  "success": true,
  "data": {
    "url": "https://generated-image-url.jpg",
    "model": "nano-banana",
    "creditsUsed": 20,
    "generationId": "gen_123456"
  }
}
```

## Error Handling

### Common Errors
- **401**: Authentication required
- **402**: Insufficient credits
- **400**: Invalid request parameters
- **500**: Generation failed

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Performance Considerations

- **Timeout**: 5 minutes for generation requests
- **Caching**: Results cached for 1 hour
- **Queue Priority**: Authenticated users get higher priority
- **Image Size**: Generated images are ALWAYS 1024x1024px (aspect ratio is not supported by Gemini API)

## Security

- API key stored securely in environment variables
- Authentication required for all endpoints
- Credit validation before generation
- Rate limiting applied to prevent abuse

## Monitoring

- Logging via Winston logger
- Generation records stored in database
- Credit usage tracked per user
- Performance metrics available in admin panel

## Future Improvements

- [ ] Add batch generation support
- [ ] Implement style presets
- [ ] Add resolution options
- [ ] Integrate with additional storage providers
- [ ] Add webhook support for async completions