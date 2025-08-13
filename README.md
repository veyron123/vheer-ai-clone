# Vheer Clone - AI Image Generator

A full-stack web application for AI image generation, inspired by vheer.com. Built with Node.js, Express, PostgreSQL, and React.

## Features

- 🎨 AI-powered image generation using multiple models
- 👤 User authentication with JWT
- 💳 Subscription plans and credit system
- 🖼️ Public gallery for sharing creations
- 📱 Responsive design for all devices
- 🔒 Secure image storage with Cloudinary
- 💰 Payment integration ready (Stripe)

## Tech Stack

### Backend
- Node.js & Express
- PostgreSQL with Prisma ORM
- JWT authentication
- Cloudinary for image storage
- Replicate API for AI generation

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Zustand for state management
- React Query for data fetching
- Framer Motion for animations

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Replicate API key
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vheer-clone.git
cd vheer-clone
```

2. Install dependencies:
```bash
npm install
cd client && npm install
cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Deployment on Render

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use the `render.yaml` blueprint for automatic configuration
5. Add the required environment variables:
   - `REPLICATE_API_TOKEN`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `STRIPE_SECRET_KEY` (optional)

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vheer_db"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key

# Replicate API
REPLICATE_API_TOKEN=your_replicate_token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (optional)
STRIPE_SECRET_KEY=your_stripe_key
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Image Generation
- `POST /api/generate` - Generate new images
- `GET /api/generate/models` - Get available models
- `GET /api/generate/styles` - Get available styles
- `GET /api/generate/history` - Get generation history

### Images
- `GET /api/images/gallery` - Get public gallery
- `GET /api/images/my-images` - Get user's images
- `PATCH /api/images/:id/visibility` - Toggle image visibility
- `DELETE /api/images/:id` - Delete image

### Subscriptions
- `GET /api/subscriptions/plans` - Get available plans
- `GET /api/subscriptions/current` - Get current subscription

## License

MIT