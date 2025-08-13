# Vheer AI - AI Image Generation Platform

Transform your photos into stunning anime, cartoon, and artistic styles using advanced AI models.

## Features

- 🎨 **16+ Artistic Styles**: Disney, Pixar, Manga, Cyberpunk, and more
- 🤖 **Multiple AI Models**: Flux Pro, Flux Max, GPT Image
- 🖼️ **Custom Aspect Ratios**: Support for various image dimensions
- ⚡ **Fast Generation**: Optimized for quick results
- 🎯 **High Quality**: Professional-grade output
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

### Frontend
- React 18 with Vite
- TailwindCSS for styling
- React Query for data fetching
- Zustand for state management
- React Router for navigation

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Rate limiting
- CORS protection

### AI Integration
- Flux API (Pro & Max models)
- GPT Image API
- ImgBB for image hosting

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/vheer-clone.git
cd vheer-clone
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

3. Set up environment variables:
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your API keys
```

4. Run development server:
```bash
# From root directory
npm run dev
```

This will start:
- Backend on http://localhost:5000
- Frontend on http://localhost:5173

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions on Render.

## Project Structure

```
vheer-clone/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── stores/      # Zustand stores
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── index.js         # Server entry point
└── render.yaml          # Render deployment config
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Image Generation
- `POST /api/flux/generate` - Generate with Flux models
- `POST /api/gptimage/generate` - Generate with GPT Image

### Gallery
- `GET /api/images` - Get user's images
- `DELETE /api/images/:id` - Delete image

## License

This project is licensed under the MIT License.

---

Made with ❤️ by Vheer AI Team