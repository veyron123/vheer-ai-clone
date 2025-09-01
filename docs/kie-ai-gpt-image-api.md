# KIE.ai GPT Image API Documentation

## Overview
This document describes the KIE.ai API integration for GPT Image (GPT-4o) functionality using the playground API.

## API Endpoints

### Base URL
```
https://api.kie.ai/api/v1/gpt4o-image
```

### Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer YOUR_API_KEY
```

## Generate Image

Create a new GPT Image generation task

### Endpoint
```
POST /api/v1/gpt4o-image/generate
```

### Request Parameters
The API accepts a JSON payload with the following structure:

#### Request Body Structure
```json
{
  "prompt": "string (optional)",
  "filesUrl": ["string (optional)"],
  "size": "string (required)",
  "nVariants": "integer (optional)",
  "maskUrl": "string (optional)",
  "callBackUrl": "string (optional)",
  "isEnhance": "boolean (optional)",
  "uploadCn": "boolean (optional)",
  "enableFallback": "boolean (optional)",
  "fallbackModel": "string (optional)",
  "fileUrl": "string (optional, deprecated)"
}
```

#### Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `prompt` | string | Optional* | - | Text prompt that conveys the creative idea you want the GPT-4o model to render. Required if neither `filesUrl` nor `fileUrl` is supplied. | `"A beautiful sunset over the mountains"` |
| `filesUrl` | array[string] | Optional* | - | Up to 5 publicly reachable image URLs to serve as reference or source material. Supported formats: .jfif, .pjpeg, .jpeg, .pjp, .jpg, .png, .webp. At least one of `prompt` or `filesUrl` must be provided. | `["https://example.com/image1.png"]` |
| `size` | string | Required | - | Aspect ratio of the generated image. Options: `"1:1"`, `"3:2"`, `"2:3"` | `"1:1"` |
| `nVariants` | integer | Optional | 1 | How many image variations to produce (1, 2, or 4). | 1 |
| `maskUrl` | string | Optional | - | Mask image URL indicating areas to modify (black) versus preserve (white). Must match reference image dimensions. | `"https://example.com/mask.png"` |
| `callBackUrl` | string | Optional | - | Callback URL for task completion notifications. System will POST task status and results to this URL when generation completes. | `"https://your-domain.com/api/callback"` |
| `isEnhance` | boolean | Optional | false | Enable prompt enhancement for more refined outputs in specialized scenarios. | false |
| `uploadCn` | boolean | Optional | false | Choose upload region. `true` routes via China servers; `false` via non-China servers. | false |
| `enableFallback` | boolean | Optional | false | Activate automatic fallback to backup models if GPT-4o is unavailable. | false |
| `fallbackModel` | string | Optional | `"FLUX_MAX"` | Specify backup model when enableFallback is true. Options: `"GPT_IMAGE_1"`, `"FLUX_MAX"` | `"FLUX_MAX"` |
| `fileUrl` | string | Optional | - | **Deprecated** - Single file URL. Use `filesUrl` instead. | `"https://example.com/image.png"` |

*Note: At least one of `prompt` or `filesUrl` must be provided.

### Request Example

#### cURL
```bash
curl -X POST "https://api.kie.ai/api/v1/gpt4o-image/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "prompt": "A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style",
    "size": "1:1",
    "nVariants": 1,
    "isEnhance": false,
    "enableFallback": false
  }'
```

#### JavaScript
```javascript
const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    prompt: 'A serene mountain landscape at sunset with a lake reflecting the orange sky, photorealistic style',
    size: '1:1',
    nVariants: 1,
    isEnhance: false,
    enableFallback: false
  })
});
```

### Response Example
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_gpt4o_12345678"
  }
}
```

#### Response Fields
| Field | Description |
|-------|-------------|
| `code` | Status code, 200 for success, others for failure |
| `msg` | Response message, error description when failed |
| `data.taskId` | Task ID for querying task status |

## Query Task Status

Query task status and results by task ID

### Endpoint
```
GET /api/v1/gpt4o-image/record-info?taskId=TASK_ID
```

### Request Example

#### cURL
```bash
curl -X GET "https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=task_gpt4o_12345678" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### JavaScript  
```javascript
const response = await fetch('https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=task_gpt4o_12345678', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
```

### Response Example
```json
{
  "code": 200,
  "msg": "success", 
  "data": {
    "taskId": "task_gpt4o_12345678",
    "paramJson": "{\"prompt\":\"A serene mountain landscape\",\"size\":\"1:1\"}",
    "completeTime": 1698765432000,
    "response": {
      "resultUrls": [
        "https://example.com/generated-image.png"
      ]
    },
    "successFlag": 1,
    "status": "SUCCESS",
    "errorCode": null,
    "errorMessage": "",
    "createTime": 1698765400000,
    "progress": "1.00"
  }
}
```

#### Response Fields
| Field | Description |
|-------|-------------|
| `code` | Status code, 200 for success, others for failure |
| `msg` | Response message, error description when failed |
| `data.taskId` | Task ID |
| `data.paramJson` | Complete request parameters as JSON string |
| `data.completeTime` | Completion timestamp |
| `data.response.resultUrls` | Array of generated image URLs |
| `data.successFlag` | Generation status flag: 0=Generating, 1=Success, 2=Failed |
| `data.status` | Status text: `GENERATING`, `SUCCESS`, `CREATE_TASK_FAILED`, `GENERATE_FAILED` |
| `data.errorCode` | Error code when generation failed |
| `data.errorMessage` | Error message when generation failed |
| `data.createTime` | Creation timestamp |
| `data.progress` | Progress as decimal string (0.00 to 1.00) |

#### Success Flag Values
| Value | Status | Description |
|-------|--------|-------------|
| 0 | Generating | Task is in progress |
| 1 | Success | Generation completed successfully |
| 2 | Failed | Generation failed |

#### Status Values
| Status | Description |
|--------|-------------|
| `GENERATING` | Task is in progress |
| `SUCCESS` | Generation completed successfully |
| `CREATE_TASK_FAILED` | Task creation failed |
| `GENERATE_FAILED` | Generation failed |

## Get Direct Download URL

Convert an image URL to a direct download URL to solve cross-domain issues

### Endpoint
```
POST /api/v1/gpt4o-image/download-url
```

### Request Parameters
```json
{
  "taskId": "string (required)",
  "url": "string (required)"
}
```

### Request Example

#### cURL
```bash
curl -X POST "https://api.kie.ai/api/v1/gpt4o-image/download-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "taskId": "task_gpt4o_12345678",
    "url": "https://tempfile.aiquickdraw.com/v/xxxxxxx.png"
  }'
```

### Response Example
```json
{
  "code": 200,
  "msg": "success",
  "data": "https://signed-download-url.com/image.png?signature=..."
}
```

Note: The returned direct download URL is valid for 20 minutes.

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Format Error / Bad Request |
| 401 | Unauthorized |
| 402 | Insufficient Credits |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 451 | Download Failed |
| 455 | Service Unavailable |
| 500 | Server Error |
| 550 | Connection Denied |

## Important Notes

- Generated images are stored for 14 days, after which they expire
- Maximum file size for input images: 25MB
- Supported image formats: .jfif, .pjpeg, .jpeg, .pjp, .jpg, .png, .webp
- At least one of `prompt` or `filesUrl` must be provided
- When using masks, they must match the reference image's dimensions
- Direct download URLs are valid for 20 minutes
- Callback URLs receive POST requests with task completion data

## Integration Notes

This API is designed for integration in the Colibrrri application for GPT Image functionality. The implementation should handle:

1. **Image Processing**: Convert base64 images to public URLs via IMGBB
2. **Async Processing**: Use task polling to wait for generation completion  
3. **Credit Management**: Deduct credits on task creation, refund on failure
4. **Error Handling**: Provide user-friendly error messages based on API responses
5. **Result Storage**: Save generated images to user galleries via Cloudinary

For implementation details, see the GPT Image controller in `server/controllers/gptimage.controller.js`.