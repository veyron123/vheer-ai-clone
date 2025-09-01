# KIE.ai Qwen Image Edit API Documentation

## Overview
This document describes the KIE.ai API integration for Qwen image editing functionality.

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

## Create Task (POST)

### Endpoint
```
POST /createTask
```

### Request Structure
```json
{
  "model": "string",
  "callBackUrl": "string (optional)",
  "input": {
    // Input parameters based on form configuration
  }
}
```

### Root Level Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | string | Required | The model name to use for generation (e.g., "qwen/image-edit") |
| `callBackUrl` | string | Optional | Callback URL for task completion notifications |

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Required | - | The prompt to generate the image with (max 2000 chars) |
| `image_url` | string(URL) | Required | - | URL of the image to edit (max 10MB, jpeg/png/webp) |
| `acceleration` | string | Optional | "none" | Acceleration level: 'none', 'regular', 'high' |
| `image_size` | string | Optional | "landscape_4_3" | Output image size |
| `num_inference_steps` | number | Optional | 30 | Number of inference steps (2-49) |
| `seed` | integer | Optional | - | Random seed for reproducible results |
| `guidance_scale` | number | Optional | 4 | CFG scale for prompt adherence (0-20) |
| `sync_mode` | boolean | Optional | false | Wait for generation before response |
| `num_images` | string | Optional | "1" | Number of images to generate (1-4) |
| `enable_safety_checker` | boolean | Optional | true | Enable content safety checking |
| `output_format` | string | Optional | "png" | Output format: "jpeg" or "png" |
| `negative_prompt` | string | Optional | " " | Negative prompt (max 500 chars) |

### Image Size Options
- `square` - Square
- `square_hd` - Square HD
- `portrait_4_3` - Portrait 3:4
- `portrait_16_9` - Portrait 9:16
- `landscape_4_3` - Landscape 4:3
- `landscape_16_9` - Landscape 16:9

### Request Example
```bash
curl -X POST "https://api.kie.ai/api/v1/playground/createTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "qwen/image-edit",
    "callBackUrl": "https://your-domain.com/api/callback",
    "input": {
      "prompt": "Add beautiful flowers to the garden",
      "image_url": "https://file.aiquickdraw.com/custom-page/akr/section-images/1755603225969i6j87xnw.jpg",
      "acceleration": "none",
      "image_size": "landscape_4_3",
      "num_inference_steps": 25,
      "guidance_scale": 4,
      "sync_mode": false,
      "enable_safety_checker": true,
      "output_format": "png",
      "negative_prompt": "blurry, ugly"
    }
  }'
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

## Query Task (GET)

### Endpoint
```
GET /recordInfo?taskId={taskId}
```

### Request Example
```bash
curl -X GET "https://api.kie.ai/api/v1/playground/recordInfo?taskId=task_12345678" \
  -H "Authorization: Bearer YOUR_API_KEY"
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
    "param": "{\"model\":\"qwen/image-edit\",\"input\":{...}}",
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
    "failCode": "",
    "failMsg": "",
    "completeTime": 1698765432000,
    "createTime": 1698765400000,
    "updateTime": 1698765432000
  }
}
```

### Response Fields
- `code` - Status code (200 for success)
- `message` - Response message
- `data.taskId` - Task ID
- `data.model` - Model used
- `data.state` - Task state (waiting, queuing, generating, success, fail)
- `data.param` - Complete request parameters as JSON string
- `data.resultJson` - Result URLs as JSON string
- `data.failCode` - Error code (if failed)
- `data.failMsg` - Error message (if failed)
- `data.completeTime` - Completion timestamp
- `data.createTime` - Creation timestamp
- `data.updateTime` - Update timestamp

## Callback Notifications

When `callBackUrl` is provided, the system sends POST requests upon task completion.

### Success Callback
```json
{
  "code": 200,
  "data": {
    "completeTime": 1755599644000,
    "consumeCredits": 100,
    "costTime": 8,
    "createTime": 1755599634000,
    "model": "qwen/image-edit",
    "param": "{\"callBackUrl\":\"...\",\"model\":\"qwen/image-edit\",\"input\":{...}}",
    "remainedCredits": 2510330,
    "resultJson": "{\"resultUrls\":[\"https://example.com/generated-image.jpg\"]}",
    "state": "success",
    "taskId": "e989621f54392584b05867f87b160672",
    "updateTime": 1755599644000
  },
  "msg": "Playground task completed successfully."
}
```

### Failure Callback
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
    "param": "{...}",
    "remainedCredits": 2510430,
    "state": "fail",
    "taskId": "bd3a37c523149e4adf45a3ddb5faf1a8",
    "updateTime": 1755597097000
  },
  "msg": "Playground task failed."
}
```

## Task States
- `waiting` - Waiting for generation
- `queuing` - In queue
- `generating` - Generating
- `success` - Generation successful
- `fail` - Generation failed

## Important Notes
- Callback content structure is identical to Query Task API response
- The `param` field contains complete Create Task request parameters
- If `callBackUrl` is not provided, no callback notifications are sent
- API Key: `2286be72f9c75b12557518051d46c551`

## Implementation Notes
- Use async/await for API calls
- Implement proper error handling for all states
- Store taskId for status polling
- Handle both sync and async modes appropriately
- Implement callback URL handling for async operations