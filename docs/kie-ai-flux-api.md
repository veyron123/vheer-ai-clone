# KIE.ai Flux Kontext API Documentation

## Overview
This document describes the KIE.ai API integration for Flux Kontext image generation and editing functionality.

## API Endpoints

### Base URL
```
https://api.kie.ai/api/v1/flux/kontext
```

### Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer YOUR_API_KEY
```

## Generate or Edit Image

Create a new image generation or editing task using the Flux Kontext AI model.

### Endpoint
```
POST /api/v1/flux/kontext/generate
```

### Request Parameters

#### Request Body Structure
```json
{
  "prompt": "string (required)",
  "enableTranslation": "boolean (optional)",
  "uploadCn": "boolean (optional)",
  "inputImage": "string (optional)",
  "aspectRatio": "string (optional)",
  "outputFormat": "string (optional)",
  "promptUpsampling": "boolean (optional)",
  "model": "string (optional)",
  "callBackUrl": "string (optional)",
  "safetyTolerance": "integer (optional)",
  "watermark": "string (optional)"
}
```

#### Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `prompt` | string | Required | - | Text prompt describing the desired image or edit. Only English language is supported. | `"A serene mountain landscape at sunset with a lake reflecting the orange sky"` |
| `enableTranslation` | boolean | Optional | true | Whether to enable automatic translation feature for non-English prompts | true |
| `uploadCn` | boolean | Optional | false | Specifies server region for image upload. true for China servers, false for non-China servers | false |
| `inputImage` | string(URL) | Optional | - | URL of input image for editing mode. Required when editing an existing image. | `"https://example.com/input-image.jpg"` |
| `aspectRatio` | string | Optional | `"16:9"` | Output image aspect ratio | `"16:9"` |
| `outputFormat` | string | Optional | `"jpeg"` | Output image format | `"jpeg"` |
| `promptUpsampling` | boolean | Optional | false | If true, performs upsampling on the prompt. May increase processing time | false |
| `model` | string | Optional | `"flux-kontext-pro"` | Model version to use for generation | `"flux-kontext-pro"` |
| `callBackUrl` | string(URL) | Optional | - | URL to receive task completion updates | `"https://your-domain.com/api/callback"` |
| `safetyTolerance` | integer | Optional | 2 | Moderation level. For generation: 0-6, for editing: 0-2 | 2 |
| `watermark` | string | Optional | - | Watermark identifier to add to the generated image | `"your-watermark-id"` |

#### Available Options

**aspectRatio:**
- `21:9` - Ultra-wide (Cinematic displays, panoramic views)
- `16:9` - Widescreen (HD video, desktop wallpapers)
- `4:3` - Standard (Traditional displays, presentations)
- `1:1` - Square (Social media posts, profile pictures)
- `3:4` - Portrait (Magazine layouts, portrait photos)
- `9:16` - Mobile Portrait (Smartphone wallpapers, stories)

**outputFormat:**
- `jpeg` - JPEG format
- `png` - PNG format

**model:**
- `flux-kontext-pro` - Standard model with balanced performance
- `flux-kontext-max` - Enhanced model with advanced capabilities

### Request Example

#### Text-to-Image Generation
```bash
curl -X POST "https://api.kie.ai/api/v1/flux/kontext/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky",
    "aspectRatio": "16:9",
    "model": "flux-kontext-pro",
    "outputFormat": "jpeg",
    "promptUpsampling": false
  }'
```

#### Image Editing
```bash
curl -X POST "https://api.kie.ai/api/v1/flux/kontext/generate" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Add colorful hot air balloons floating in the sky",
    "inputImage": "https://example.com/landscape.jpg",
    "aspectRatio": "16:9",
    "model": "flux-kontext-pro"
  }'
```

### Response Example
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task12345"
  }
}
```

#### Response Fields
| Field | Description |
|-------|-------------|
| `code` | Status code, 200 for success, others for failure |
| `msg` | Response message, error description when failed |
| `data.taskId` | Task ID for querying task status |

## Get Image Details

Query the status and results of an image generation or editing task.

### Endpoint
```
GET /api/v1/flux/kontext/record-info?taskId=TASK_ID
```

### Request Example

```bash
curl -X GET "https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=task12345" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response Example
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task12345",
    "paramJson": "{\"prompt\":\"A serene mountain landscape\",\"aspectRatio\":\"16:9\"}",
    "completeTime": "2024-03-20T10:30:00Z",
    "response": {
      "originImageUrl": "https://example.com/original.jpg",
      "resultImageUrl": "https://example.com/result.jpg"
    },
    "successFlag": 1,
    "errorCode": null,
    "errorMessage": "",
    "createTime": "2024-03-20T10:25:00Z"
  }
}
```

#### Response Fields
| Field | Description |
|-------|-------------|
| `code` | Status code, 200 for success, others for failure |
| `msg` | Response message, error description when failed |
| `data.taskId` | Unique identifier of the image generation task |
| `data.paramJson` | Request parameters in JSON format |
| `data.completeTime` | Task completion time |
| `data.response.originImageUrl` | Original image URL (valid for 10 minutes) |
| `data.response.resultImageUrl` | Generated image URL on server |
| `data.successFlag` | Generation status flag (see Status Values below) |
| `data.errorCode` | Error code when task failed |
| `data.errorMessage` | Error message when task failed |
| `data.createTime` | Task creation time |

#### Status Values (successFlag)
| Status | Description |
|--------|-------------|
| 0 | GENERATING - Task is currently being processed |
| 1 | SUCCESS - Task completed successfully |
| 2 | CREATE_TASK_FAILED - Failed to create the task |
| 3 | GENERATE_FAILED - Task creation succeeded but generation failed |

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Content Policy Violation |
| 401 | Unauthorized |
| 402 | Insufficient Credits |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 455 | Service Unavailable |
| 500 | Server Error |
| 501 | Generation Failed |

## Callback Notifications

When you provide the `callBackUrl` parameter, the system will send POST requests to the specified URL upon task completion.

### Success Callback Example
```json
{
  "code": 200,
  "msg": "BFL image generated successfully.",
  "data": {
    "taskId": "task12345",
    "info": {
      "originImageUrl": "https://example.com/original.jpg",
      "resultImageUrl": "https://example.com/result.jpg"
    }
  }
}
```

### Failure Callback Example
```json
{
  "code": 501,
  "msg": "Image generation task failed",
  "data": {
    "taskId": "task12345",
    "info": {
      "originImageUrl": "",
      "resultImageUrl": ""
    }
  }
}
```

## Important Notes

- Generated images are stored for **14 days** and automatically expire
- Original image URLs in callbacks/responses are **valid for only 10 minutes**
- Maximum file size for input images: Not specified (check API limits)
- Supported input image formats: Standard web formats (JPEG, PNG, WebP)
- Only English language is supported for prompts (use enableTranslation for auto-translation)
- Callback URLs must be publicly accessible and respond within 15 seconds

## Integration Notes

This API is used in the Colibrrri application for Flux image generation functionality. The implementation handles:

1. **Image Processing**: Convert base64 images to public URLs via IMGBB
2. **Async Processing**: Use task polling to wait for generation completion  
3. **Credit Management**: Deduct credits on task creation, refund on failure
4. **Error Handling**: Provide user-friendly error messages based on API responses
5. **Result Storage**: Save generated images to user galleries via Cloudinary

For implementation details, see the Flux controller in `server/controllers/flux.controller.js`.