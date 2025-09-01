# KIE.ai Qwen Image Edit API Documentation

## Overview
This document describes the KIE.ai API integration for Qwen image editing functionality using the playground API.

## API Endpoints

### Base URL
```
https://api.kie.ai/api/v1/playground
```

### Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer YOUR_API_KEY
```

## Create Task

Create a new generation task

### Endpoint
```
POST /api/v1/playground/createTask
```

### Request Parameters
The API accepts a JSON payload with the following structure:

#### Request Body Structure
```json
{
  "model": "string",
  "callBackUrl": "string (optional)",
  "input": {
    // Input parameters based on form configuration
  }
}
```

#### Root Level Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `model` | string | Required | The model name to use for generation | `"qwen/image-edit"` |
| `callBackUrl` | string | Optional | Callback URL for task completion notifications. If provided, the system will send POST requests to this URL when the task completes (success or failure). | `"https://your-domain.com/api/callback"` |

#### Input Object Parameters
The input object contains the following parameters based on the form configuration:

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `prompt` | string | Required | - | The prompt to generate the image with. Max length: 2000 characters | `"Convert to anime style"` |
| `image_url` | string(URL) | Required | - | The URL of the image to edit. File URL after upload, not file content. Accepted types: image/jpeg, image/png, image/webp. Max size: 10.0MB | `"https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg"` |
| `acceleration` | string | Optional | `"none"` | Acceleration level for image generation. Options: 'none', 'regular', 'high'. Higher acceleration increases speed. | `"none"` |
| `image_size` | string | Optional | `"landscape_4_3"` | The size of the generated image | `"landscape_4_3"` |
| `num_inference_steps` | number | Optional | 30 | The number of inference steps to perform. Min: 2, Max: 49 | 25 |
| `seed` | integer | Optional | - | The same seed and the same prompt will output the same image every time | - |
| `guidance_scale` | number | Optional | 4 | The CFG (Classifier Free Guidance) scale. Min: 0, Max: 20 | 4 |
| `sync_mode` | boolean | Optional | false | If true, waits for the image to be generated before returning response | false |
| `num_images` | string | Optional | `"1"` | Number of images to generate. Options: "1", "2", "3", "4" | `"1"` |
| `enable_safety_checker` | boolean | Optional | true | If true, the safety checker will be enabled | true |
| `output_format` | string | Optional | `"png"` | The format of the generated image. Options: "jpeg", "png" | `"png"` |
| `negative_prompt` | string | Optional | `" "` | The negative prompt for the generation. Max length: 500 characters | `"blurry, ugly"` |

#### Available Options

**acceleration:**
- `none` - None
- `regular` - Regular  
- `high` - High

**image_size:**
- `square` - Square
- `square_hd` - Square HD
- `portrait_4_3` - Portrait 3:4
- `portrait_16_9` - Portrait 9:16
- `landscape_4_3` - Landscape 4:3
- `landscape_16_9` - Landscape 16:9

**num_images:**
- `1` - 1 image
- `2` - 2 images  
- `3` - 3 images
- `4` - 4 images

**output_format:**
- `jpeg` - JPEG
- `png` - PNG

### Request Example

#### cURL
```bash
curl -X POST "https://api.kie.ai/api/v1/playground/createTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "qwen/image-edit",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
      "prompt": "Convert this image to anime style with vibrant colors",
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg",
      "acceleration": "none",
      "image_size": "landscape_4_3",
      "num_inference_steps": 25,
      "guidance_scale": 4,
      "sync_mode": false,
      "enable_safety_checker": true,
      "output_format": "png",
      "negative_prompt": "blurry, ugly, low quality"
    }
  }'
```

#### JavaScript
```javascript
const response = await fetch('https://api.kie.ai/api/v1/playground/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'qwen/image-edit',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      prompt: 'Convert this image to anime style with vibrant colors',
      image_url: 'https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg',
      acceleration: 'none',
      image_size: 'landscape_4_3',
      num_inference_steps: 25,
      guidance_scale: 4,
      sync_mode: false,
      enable_safety_checker: true,
      output_format: 'png',
      negative_prompt: 'blurry, ugly, low quality'
    }
  })
});
```

### Response Example
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "taskId": "task_12345678"
  }
}
```

#### Response Fields
| Field | Description |
|-------|-------------|
| `code` | Status code, 200 for success, others for failure |
| `message` | Response message, error description when failed |
| `data.taskId` | Task ID for querying task status |

## Query Task

Query task status and results by task ID

### Endpoint
```
GET /api/v1/playground/recordInfo?taskId=task_12345678
```

### Request Example

#### cURL
```bash
curl -X GET "https://api.kie.ai/api/v1/playground/recordInfo?taskId=task_12345678" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### JavaScript  
```javascript
const response = await fetch('https://api.kie.ai/api/v1/playground/recordInfo?taskId=task_12345678', {
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
  "message": "success", 
  "data": {
    "taskId": "task_12345678",
    "model": "qwen/image-edit",
    "state": "success",
    "param": "{\"model\":\"qwen/image-edit\",\"callBackUrl\":\"https://your-domain.com/api/callback\",\"input\":{\"prompt\":\"Convert this image to anime style\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg\",\"acceleration\":\"none\",\"image_size\":\"landscape_4_3\",\"num_inference_steps\":25,\"seed\":null,\"guidance_scale\":4,\"sync_mode\":false,\"enable_safety_checker\":true,\"output_format\":\"png\",\"negative_prompt\":\"blurry, ugly\"}}",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
    "failCode": "",
    "failMsg": "",
    "completeTime": 1698765432000,
    "createTime": 1698765400000,
    "updateTime": 1698765432000
  }
}
```

#### Response Fields
| Field | Description |
|-------|-------------|
| `code` | Status code, 200 for success, others for failure |
| `message` | Response message, error description when failed |
| `data.taskId` | Task ID |
| `data.model` | Model used for generation |
| `data.state` | Generation state (see State Values below) |
| `data.param` | Complete Create Task request parameters as JSON string |
| `data.resultJson` | Result JSON string containing generated media URLs |
| `data.failCode` | Error code (when generation failed) |
| `data.failMsg` | Error message (when generation failed) |
| `data.completeTime` | Completion timestamp |
| `data.createTime` | Creation timestamp |
| `data.updateTime` | Update timestamp |

#### State Values
| State | Description |
|-------|-------------|
| `waiting` | Waiting for generation |
| `queuing` | In queue |
| `generating` | Generating |
| `success` | Generation successful |
| `fail` | Generation failed |

## Callback Notifications

When you provide the `callBackUrl` parameter when creating a task, the system will send POST requests to the specified URL upon task completion (success or failure).

### Success Callback Example
```json
{
  "code": 200,
  "data": {
    "completeTime": 1755599644000,
    "consumeCredits": 100,
    "costTime": 8,
    "createTime": 1755599634000,
    "model": "qwen/image-edit",
    "param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"qwen/image-edit\",\"input\":{\"prompt\":\"Convert this image to anime style\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg\",\"acceleration\":\"none\",\"image_size\":\"landscape_4_3\",\"num_inference_steps\":25,\"seed\":null,\"guidance_scale\":4,\"sync_mode\":false,\"enable_safety_checker\":true,\"output_format\":\"png\",\"negative_prompt\":\"blurry, ugly\"}}",
    "remainedCredits": 2510330,
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
    "state": "success",
    "taskId": "e989621f54392584b05867f87b160672",
    "updateTime": 1755599644000
  },
  "msg": "Playground task completed successfully."
}
```

### Failure Callback Example  
```json
{
  "code": 501,
  "data": {
    "completeTime": 1755597081000,
    "consumeCredits": 0,
    "costTime": 0,
    "createTime": 1755596341000,
    "failCode": "500",
    "failMsg": "Internal server error",
    "model": "qwen/image-edit",
    "param": "{\"callBackUrl\":\"https://your-domain.com/api/callback\",\"model\":\"qwen/image-edit\",\"input\":{\"prompt\":\"Convert this image to anime style\",\"image_url\":\"https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg\",\"acceleration\":\"none\",\"image_size\":\"landscape_4_3\",\"num_inference_steps\":25,\"seed\":null,\"guidance_scale\":4,\"sync_mode\":false,\"enable_safety_checker\":true,\"output_format\":\"png\",\"negative_prompt\":\"blurry, ugly\"}}",
    "remainedCredits": 2510430,
    "state": "fail",
    "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",
    "updateTime": 1755597097000
  },
  "msg": "Playground task failed."
}
```

## Important Notes

- The callback content structure is identical to the Query Task API response
- The `param` field contains the complete Create Task request parameters, not just the input section  
- If `callBackUrl` is not provided, no callback notifications will be sent
- Maximum file size for `image_url`: 10MB
- Supported image formats: JPEG, PNG, WebP
- Maximum prompt length: 2000 characters
- Maximum negative_prompt length: 500 characters

## Integration Notes

This API is used in the Colibrrri application for Qwen image editing functionality. The implementation handles:

1. **Image Processing**: Converts base64 images to public URLs via Cloudinary
2. **Async Processing**: Uses task polling to wait for generation completion  
3. **Credit Management**: Deducts credits on task creation, refunds on failure
4. **Error Handling**: Provides user-friendly error messages based on API responses

For implementation details, see the Qwen controller in `server/controllers/qwen.controller.js`.