# Runway API Documentation

## Overview
The Runway API enables high-quality AI video generation using advanced AI models. This documentation provides complete integration guide for the AI Video Generator feature.

**API Base URL**: `https://api.kie.ai`

**API Key**: `b5cfe077850a194e434914eedd7111d5`

---

## Authentication

All API requests require Bearer token authentication:

```http
Authorization: Bearer b5cfe077850a194e434914eedd7111d5
```

---

## Video Generation Endpoint

### POST `/api/v1/runway/generate`

Generates AI videos from text prompts or image references.

#### Request Headers
```http
Authorization: Bearer b5cfe077850a194e434914eedd7111d5
Content-Type: application/json
```

#### Request Body Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `prompt` | string | ✅ Yes | Text description (max 1800 chars) | "A fluffy orange cat dancing energetically in a colorful room with disco lights" |
| `imageUrl` | string | ❌ Optional | Reference image URL for animation | "https://example.com/cat-image.jpg" |
| `duration` | number | ✅ Yes | Video duration: `5` or `8` seconds | `5` |
| `quality` | string | ✅ Yes | Resolution: `"720p"` or `"1080p"` | `"720p"` |
| `aspectRatio` | string | ✅ Yes | Format: `"16:9"`, `"4:3"`, `"1:1"`, `"3:4"`, `"9:16"` | `"16:9"` |
| `waterMark` | string | ❌ Optional | Watermark text (empty = no watermark) | `"kie.ai"` |
| `callBackUrl` | string | ❌ Optional | Callback URL for completion notification | `"https://api.example.com/callback"` |

#### Constraints
- **Duration vs Quality**: If 8-second video is selected, 1080p cannot be used
- **Quality vs Duration**: If 1080p is selected, 8-second video cannot be generated

#### Response Format

**Success Response (200)**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "ee603959-debb-48d1-98c4-a6d1c717eba6"
  }
}
```

**Error Response Codes**:
- `200`: Success - Request processed successfully
- `401`: Unauthorized - Invalid API key
- `404`: Not Found - Endpoint doesn't exist
- `422`: Validation Error - Invalid parameters
- `451`: Image Access Error - Cannot fetch reference image
- `455`: Service Unavailable - System maintenance
- `500`: Server Error - Unexpected error

---

## JavaScript Implementation Examples

### Basic Text-to-Video Generation
```javascript
async function generateVideo(prompt, options = {}) {
  const defaultOptions = {
    duration: 5,
    quality: "720p",
    aspectRatio: "16:9",
    waterMark: ""
  };
  
  const config = { ...defaultOptions, ...options, prompt };
  
  try {
    const response = await fetch('https://api.kie.ai/api/v1/runway/generate', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer b5cfe077850a194e434914eedd7111d5',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    const data = await response.json();
    
    if (response.ok && data.code === 200) {
      console.log('Video generation started:', data.data.taskId);
      return data.data.taskId;
    } else {
      throw new Error(data.msg || 'Generation failed');
    }
  } catch (error) {
    console.error('Error generating video:', error.message);
    throw error;
  }
}

// Usage
const taskId = await generateVideo(
  "A majestic eagle soaring over mountain peaks at sunset",
  { duration: 8, quality: "720p", aspectRatio: "16:9" }
);
```

### Image-to-Video Generation
```javascript
async function generateVideoFromImage(prompt, imageUrl, options = {}) {
  return generateVideo(prompt, { ...options, imageUrl });
}

// Usage
const taskId = await generateVideoFromImage(
  "Animate this landscape with flowing clouds and swaying trees",
  "https://example.com/landscape.jpg",
  { duration: 5, quality: "1080p", aspectRatio: "16:9" }
);
```

### Error Handling Template
```javascript
function handleRunwayError(errorCode, message) {
  const errorMessages = {
    401: 'Invalid API key. Please check your authentication.',
    404: 'API endpoint not found. Please verify the URL.',
    422: 'Invalid parameters. Please check your request data.',
    451: 'Cannot access the reference image. Check image URL and permissions.',
    455: 'Service temporarily unavailable. Please try again later.',
    500: 'Server error occurred. Please contact support.'
  };
  
  return errorMessages[errorCode] || message || 'Unknown error occurred';
}
```

---

## Video Generation Status Polling

Since video generation is asynchronous, you'll need to poll for results using the task ID or implement webhook callbacks.

### Polling Pattern
```javascript
async function pollVideoStatus(taskId, maxAttempts = 60, interval = 10000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Call status check endpoint (to be implemented)
      const status = await checkVideoStatus(taskId);
      
      if (status.completed) {
        return status.videoUrl;
      }
      
      console.log(`Attempt ${attempt}: Video still processing...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      console.error(`Status check failed (attempt ${attempt}):`, error);
    }
  }
  
  throw new Error('Video generation timed out');
}
```

---

## Best Practices

### 1. **Prompt Engineering**
- Be specific about subject, action, style, and setting
- Keep prompts under 1800 characters
- Use descriptive language for better results

### 2. **Resource Management**
- Monitor API usage and costs
- Implement proper error handling
- Use appropriate quality/duration combinations

### 3. **User Experience**
- Show progress indicators during generation
- Provide clear error messages
- Allow users to cancel long-running requests

### 4. **Security**
- Store API key securely (environment variables)
- Validate user inputs before sending to API
- Implement rate limiting to prevent abuse

---

## Integration Checklist

- [ ] **Service Class**: Create RunwayVideoService for API communication
- [ ] **Controller**: Build server-side endpoint handler
- [ ] **Frontend Component**: Design user interface for video generation
- [ ] **Status Polling**: Implement async status checking
- [ ] **Error Handling**: Add comprehensive error management
- [ ] **Progress Indicators**: Show generation progress to users
- [ ] **Result Display**: Create video player component
- [ ] **Navigation**: Add to site navigation and routing

---

## Environment Configuration

Add to `.env` file:
```env
RUNWAY_API_KEY=b5cfe077850a194e434914eedd7111d5
RUNWAY_API_URL=https://api.kie.ai/api/v1/runway
```

---

## Support & Resources

- **API Documentation**: [Runway API Docs](https://docs.kie.ai/runway-api)
- **API Key Management**: [API Key Page](https://kie.ai/api-key)
- **Rate Limits**: Check with API provider
- **Billing**: Monitor usage at API dashboard

---

*Last Updated: 2025-08-23*
*API Version: v1*